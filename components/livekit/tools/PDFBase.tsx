"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, X } from "lucide-react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { updateRoomPermissions } from "@/lib/api/admin-api";
import { toast } from "sonner";

import { Worker, Viewer } from '@react-pdf-viewer/core';
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation';
import '@react-pdf-viewer/core/lib/styles/index.css';

// We use pdfjs-dist@3.11.174 which is compatible with @react-pdf-viewer/core@3.12.0
const workerUrl = `https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;

interface PDFSlideViewerProps {
    url: string;
    isOpen: boolean;
    onClose: () => void;
    isAdmin: boolean;
    roomName: string;
    mode?: "overlay" | "embedded";
    onToggleMinimize?: () => void;
    isMinimized?: boolean;
}

export default function PDFBase({
    url,
    isOpen,
    onClose,
    isAdmin,
    roomName,
    mode = "overlay",
    onToggleMinimize,
    isMinimized = false
}: PDFSlideViewerProps) {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [isLoading, setIsLoading] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();

    // We don't use jumpToPage from pageNavigationPluginInstance because it causes hook order issues and loses context
    // Instead we use the pageNumber state natively with the `initialPage` and `key` props on the Viewer
    const pageNavigationPluginInstance = pageNavigationPlugin();
    const plugins = useMemo(() => [pageNavigationPluginInstance], [pageNavigationPluginInstance]);

    useEffect(() => {
        setPageNumber(1);
        setIsLoading(true);
    }, [url]);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                containerRef.current.getBoundingClientRect();
            }
        };

        window.addEventListener("resize", handleResize);
        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, [isOpen, isMinimized, mode]);

    useEffect(() => {
        if (!room) return;

        const checkMetadata = () => {
            try {
                const md = room.metadata ? JSON.parse(room.metadata) : {};
                if (md.presentation && typeof md.presentation.page === "number") {
                    setPageNumber(md.presentation.page);
                }
            } catch (e) {
                console.error("Failed to parse metadata", e);
            }
        };
        checkMetadata();

        room.on(RoomEvent.RoomMetadataChanged, checkMetadata);
        return () => {
            room.off(RoomEvent.RoomMetadataChanged, checkMetadata);
        };
    }, [room, numPages]);

    const handleDocumentLoad = (e: any) => {
        setNumPages(e.doc.numPages);
        setIsLoading(false);

        // Sync to correct page on initial load
        if (room?.metadata) {
            try {
                const md = JSON.parse(room.metadata);
                if (md.presentation && typeof md.presentation.page === "number") {
                    setPageNumber(md.presentation.page);
                }
            } catch (err) { }
        }
    };

    const handlePageChange = (e: any) => {
        // e.currentPage is 0-indexed
        setPageNumber(e.currentPage + 1);
    };

    const changePage = async (offset: number) => {
        const newPage = pageNumber + offset;
        if (newPage >= 1 && newPage <= numPages) {
            setPageNumber(newPage);

            if (isAdmin) {
                try {
                    const currentMeta = room?.metadata ? JSON.parse(room.metadata) : {};
                    const newMeta = {
                        ...currentMeta,
                        presentation: {
                            ...currentMeta.presentation,
                            page: newPage,
                        },
                    };
                    await updateRoomPermissions(roomName, newMeta);
                } catch (e) {
                    console.error("Failed to sync page", e);
                    toast.error("Failed to sync slide position");
                }
            }
        }
    };

    if (!isOpen || !url) return null;

    return (
        <div
            ref={containerRef}
            className={`
                relative bg-background border border-border shadow-md overflow-hidden flex flex-col
                ${mode === "overlay"
                    ? `fixed z-[60] shadow-2xl transition-all duration-300 ease-in-out ${isMinimized
                        ? "w-[320px] h-[240px] bottom-5 right-5 rounded-lg"
                        : "inset-4 md:inset-10 rounded-xl"
                    }`
                    : "w-full h-full rounded-lg"
                }
            `}
        >
            {/* Header / Controls */}
            <div className={`
                flex items-center justify-between px-4 py-2 bg-muted/80 backdrop-blur text-foreground border-b border-border z-10
                ${isMinimized ? "px-2 py-1" : ""}
            `}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm font-semibold truncate">Presentation</span>
                    {!isMinimized && (
                        <span className="text-xs text-muted-foreground">
                            ({pageNumber} / {numPages || "-"})
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {mode === "overlay" && onToggleMinimize && (
                        <button
                            onClick={onToggleMinimize}
                            className="p-1.5 hover:bg-background/80 hover:text-foreground rounded transition-colors"
                        >
                            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-muted/30 dark:bg-black/40">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground gap-2 z-10">
                        <Loader2 className="animate-spin" />
                        <span>Loading Slides...</span>
                    </div>
                )}

                <div className="w-full h-full flex flex-col">
                    <Worker workerUrl={workerUrl}>
                        <Viewer
                            key={`pdf-viewer-page-${pageNumber}`}
                            fileUrl={url}
                            plugins={plugins}
                            onDocumentLoad={handleDocumentLoad}
                            onPageChange={handlePageChange}
                            initialPage={pageNumber - 1}
                            theme="dark"
                        />
                    </Worker>
                </div>

                {/* Overlay Controls (Previous/Next) */}
                {!isMinimized && !isLoading && (
                    <>
                        <button
                            onClick={() => changePage(-1)}
                            disabled={pageNumber <= 1}
                            className={`
                                absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full 
                                bg-background/80 text-foreground hover:bg-background border border-border backdrop-blur shadow-sm transition-all z-20
                                disabled:opacity-0 disabled:pointer-events-none
                                ${!isAdmin ? "hidden" : ""}
                            `}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <button
                            onClick={() => changePage(1)}
                            disabled={pageNumber >= numPages}
                            className={`
                                absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full 
                                bg-background/80 text-foreground hover:bg-background border border-border backdrop-blur shadow-sm transition-all z-20
                                disabled:opacity-0 disabled:pointer-events-none
                                ${!isAdmin ? "hidden" : ""}
                            `}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Footer Control Bar */}
            {!isMinimized && !isLoading && (
                <div className="p-3 bg-muted/80 backdrop-blur border-t border-border flex items-center justify-center gap-4 text-foreground z-10">
                    <button
                        onClick={() => changePage(-1)}
                        disabled={pageNumber <= 1 || !isAdmin}
                        className="p-2 hover:bg-background/80 rounded disabled:opacity-50 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-medium min-w-[3rem] text-center">
                        {pageNumber} / {numPages || "-"}
                    </span>

                    <button
                        onClick={() => changePage(1)}
                        disabled={pageNumber >= numPages || !isAdmin}
                        className="p-2 hover:bg-background/80 rounded disabled:opacity-50 text-muted-foreground hover:text-foreground disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {!isAdmin && (
                        <span className="absolute right-4 text-xs text-muted-foreground flex items-center gap-1">
                            Controlled by Host
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
