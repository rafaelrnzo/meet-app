"use client";

import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Minimize2, X } from "lucide-react";
import { useRoomContext, useLocalParticipant } from "@livekit/components-react";
import { RoomEvent, DataPacket_Kind } from "livekit-client";
import { updateRoomPermissions } from "@/lib/api/admin-api";
import { toast } from "sonner";



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

export function PDFSlideViewer({
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
    const [scale, setScale] = useState(1.0);
    const containerRef = useRef<HTMLDivElement>(null);
    const room = useRoomContext();
    const { localParticipant } = useLocalParticipant();
    useEffect(() => {
        pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    }, []);

    useEffect(() => {
        setPageNumber(1);
        setIsLoading(true);
    }, [url]);

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
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
                if (md.presentation && typeof md.presentation.page === 'number') {
                    setPageNumber(md.presentation.page);
                }
            } catch (e) {
                console.error("Failed to parse metadata", e);
            }
        };
        checkMetadata();

        const onMetadataChanged = () => checkMetadata();

        room.on(RoomEvent.RoomMetadataChanged, onMetadataChanged);
        return () => {
            room.off(RoomEvent.RoomMetadataChanged, onMetadataChanged);
        };
    }, [room]);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setIsLoading(false);
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
                            page: newPage
                        }
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
                relative bg-gray-900 border border-gray-800 overflow-hidden flex flex-col
                ${mode === 'overlay'
                    ? `fixed z-[60] shadow-2xl transition-all duration-300 ease-in-out ${isMinimized
                        ? "w-[320px] h-[240px] bottom-5 right-5 rounded-lg"
                        : "inset-4 md:inset-10 rounded-xl"}`
                    : "w-full h-full rounded-lg"
                }
            `}
        >
            {/* Header / Controls */}
            <div className={`
                flex items-center justify-between px-4 py-2 bg-gray-800/90 backdrop-blur text-white z-10
                ${isMinimized ? "px-2 py-1" : ""}
            `}>
                <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-sm font-semibold truncate">Presentation</span>
                    {!isMinimized && (
                        <span className="text-xs text-gray-400">
                            ({pageNumber} / {numPages || '-'})
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {mode === 'overlay' && onToggleMinimize && (
                        <button
                            onClick={onToggleMinimize}
                            className="p-1.5 hover:bg-white/10 rounded transition-colors"
                        >
                            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-red-500/80 rounded transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 relative overflow-auto flex items-center justify-center bg-gray-950">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/50 gap-2">
                        <Loader2 className="animate-spin" />
                        <span>Loading Slides...</span>
                    </div>
                )}

                <Document
                    file={url}
                    onLoadSuccess={current => onDocumentLoadSuccess({ numPages: current.numPages })}
                    onLoadError={(error) => {
                        console.error("PDF Load Error:", error);
                        setIsLoading(false);
                        toast.error("Failed to load PDF");
                    }}
                    className="flex justify-center"
                    loading={null}
                >
                    <Page
                        pageNumber={pageNumber}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        height={isMinimized ? 200 : undefined}
                        width={isMinimized ? undefined : 800} // Basic responsive needed, maybe useResizeObserver
                        className="shadow-lg"
                    />
                </Document>

                {/* Overlay Controls (Previous/Next) */}
                {!isMinimized && (
                    <>
                        <button
                            onClick={() => changePage(-1)}
                            disabled={pageNumber <= 1}
                            className={`
                                absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full 
                                bg-black/50 text-white hover:bg-black/70 backdrop-blur transition-all
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
                                bg-black/50 text-white hover:bg-black/70 backdrop-blur transition-all
                                disabled:opacity-0 disabled:pointer-events-none
                                ${!isAdmin ? "hidden" : ""}
                            `}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}
            </div>

            {/* Footer Control Bar (Visible only to Admin or everyone if we want read-only status) */}
            {!isMinimized && (
                <div className="p-3 bg-gray-800/90 backdrop-blur flex items-center justify-center gap-4 text-white">
                    <button
                        onClick={() => changePage(-1)}
                        disabled={pageNumber <= 1 || !isAdmin}
                        className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <span className="text-sm font-medium min-w-[3rem] text-center">
                        {pageNumber} / {numPages || '-'}
                    </span>

                    <button
                        onClick={() => changePage(1)}
                        disabled={pageNumber >= numPages || !isAdmin}
                        className="p-2 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {!isAdmin && (
                        <span className="absolute right-4 text-xs text-white/50 flex items-center gap-1">
                            Controlled by Host
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

