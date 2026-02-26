"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

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

const PDFViewerDynamic = dynamic(() => import("./PDFBase"), {
    ssr: false,
    loading: () => (
        <div className="relative bg-background border border-border mt-3 overflow-hidden flex flex-col items-center justify-center text-muted-foreground gap-2 w-full h-full rounded-lg min-h-[300px] shadow-sm">
            <Loader2 className="animate-spin" />
            <span>Loading PDF Viewer...</span>
        </div>
    )
});

export function PDFSlideViewer(props: PDFSlideViewerProps) {
    if (!props.isOpen || !props.url) return null;
    return <PDFViewerDynamic {...props} />;
}