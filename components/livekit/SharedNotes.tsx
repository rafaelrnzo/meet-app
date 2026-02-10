"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered, Download, FileText, ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRoomContext } from "@livekit/components-react";
import { RoomEvent, DataPacket_Kind, RemoteParticipant, LocalParticipant } from "livekit-client";
import { toast } from "sonner";

interface SharedNotesProps {
    isAdmin: boolean;
    onBack: () => void;
    roomName: string;
}

type NotesMsg =
    | { type: "notes:update"; content: string; timestamp: number } // content is HTML
    | { type: "notes:req_sync" }
    | { type: "notes:sync"; content: string; timestamp: number };

export function SharedNotes({ isAdmin, onBack, roomName }: SharedNotesProps) {
    const room = useRoomContext();
    const [isExporting, setIsExporting] = useState(false);

    // We keep track of the last update timestamp to resolve conflicts simply (last write wins primarily, but actually we just trust the host/admin broadcasts)
    const lastUpdateRef = useRef<number>(0);

    const editor = useEditor({
        extensions: [StarterKit],
        content: "<p>Meeting notes...</p>",
        editable: isAdmin,
        editorProps: {
            attributes: {
                class: "prose prose-sm prose-invert focus:outline-none max-w-none min-h-[300px] px-4 py-2",
            },
        },
        onUpdate: ({ editor }) => {
            if (!isAdmin) return;
            const html = editor.getHTML();
            broadcastUpdate(html);
        },
        immediatelyRender: false,
    });

    // Update editable state if admin status changes
    useEffect(() => {
        if (editor) {
            editor.setEditable(isAdmin);
        }
    }, [isAdmin, editor]);

    // Broadcast logic
    const broadcastUpdate = useCallback(
        async (content: string) => {
            if (!room) return;
            const now = Date.now();
            lastUpdateRef.current = now;

            const msg: NotesMsg = { type: "notes:update", content, timestamp: now };
            const payload = new TextEncoder().encode(JSON.stringify(msg));

            try {
                await room.localParticipant.publishData(payload, { reliable: true, topic: "notes" });
            } catch (error) {
                console.error("Failed to broadcast notes update:", error);
            }
        },
        [room]
    );

    const sendSync = useCallback(
        async (content: string) => {
            if (!room) return;
            const msg: NotesMsg = { type: "notes:sync", content, timestamp: lastUpdateRef.current };
            const payload = new TextEncoder().encode(JSON.stringify(msg));
            try {
                await room.localParticipant.publishData(payload, { reliable: true, topic: "notes" });
            } catch (error) {
                console.error("Failed to send notes sync:", error);
            }
        },
        [room]
    );

    const requestSync = useCallback(async () => {
        if (!room) return;
        const msg: NotesMsg = { type: "notes:req_sync" };
        const payload = new TextEncoder().encode(JSON.stringify(msg));
        try {
            await room.localParticipant.publishData(payload, { reliable: true, topic: "notes" });
        } catch (error) {
            console.error("Failed to request notes sync:", error);
        }
    }, [room]);


    // Data handling
    useEffect(() => {
        if (!room) return;

        const onData = (
            payload: Uint8Array,
            participant?: RemoteParticipant | LocalParticipant,
            _kind?: DataPacket_Kind,
            topic?: string
        ) => {
            if (topic !== "notes") return;

            let msg: NotesMsg;
            try {
                msg = JSON.parse(new TextDecoder().decode(payload));
            } catch (e) {
                console.error("Failed to parse notes message", e);
                return;
            }

            // Ignore own messages usually, but keeping logic simple
            if (participant?.identity === room.localParticipant.identity) return;

            if (msg.type === "notes:update" || msg.type === "notes:sync") {
                // If I am admin and typing, chance of conflict. 
                // Simple logic: if incoming timestamp > my last known state, update.
                // Or if I am NOT admin, always accept update.
                if (!isAdmin) {
                    if (editor && msg.content !== editor.getHTML()) {
                        // Preserve selection if possible? Hard with full replacement.
                        // Just replace content.
                        editor.commands.setContent(msg.content);
                    }
                    lastUpdateRef.current = msg.timestamp;
                }
            } else if (msg.type === "notes:req_sync") {
                // If I am admin, I should reply with current state
                if (isAdmin && editor) {
                    sendSync(editor.getHTML());
                }
            }
        };

        room.on(RoomEvent.DataReceived, onData);

        // Request initial sync on mount
        requestSync();

        return () => {
            room.off(RoomEvent.DataReceived, onData);
        };
    }, [room, editor, isAdmin, sendSync, requestSync]);

    // Allow re-sync on participant connect if we are admin? 
    // Maybe overkill, req_sync handles it.

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            // Dynamic import to avoid SSR issues
            const html2pdf = (await import("html2pdf.js")).default;

            const element = document.createElement("div");
            element.innerHTML = `
                <div style="padding: 20px; font-family: Arial, sans-serif; color: black;">
                    <h1 style="border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">Meeting Notes</h1>
                    <div style="margin-bottom: 10px; color: #666; font-size: 14px;">
                        <strong>Room:</strong> ${roomName}<br/>
                        <strong>Date:</strong> ${new Date().toLocaleString()}
                    </div>
                    <div class="prose" style="color: black;">
                        ${editor?.getHTML() || ""}
                    </div>
                </div>
            `;

            const opt = {
                margin: 10,
                filename: `meeting-notes-${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };

            await html2pdf().set(opt).from(element).save();
            toast.success("Notes exported to PDF");
        } catch (e: any) {
            console.error("Export failed", e);
            toast.error("Failed to export PDF");
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportTXT = () => {
        if (!editor) return;
        const text = editor.getText();
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meeting-notes-${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Notes exported to TXT");
    };

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col h-full bg-card/50">
            {/* Header / Toolbar */}
            <div className="flex items-center justify-between p-2 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10">
                <div className="flex items-center gap-1">
                    <button
                        onClick={onBack}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-1"
                        title="Back"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    {isAdmin && (
                        <>
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                isActive={editor.isActive("bold")}
                                icon={<Bold className="w-4 h-4" />}
                                title="Bold"
                            />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                isActive={editor.isActive("italic")}
                                icon={<Italic className="w-4 h-4" />}
                                title="Italic"
                            />
                            <div className="w-px h-4 bg-border mx-1" />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                isActive={editor.isActive("bulletList")}
                                icon={<List className="w-4 h-4" />}
                                title="Bullet List"
                            />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                isActive={editor.isActive("orderedList")}
                                icon={<ListOrdered className="w-4 h-4" />}
                                title="Ordered List"
                            />
                        </>
                    )}
                    {!isAdmin && (
                        <span className="text-xs text-muted-foreground italic pl-2">View Only</span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    <div className="relative group">
                        <button
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            disabled={isExporting}
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>
                        {/* Dropdown for export */}
                        <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg hidden group-hover:block z-50">
                            <button
                                onClick={handleExportPDF}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
                            >
                                <FileText className="w-3 h-3" /> PDF
                            </button>
                            <button
                                onClick={handleExportTXT}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-muted flex items-center gap-2"
                            >
                                <FileText className="w-3 h-3" /> Text
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto cursor-text" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} className="h-full" />
            </div>

            <style jsx global>{`
                .ProseMirror {
                    height: 100%;
                    min-height: 200px;
                    outline: none;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }
                .ProseMirror ul {
                    list-style-type: disc;
                    padding-left: 1.5em;
                }
                .ProseMirror ol {
                    list-style-type: decimal;
                    padding-left: 1.5em;
                }
            `}</style>
        </div>
    );
}

function ToolbarBtn({ onClick, isActive, icon, title }: { onClick: () => void; isActive: boolean; icon: React.ReactNode, title: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition-colors ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
        >
            {icon}
        </button>
    );
}
