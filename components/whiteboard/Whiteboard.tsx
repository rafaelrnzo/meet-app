"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  RoomEvent,
  type RemoteParticipant,
  type LocalParticipant,
  type DataPacket_Kind, // type only
} from "livekit-client";

type Pt = { x: number; y: number };
type Stroke = {
  id: string;
  color: string;
  width: number;
  points: Pt[];
  done?: boolean;
};

type WbMsg =
  | { type: "wb:start"; id: string; color: string; width: number }
  | { type: "wb:pt"; id: string; x: number; y: number }
  | { type: "wb:end"; id: string }
  | { type: "wb:clear" }
  | { type: "wb:undo" }
  | { type: "wb:request_sync" }
  | { type: "wb:full"; strokes: Stroke[] };

const rid = () => Math.random().toString(36).slice(2, 9);

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  if (!s.points.length) return;
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(s.points[0].x, s.points[0].y);
  for (let i = 1; i < s.points.length; i++) ctx.lineTo(s.points[i].x, s.points[i].y);
  ctx.stroke();
}

export default function Whiteboard({
  active,
  onClose,
}: {
  active: boolean;
  onClose?: () => void;
}) {
  const room = useRoomContext();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;

  const [color, setColor] = useState("#00e0ff");
  const [width, setWidth] = useState(4);
  const currentIdRef = useRef<string | null>(null);
  const drawingRef = useRef(false);

  // ========= helpers =========
  const send = async (msg: WbMsg) => {
    try {
      if (!room) return;
      const payload = new TextEncoder().encode(JSON.stringify(msg));
      // Paling kompatibel: tanpa topic; set reliable = true.
      await room.localParticipant.publishData(payload, { reliable: true });
      if (process.env.NODE_ENV !== "production") {
        console.log("[WB] sent:", msg);
      }
    } catch (e) {
      console.error("[WB] publishData error:", e);
    }
  };

  const repaint = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = wrap.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const s of strokesRef.current) drawStroke(ctx, s);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    repaint();
  };

  useEffect(() => {
    resizeCanvas();
    const on = () => resizeCanvas();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  useEffect(() => {
    repaint();
  }, [strokes]);

  // ========= receive data =========
  useEffect(() => {
    if (!room) return;

    const onData = (
      payload: Uint8Array,
      _participant?: RemoteParticipant | LocalParticipant,
      _kind?: DataPacket_Kind,
      _topicOrUndefined?: string
    ) => {
      let msg: WbMsg | null = null;
      try {
        msg = JSON.parse(new TextDecoder().decode(payload));
      } catch {
        return;
      }
      if (!msg || typeof msg !== "object") return;
      if (process.env.NODE_ENV !== "production") {
        console.log("[WB] recv:", msg);
      }

      if (msg.type === "wb:full") {
        setStrokes(msg.strokes || []);
        return;
      }
      if (msg.type === "wb:request_sync") {
        if (strokesRef.current.length) void send({ type: "wb:full", strokes: strokesRef.current });
        return;
      }

      setStrokes((prev) => {
        switch (msg!.type) {
          case "wb:clear":
            return [];
          case "wb:undo": {
            for (let i = prev.length - 1; i >= 0; i--) {
              if (prev[i].done) return prev.slice(0, i).concat(prev.slice(i + 1));
            }
            return prev;
          }
          case "wb:start":
            return prev.concat([{ id: msg.id, color: msg.color, width: msg.width, points: [] }]);
          case "wb:pt": {
            const idx = prev.findIndex((s) => s.id === msg!.id);
            if (idx === -1) return prev;
            const cp = prev.slice();
            cp[idx] = { ...cp[idx], points: cp[idx].points.concat([{ x: msg.x, y: msg.y }]) };
            return cp;
          }
          case "wb:end": {
            const idx = prev.findIndex((s) => s.id === msg!.id);
            if (idx === -1) return prev;
            const cp = prev.slice();
            cp[idx] = { ...cp[idx], done: true };
            return cp;
          }
          default:
            return prev;
        }
      });
    };

    const onParticipantConnected = () => {
      // peserta baru join → minta snapshot dari yang lain
      void send({ type: "wb:request_sync" });
    };

    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);

    // minta snapshot saat mount
    void send({ type: "wb:request_sync" });

    return () => {
      room.off(RoomEvent.DataReceived, onData);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
    };
  }, [room]);

  // ========= drawing (aktif hanya saat active) =========
  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drawingRef.current = true;
    const id = rid();
    currentIdRef.current = id;
    setStrokes((prev) => prev.concat([{ id, color, width, points: [] }]));
    void send({ type: "wb:start", id, color, width });
    const p = getPos(e);
    void send({ type: "wb:pt", id, x: p.x, y: p.y });
    setStrokes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const cp = prev.slice();
      cp[idx] = { ...cp[idx], points: cp[idx].points.concat([p]) };
      return cp;
    });
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active || !drawingRef.current || !currentIdRef.current) return;
    const p = getPos(e);
    const id = currentIdRef.current;
    void send({ type: "wb:pt", id, x: p.x, y: p.y });
    setStrokes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const cp = prev.slice();
      cp[idx] = { ...cp[idx], points: cp[idx].points.concat([p]) };
      return cp;
    });
  };

  const endStroke = () => {
    if (!active || !currentIdRef.current) return;
    const id = currentIdRef.current;
    void send({ type: "wb:end", id });
    setStrokes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const cp = prev.slice();
      cp[idx] = { ...cp[idx], done: true };
      return cp;
    });
    currentIdRef.current = null;
    drawingRef.current = false;
  };

  const onUp = () => endStroke();
  const onLeave = () => endStroke();

  const clearBoard = () => { setStrokes([]); void send({ type: "wb:clear" }); };

  const undoLast = () => {
    for (let i = strokesRef.current.length - 1; i >= 0; i--) {
      if (strokesRef.current[i].done) {
        const id = strokesRef.current[i].id;
        setStrokes((prev) => prev.filter((s) => s.id !== id));
        break;
      }
    }
    void send({ type: "wb:undo" });
  };

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 z-30"
      style={{
        pointerEvents: active ? "auto" : "none",
        opacity: active ? 1 : 0,
        transition: "opacity 120ms ease",
        background: active ? "rgba(20,20,20,0.06)" : "transparent",
        backdropFilter: active ? "saturate(1.1)" : "none",
      }}
    >
      {active && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-2 items-center bg-black/60 border border-white/10 rounded-xl px-3 py-2">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            title="Pick color"
            className="w-8 h-8 p-0 border-0 bg-transparent"
          />
          <input
            type="range"
            min={1}
            max={16}
            value={width}
            onChange={(e) => setWidth(parseInt(e.target.value))}
            title="Brush size"
          />
          <button onClick={undoLast} className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700">
            ↶ Undo
          </button>
          <button onClick={clearBoard} className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700">
            🧹 Clear
          </button>
          {onClose && (
            <button onClick={onClose} className="px-3 py-1 rounded bg-red-600 text-white">
              ✕ Close
            </button>
          )}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="w-full h-full touch-none"
        style={{ cursor: active ? "crosshair" : "default" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onLeave}
      />
    </div>
  );
}
