"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRoomContext } from "@livekit/components-react";
import {
  RoomEvent,
  type RemoteParticipant,
  type LocalParticipant,
  type DataPacket_Kind,
} from "livekit-client";
import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Minus,
  Undo2,
  Trash2,
  X,
  MousePointer2,
} from "lucide-react";

type Pt = { x: number; y: number };

type Tool = "pen" | "rect" | "ellipse" | "line" | "arrow";

type Shape = {
  id: string;
  tool: Tool;
  color: string;
  width: number;
  points: Pt[]; // pen: polyline, shape: [start, end]
  done?: boolean;
};

type WbMsg =
  | { type: "wb:start"; id: string; tool: Tool; color: string; width: number }
  | { type: "wb:pt"; id: string; x: number; y: number }
  | { type: "wb:end"; id: string }
  | { type: "wb:clear" }
  | { type: "wb:undo" }
  | { type: "wb:request_sync" }
  | { type: "wb:full"; shapes: Shape[] };

const rid = () => Math.random().toString(36).slice(2, 9);

/* ---------- DRAWING HELPERS ---------- */

function drawPen(ctx: CanvasRenderingContext2D, s: Shape) {
  if (!s.points.length) return;
  ctx.beginPath();
  ctx.moveTo(s.points[0].x, s.points[0].y);
  for (let i = 1; i < s.points.length; i++) {
    ctx.lineTo(s.points[i].x, s.points[i].y);
  }
  ctx.stroke();
}

function drawRect(ctx: CanvasRenderingContext2D, s: Shape) {
  if (s.points.length < 2) return;
  const [p0, p1] = s.points;
  const x = Math.min(p0.x, p1.x);
  const y = Math.min(p0.y, p1.y);
  const w = Math.abs(p1.x - p0.x);
  const h = Math.abs(p1.y - p0.y);
  ctx.strokeRect(x, y, w, h);
}

function drawEllipse(ctx: CanvasRenderingContext2D, s: Shape) {
  if (s.points.length < 2) return;
  const [p0, p1] = s.points;
  const cx = (p0.x + p1.x) / 2;
  const cy = (p0.y + p1.y) / 2;
  const rx = Math.abs(p1.x - p0.x) / 2;
  const ry = Math.abs(p1.y - p0.y) / 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLine(ctx: CanvasRenderingContext2D, s: Shape) {
  if (s.points.length < 2) return;
  const [p0, p1] = s.points;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, s: Shape) {
  if (s.points.length < 2) return;
  const [p0, p1] = s.points;
  ctx.beginPath();
  ctx.moveTo(p0.x, p0.y);
  ctx.lineTo(p1.x, p1.y);
  ctx.stroke();

  // arrow head
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  const len = 12;
  const a1 = angle - Math.PI / 7;
  const a2 = angle + Math.PI / 7;

  const p2 = { x: p1.x - len * Math.cos(a1), y: p1.y - len * Math.sin(a1) };
  const p3 = { x: p1.x - len * Math.cos(a2), y: p1.y - len * Math.sin(a2) };

  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.closePath();
  ctx.fillStyle = ctx.strokeStyle;
  ctx.fill();
}

/** Gambar 1 shape */
function drawShape(ctx: CanvasRenderingContext2D, s: Shape) {
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (s.tool) {
    case "pen":
      drawPen(ctx, s);
      break;
    case "rect":
      drawRect(ctx, s);
      break;
    case "ellipse":
      drawEllipse(ctx, s);
      break;
    case "line":
      drawLine(ctx, s);
      break;
    case "arrow":
      drawArrow(ctx, s);
      break;
  }
}

/* ---------- COMPONENT ---------- */

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

  const [shapes, setShapes] = useState<Shape[]>([]);
  const shapesRef = useRef(shapes);
  shapesRef.current = shapes;

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#00e0ff");
  const [width, setWidth] = useState(4);

  const currentIdRef = useRef<string | null>(null);
  const drawingRef = useRef(false);

  const send = useCallback(
    async (msg: WbMsg) => {
      try {
        if (!room || room.state !== "connected") return;
        const payload = new TextEncoder().encode(JSON.stringify(msg));
        await room.localParticipant.publishData(payload, { reliable: true });
        if (process.env.NODE_ENV !== "production") {
          console.log("[WB] sent:", msg);
        }
      } catch (e) {
        console.error("[WB] publishData error:", e);
      }
    },
    [room]
  );


  const repaint = () => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = wrap.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    for (const s of shapesRef.current) drawShape(ctx, s);
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
  }, [shapes]);

  /* ---------- LiveKit data handling ---------- */

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
        setShapes(msg.shapes || []);
        return;
      }
      if (msg.type === "wb:request_sync") {
        if (shapesRef.current.length) {
          void send({ type: "wb:full", shapes: shapesRef.current });
        }
        return;
      }

      setShapes((prev) => {
        switch (msg!.type) {
          case "wb:clear":
            return [];
          case "wb:undo": {
            for (let i = prev.length - 1; i >= 0; i--) {
              if (prev[i].done) return prev.slice(0, i).concat(prev.slice(i + 1));
            }
            return prev;
          }
          case "wb:start": {
            const { id, tool, color, width } = msg;
            return prev.concat([{ id, tool, color, width, points: [] }]);
          }
          case "wb:pt": {
            const idx = prev.findIndex((s) => s.id === msg!.id);
            if (idx === -1) return prev;
            const cp = prev.slice();
            const shape = cp[idx];
            const p = { x: msg.x, y: msg.y };

            if (shape.tool === "pen") {
              shape.points = shape.points.concat([p]);
            } else {
              // shape (rect, ellipse, line, arrow): pakai 2 titik [start, end]
              if (!shape.points.length) {
                shape.points = [p, p];
              } else if (shape.points.length === 1) {
                shape.points = [shape.points[0], p];
              } else {
                shape.points = [shape.points[0], p];
              }
            }
            cp[idx] = { ...shape };
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
      void send({ type: "wb:request_sync" });
    };

    room.on(RoomEvent.DataReceived, onData);
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected);
    void send({ type: "wb:request_sync" });

    return () => {
      room.off(RoomEvent.DataReceived, onData);
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected);
    };
  }, [room, send]);

  /* ---------- Pointer handlers ---------- */

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
    const p = getPos(e);

    setShapes((prev) =>
      prev.concat([
        {
          id,
          tool,
          color,
          width,
          points: tool === "pen" ? [p] : [p, p], // untuk shape, langsung punya start & end awal sama
        },
      ])
    );

    void send({ type: "wb:start", id, tool, color, width });
    void send({ type: "wb:pt", id, x: p.x, y: p.y });
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!active || !drawingRef.current || !currentIdRef.current) return;
    const p = getPos(e);
    const id = currentIdRef.current;

    void send({ type: "wb:pt", id, x: p.x, y: p.y });

    setShapes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const cp = prev.slice();
      const shape = cp[idx];

      if (shape.tool === "pen") {
        shape.points = shape.points.concat([p]);
      } else {
        if (!shape.points.length) {
          shape.points = [p, p];
        } else if (shape.points.length === 1) {
          shape.points = [shape.points[0], p];
        } else {
          shape.points = [shape.points[0], p];
        }
      }
      cp[idx] = { ...shape };
      return cp;
    });
  };

  const endShape = () => {
    if (!active || !currentIdRef.current) return;
    const id = currentIdRef.current;
    void send({ type: "wb:end", id });
    setShapes((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      if (idx === -1) return prev;
      const cp = prev.slice();
      cp[idx] = { ...cp[idx], done: true };
      return cp;
    });
    currentIdRef.current = null;
    drawingRef.current = false;
  };

  const onUp = () => endShape();
  const onLeave = () => endShape();

  /* ---------- Actions ---------- */

  const clearBoard = () => {
    setShapes([]);
    void send({ type: "wb:clear" });
  };

  const undoLast = () => {
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      if (shapesRef.current[i].done) {
        const id = shapesRef.current[i].id;
        setShapes((prev) => prev.filter((s) => s.id !== id));
        break;
      }
    }
    void send({ type: "wb:undo" });
  };

  /* ---------- UI ---------- */

  const PRESET_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#3b82f6", // blue
    "#a855f7", // purple
    "#ffffff", // white
    "#000000", // black
  ];

  return (
    <div
      ref={wrapRef}
      className={`absolute inset-0 z-30 transition-all duration-300 ${active ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      style={{
        background: active ? "rgba(0,0,0,0.4)" : "transparent",
        backdropFilter: active ? "blur(4px)" : "none",
      }}
    >
      {active && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Toolbar Island */}
          <div className="flex items-center p-2 rounded-2xl bg-background/95 backdrop-blur-md border border-border shadow-2xl ring-1 ring-black/5">
            {/* Tools Group */}
            <div className="flex items-center gap-1 pr-3 border-r border-border/50">
              <button
                onClick={() => setTool("pen")}
                className={`p-2 rounded-xl transition-all ${tool === "pen"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                title="Pen"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool("rect")}
                className={`p-2 rounded-xl transition-all ${tool === "rect"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                title="Rectangle"
              >
                <Square className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool("ellipse")}
                className={`p-2 rounded-xl transition-all ${tool === "ellipse"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                title="Ellipse"
              >
                <Circle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool("arrow")}
                className={`p-2 rounded-xl transition-all ${tool === "arrow"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                title="Arrow"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTool("line")}
                className={`p-2 rounded-xl transition-all ${tool === "line"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                title="Line"
              >
                <Minus className="w-4 h-4 -rotate-45" />
              </button>
            </div>

            {/* Config Group */}
            <div className="flex items-center gap-3 px-3 border-r border-border/50">
              {/* Color Picker */}
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.slice(0, 4).map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-110 ${color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                      }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="relative group ml-1">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-500 to-pink-500 ring-1 ring-border cursor-pointer" />
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Width Slider */}
              <div className="w-px h-8 bg-border/50 mx-1" />

              <input
                type="range"
                min={1}
                max={20}
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                className="w-20 accent-primary h-1.5 bg-muted rounded-full appearance-none cursor-pointer"
                title={`Brush size: ${width}px`}
              />
            </div>

            {/* Actions Group */}
            <div className="flex items-center gap-1 pl-3">
              <button
                onClick={undoLast}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Undo"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={clearBoard}
                className="p-2 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Clear All"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="w-px h-8 bg-border/50 mx-1" />
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Close Whiteboard"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={`w-full h-full touch-none outline-none ${active ? "cursor-crosshair" : ""}`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onLeave}
      />
    </div>
  );
}
