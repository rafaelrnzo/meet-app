"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Bold, Italic, List, ListOrdered, Download, FileText, ChevronLeft, Loader2, Heading1, Heading2, Heading3 } from "lucide-react";
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
    | { type: "notes:update"; content: string; timestamp: number }
    | { type: "notes:req_sync" }
    | { type: "notes:sync"; content: string; timestamp: number };

export function SharedNotes({ isAdmin, onBack, roomName }: SharedNotesProps) {
    const room = useRoomContext();
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const lastUpdateRef = useRef<number>(0);

    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Markdown.configure({
                html: true,
                transformPastedText: true,
                transformCopiedText: true,
            })
        ],
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

    // Handle outside click for export menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setShowExportMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

            // Ignore own messages
            if (participant?.identity === room.localParticipant.identity) return;

            if (msg.type === "notes:update" || msg.type === "notes:sync") {
                // Determine if we should update local state
                // If we are admin, we only update if the incoming message is newer than what we last wrote/received
                // AND we are not currently typing heavily (which is hard to know, but timestamp helps)

                const isNewer = msg.timestamp > lastUpdateRef.current;

                if (isNewer) {
                    if (editor && msg.content !== editor.getHTML()) {
                        // Save cursor position if possible? Tiptap might handle it, but setContent often resets cursor.
                        // For now, simple setContent. Collaborative editing usually needs Yjs.
                        editor.commands.setContent(msg.content);
                    }
                    lastUpdateRef.current = msg.timestamp;
                }
            } else if (msg.type === "notes:req_sync") {
                // If I am admin, I should reply with current state
                // Only one admin needs to reply to avoid specific storms, but typically collisions are handled by receiver
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

    const handleExportPDF = async () => {
        setIsExporting(true);
        setShowExportMenu(false);
        try {
            // Dynamic import to avoid SSR issues
            const html2pdf = (await import("html2pdf.js")).default;

            const element = document.createElement("div");
            element.id = "pdf-export-element";
            Object.assign(element.style, {
                position: "absolute",
                left: "-9999px",
                top: "0",
                width: "210mm",
                backgroundColor: "white",
                color: "black",
                padding: "20px"
            });

            element.innerHTML = `
                <div style="font-family: Arial, sans-serif;">
                    <h1 style="border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px;">Meeting Notes</h1>
                    <div style="margin-bottom: 20px; color: #666; font-size: 14px;">
                        <strong>Room:</strong> ${roomName}<br/>
                        <strong>Date:</strong> ${new Date().toLocaleString()}
                    </div>
                    <div class="prose" style="color: black; max-width: none;">
                        ${editor?.getHTML() || ""}
                    </div>
                </div>
            `;

            document.body.appendChild(element);

            const opt = {
                margin: 10,
                filename: `meeting-notes-${new Date().toISOString().slice(0, 10)}.pdf`,
                image: { type: 'jpeg' as const, quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
            };

            await html2pdf().set(opt).from(element).save();

            document.body.removeChild(element);
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
        setShowExportMenu(false);
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
            <div className="flex flex-wrap items-center justify-between p-2 border-b border-border bg-card/80 backdrop-blur sticky top-0 z-10 gap-y-2">
                <div className="flex flex-wrap items-center gap-1">
                    <button
                        onClick={onBack}
                        className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mr-2"
                        title="Back"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    {isAdmin ? (
                        <div className="flex flex-wrap items-center gap-1">
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
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                isActive={editor.isActive("heading", { level: 1 })}
                                icon={<Heading1 className="w-4 h-4" />}
                                title="H1"
                            />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                isActive={editor.isActive("heading", { level: 2 })}
                                icon={<Heading2 className="w-4 h-4" />}
                                title="H2"
                            />
                            <ToolbarBtn
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                isActive={editor.isActive("heading", { level: 3 })}
                                icon={<Heading3 className="w-4 h-4" />}
                                title="H3"
                            />
                            <div className="w-px h-4 bg-border mx-1" />
                            <div className="flex items-center">
                                <input
                                    type="color"
                                    onInput={(event) => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
                                    value={editor.getAttributes("textStyle").color || "#000000"}
                                    className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                                    title="Text Color"
                                />
                            </div>
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
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground italic px-2">View Only</span>
                    )}
                </div>

                <div className="flex items-center gap-2" ref={exportMenuRef}>
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            disabled={isExporting}
                            title="Export Notes"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        </button>

                        {/* Dropdown for export */}
                        {showExportMenu && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-popover border border-border rounded-md shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                    onClick={handleExportPDF}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 rounded-t-md"
                                >
                                    <FileText className="w-3 h-3" /> PDF
                                </button>
                                <button
                                    onClick={handleExportTXT}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted flex items-center gap-2 rounded-b-md"
                                >
                                    <FileText className="w-3 h-3" /> Text
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-y-auto cursor-text p-4" onClick={() => editor.chain().focus().run()}>
                <EditorContent editor={editor} className="h-full min-h-[300px]" />
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
                .ProseMirror h1 {
                    font-size: 2em;
                    font-weight: bold;
                    margin-top: 0.67em;
                    margin-bottom: 0.67em;
                    line-height: 1.2;
                }
                .ProseMirror h2 {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-top: 0.83em;
                    margin-bottom: 0.83em;
                    line-height: 1.3;
                }
                .ProseMirror h3 {
                    font-size: 1.17em;
                    font-weight: bold;
                    margin-top: 1em;
                    margin-bottom: 1em;
                    line-height: 1.4;
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
            className={`p-1.5 rounded transition-colors flex items-center justify-center ${isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
        >
            {icon}
        </button>
    );
}
