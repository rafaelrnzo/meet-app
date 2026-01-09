"use client";

import { useState, useEffect, useRef } from "react";
import { Track } from "livekit-client";
import { useLocalParticipant } from "@livekit/components-react";
import { BackgroundBlur, VirtualBackground } from "@livekit/track-processors";
import { Image as ImageIcon, Sparkles, Upload, Ban } from "lucide-react";

type BackgroundOption = "none" | "blur" | "image-1" | "image-2" | "image-3" | "custom";

export function VirtualBackgroundSelector({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { localParticipant } = useLocalParticipant();
    const [activeBackground, setActiveBackground] = useState<BackgroundOption>("none");
    const [customImage, setCustomImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    // Ref to hold the current processor
    const processorRef = useRef<any>(null);

    useEffect(() => {
        // Load saved preference
        const saved = localStorage.getItem("virtual-background-pref") as BackgroundOption;
        const savedCustom = localStorage.getItem("virtual-background-custom");
        if (saved) {
            if (saved === 'custom' && savedCustom) {
                setCustomImage(savedCustom);
                setActiveBackground('custom');
            } else {
                setActiveBackground(saved);
            }
        }
    }, []);

    // Effect to apply background when activeBackground changes
    useEffect(() => {
        if (!localParticipant) return;

        const applyBackground = async () => {
            const trackPublication = localParticipant.getTrackPublication(Track.Source.Camera);
            if (!trackPublication || !trackPublication.videoTrack) return;

            const videoTrack = trackPublication.videoTrack;
            setProcessing(true);

            try {
                if (processorRef.current) {
                    await videoTrack.setProcessor(processorRef.current);
                    if (processorRef.current.destroy) {
                        await processorRef.current.destroy();
                    }
                    processorRef.current = null;
                }

                if (activeBackground === "blur") {
                    const blur = BackgroundBlur(10, { delegate: "GPU" });
                    await videoTrack.setProcessor(blur);
                    processorRef.current = blur;
                } else if (activeBackground.startsWith("image") || activeBackground === "custom") {
                    let imageUrl = "";
                    if (activeBackground === "image-1") imageUrl = "/bedroom.jpg";
                    if (activeBackground === "image-2") imageUrl = "/cafe.jpg";
                    if (activeBackground === "image-3") imageUrl = "/office.jpeg";
                    if (activeBackground === "custom" && customImage) imageUrl = customImage;

                    if (imageUrl) {
                        const vb = VirtualBackground(imageUrl, { delegate: "GPU" });
                        await videoTrack.setProcessor(vb);
                        processorRef.current = vb;
                    }
                }

                // Save preference
                localStorage.setItem("virtual-background-pref", activeBackground);
                if (activeBackground === "custom" && customImage) {
                    localStorage.setItem("virtual-background-custom", customImage);
                }

            } catch (error) {
                console.error("Failed to apply virtual background:", error);
            } finally {
                setProcessing(false);
            }
        };

        // Debounce slightly to prevent rapid switching issues
        const timeout = setTimeout(applyBackground, 100);
        return () => clearTimeout(timeout);

    }, [activeBackground, customImage, localParticipant]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setCustomImage(result);
                setActiveBackground("custom");
            };
            reader.readAsDataURL(file);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl shadow-2xl p-4 w-[90vw] max-w-md z-50">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-sm">Virtual Background</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs">
                    Close
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {/* NONE */}
                <button
                    onClick={() => setActiveBackground("none")}
                    className={`aspect-video rounded-lg border-2 flex flex-col items-center justify-center transition-all ${activeBackground === "none" ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                        }`}
                >
                    <Ban className="w-5 h-5 mb-1 opacity-70" />
                    <span className="text-[10px]">None</span>
                </button>

                {/* BLUR */}
                <button
                    onClick={() => setActiveBackground("blur")}
                    className={`aspect-video rounded-lg border-2 flex flex-col items-center justify-center transition-all ${activeBackground === "blur" ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"
                        }`}
                >
                    <div className="w-6 h-6 rounded-full bg-foreground/20 blur-sm mb-1" />
                    <span className="text-[10px]">Blur</span>
                </button>

                {/* PRESET 1 */}
                <button
                    onClick={() => setActiveBackground("image-1")}
                    className={`aspect-video rounded-lg border-2 overflow-hidden relative transition-all ${activeBackground === "image-1" ? "border-primary" : "border-transparent hover:opacity-80"
                        }`}
                >
                    <img src="/bedroom.jpg" alt="Bedroom" className="w-full h-full object-cover" />
                </button>

                {/* PRESET 2 */}
                <button
                    onClick={() => setActiveBackground("image-2")}
                    className={`aspect-video rounded-lg border-2 overflow-hidden relative transition-all ${activeBackground === "image-2" ? "border-primary" : "border-transparent hover:opacity-80"
                        }`}
                >
                    <img src="/cafe.jpg" alt="Cafe" className="w-full h-full object-cover" />
                </button>

                {/* PRESET 3 */}
                <button
                    onClick={() => setActiveBackground("image-3")}
                    className={`aspect-video rounded-lg border-2 overflow-hidden relative transition-all ${activeBackground === "image-3" ? "border-primary" : "border-transparent hover:opacity-80"
                        }`}
                >
                    <img src="/office.jpeg" alt="Office" className="w-full h-full object-cover" />
                </button>

                {/* CUSTOM */}
                <label className={`aspect-video rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${activeBackground === "custom" ? "border-primary bg-primary/10" : "border-dashed border-border hover:bg-muted"
                    }`}>
                    {customImage && activeBackground === 'custom' ? (
                        <img src={customImage} alt="Custom" className="w-full h-full object-cover rounded-md" />
                    ) : (
                        <>
                            <Upload className="w-5 h-5 mb-1 opacity-70" />
                            <span className="text-[10px]">Custom</span>
                        </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>

            </div>

            {processing && (
                <div className="mt-2 text-[10px] text-center text-muted-foreground animate-pulse">
                    Processing background...
                </div>
            )}
        </div>
    );
}
