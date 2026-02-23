"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Minimize2, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PresentationViewerProps {
    url: string;
    isOpen: boolean;
    onClose: () => void;
    onDock?: () => void;
    mode?: "overlay" | "embedded";
}

export function PresentationViewer({ url, isOpen, onClose, onDock, mode = "overlay" }: PresentationViewerProps) {
    const [isMinimized, setIsMinimized] = useState(false);

    if (!isOpen || !url) return null;

    if (mode === "embedded") {
        return (
            <div className="w-full h-full flex flex-col bg-white rounded-lg overflow-hidden border border-border relative group">
                {/* Header for Embedded Mode - simplified */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => window.open(url, "_blank")}
                        className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm"
                        title="Open in new tab"
                    >
                        <ExternalLink className="h-4 w-4" />
                    </button>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors backdrop-blur-sm"
                        title="Close Presentation"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <iframe
                    src={url}
                    className="flex-1 w-full h-full border-0"
                    title="Presentation"
                />
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    width: isMinimized ? "320px" : "80%",
                    height: isMinimized ? "60px" : "80%",
                    bottom: isMinimized ? "20px" : "10%",
                    right: isMinimized ? "20px" : "10%",
                    left: isMinimized ? "auto" : "10%",
                    top: isMinimized ? "auto" : "10%",
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="fixed z-[60] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
            >
                <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        Presentation
                        {isMinimized && <span className="text-xs text-muted-foreground ml-2">(Minimized)</span>}
                    </h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => window.open(url, "_blank")}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Open in new tab"
                        >
                            <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={onDock}
                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Dock to Sidebar"
                        >
                            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 1h12a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-12a.5.5 0 0 1-.5-.5v-12a.5.5 0 0 1 .5-.5zm0 1v11h9V2h-9z" fill="currentColor" opacity="0.8" /></svg>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <div className="flex-1 bg-white relative">
                        <iframe
                            src={url}
                            className="absolute inset-0 w-full h-full border-0"
                            title="Presentation"
                        />
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
