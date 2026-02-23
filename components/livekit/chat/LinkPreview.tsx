"use client";

import { useEffect, useState } from "react";
import { Loader2, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/api/admin-api";

interface LinkMeta {
    title: string;
    description: string;
    image: string;
    url: string;
}

export function LinkPreview({ url }: { url: string }) {
    const [meta, setMeta] = useState<LinkMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let mounted = true;
        const fetchMeta = async () => {
            try {
                setLoading(true);
                const res = await apiRequest<LinkMeta>(`/api/meta?url=${encodeURIComponent(url)}`);
                if (mounted) {
                    if (res.title || res.image) {
                        setMeta(res);
                    } else {
                        setError(true);
                    }
                }
            } catch (e) {
                if (mounted) setError(true);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchMeta();
        return () => {
            mounted = false;
        };
    }, [url]);

    if (error || (!loading && !meta)) return null;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-2 no-underline group select-none"
        >
            <div className="flex flex-col bg-muted/40 border border-border/60 rounded-lg overflow-hidden transition-all hover:bg-muted/60 hover:border-primary/30 max-w-[300px]">
                {loading ? (
                    <div className="h-20 flex items-center justify-center bg-muted/20">
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <>
                        {meta?.image && (
                            <div className="w-full h-32 bg-black/5 overflow-hidden relative">
                                <img
                                    src={meta.image}
                                    alt={meta.title}
                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                    onError={(e) => (e.currentTarget.style.display = "none")}
                                />
                            </div>
                        )}
                        <div className="p-2.5">
                            <div className="text-xs font-semibold text-foreground line-clamp-2 leading-tight mb-1">
                                {meta?.title || url}
                            </div>
                            {meta?.description && (
                                <div className="text-[10px] text-muted-foreground line-clamp-2 leading-snug">
                                    {meta.description}
                                </div>
                            )}
                            <div className="text-[9px] text-muted-foreground/70 mt-1.5 flex items-center gap-1 uppercase tracking-wide">
                                <ExternalLink className="w-2.5 h-2.5" />
                                {new URL(url).hostname}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </a>
    );
}
