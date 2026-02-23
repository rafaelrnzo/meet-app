import React, { useRef, useState } from "react";
import { Clipboard, Send } from "lucide-react";

interface ChatInputProps {
    activeParticipantName: string;
    onSendText: (value: string) => Promise<void>;
    onSendImage: (file: File) => Promise<void>;
}

export function ChatInput({ activeParticipantName, onSendText, onSendImage }: ChatInputProps) {
    const [value, setValue] = useState("");
    const fileRef = useRef<HTMLInputElement | null>(null);

    const handlePaste = async (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.type.indexOf("image") !== -1) {
                e.preventDefault();
                const file = item.getAsFile();
                if (file) {
                    await onSendImage(file);
                }
                break;
            }
        }
    };

    const handleSendText = async () => {
        const t = value.trim();
        if (!t) return;
        await onSendText(t);
        setValue("");
    };

    return (
        <div className="p-3 border-t border-border bg-muted/30">
            <div className="flex gap-2 items-center">
                <input
                    className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/70 transition-all"
                    placeholder={`Message ${activeParticipantName}...`}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onPaste={handlePaste}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendText();
                        }
                    }}
                />

                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        await onSendImage(f);
                        e.currentTarget.value = "";
                    }}
                />

                <button
                    onClick={() => fileRef.current?.click()}
                    className="h-9 px-3 rounded-lg text-sm font-medium border border-border bg-card text-foreground hover:bg-muted transition-all"
                    title="Send image"
                >
                    <Clipboard className="w-4 h-4 " />
                </button>

                <button
                    onClick={handleSendText}
                    disabled={!value.trim()}
                    className="h-9 p-2 rounded-lg text-sm font-medium border border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-4 h-4 " />
                </button>
            </div>
        </div>
    );
}
