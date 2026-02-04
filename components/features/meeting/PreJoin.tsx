"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createLocalVideoTrack, createLocalAudioTrack, LocalVideoTrack, LocalAudioTrack } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, Settings, Users, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { VideoTrack } from "@livekit/components-react"; // Removed as causing crash

function LocalVideoPreview({ track }: { track: LocalVideoTrack }) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = videoRef.current;
        if (el && track) {
            track.attach(el);
        }
        return () => {
            if (el && track) {
                track.detach(el);
            }
        };
    }, [track]);

    return (
        <video
            ref={videoRef}
            className="w-full h-full object-cover transform scale-x-[-1]"
            muted
            playsInline
            autoPlay
        />
    );
}

export interface MediaChoices {
    audioEnabled: boolean;
    videoEnabled: boolean;
    audioDeviceId: string;
    videoDeviceId: string;
    username: string;
}

interface PreJoinProps {
    roomName: string;
    initialUsername: string;
    isKicked?: boolean;
    isAdmin?: boolean;
    onJoin: (choices: MediaChoices) => void;
    isLoading?: boolean;
}

export default function PreJoin({ roomName, initialUsername, onJoin, isLoading }: PreJoinProps) {
    const router = useRouter();
    const [username, setUsername] = useState(initialUsername);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);

    const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);
    const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null);

    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");

    const [initializing, setInitializing] = useState(true);

    // Load devices and initial tracks
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                // Request permissions first to get labels
                // We create temporary tracks just to ask for permission / enumerate devices
                // Or we just enumerate if permissions are already granted. 
                // Best practice: Try to create tracks with defaults.

                // Create initial tracks first to trigger permissions
                if (videoEnabled) {
                    try {
                        const vTrack = await createLocalVideoTrack({
                            resolution: { width: 1280, height: 720 }
                        });
                        if (mounted) setVideoTrack(vTrack);
                    } catch (e) {
                        console.error("Failed to create video track", e);
                    }
                }

                // Now enumerate devices (labels should be available if permission granted)
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audios = devices.filter(d => d.kind === "audioinput");
                const videos = devices.filter(d => d.kind === "videoinput");

                if (mounted) {
                    setAudioDevices(audios);
                    setVideoDevices(videos);
                    if (audios.length > 0) setSelectedAudioDevice(audios[0].deviceId);
                    if (videos.length > 0) setSelectedVideoDevice(videos[0].deviceId);
                }

                setInitializing(false);

            } catch (e) {
                console.error("Error initializing media:", e);
                setInitializing(false);
            }
        };

        init();

        return () => {
            mounted = false;
            videoTrack?.stop();
            audioTrack?.stop();
        };
    }, []);

    // Toggle Video
    const toggleVideo = async () => {
        if (videoEnabled) {
            // Turn off
            setVideoEnabled(false);
            videoTrack?.stop();
            setVideoTrack(null);
        } else {
            // Turn on
            setVideoEnabled(true);
            try {
                const vTrack = await createLocalVideoTrack({
                    deviceId: selectedVideoDevice,
                    resolution: { width: 1280, height: 720 }
                });
                setVideoTrack(vTrack);
            } catch (e) {
                console.error("Failed to enable video", e);
                setVideoEnabled(false); // Revert on failure
            }
        }
    };

    // Toggle Audio
    const toggleAudio = () => {
        setAudioEnabled(!audioEnabled);
    };

    // Change Device
    const changeVideoDevice = async (deviceId: string) => {
        setSelectedVideoDevice(deviceId);
        if (videoEnabled) {
            videoTrack?.stop();
            try {
                const vTrack = await createLocalVideoTrack({
                    deviceId: deviceId,
                    resolution: { width: 1280, height: 720 }
                });
                setVideoTrack(vTrack);
            } catch (e) {
                console.error("Failed to switch video device", e);
            }
        }
    };

    const handleJoin = () => {
        // Stop local preview tracks before joining so the real room can create new ones
        // OR we can pass these tracks to the room. 
        // Passing tracks is better for seamless transition but requires LiveKitRoom to accept tracks.
        // For simplicity and robustness, we'll stop them here and let LiveKitRoom recreate them
        // using the flags we pass. 
        // Wait, recreating causes a flicker/delay. 
        // Let's rely on flag passing for now.

        videoTrack?.stop();
        // audioTrack?.stop(); // We didn't create persistent audio track for preview yet

        onJoin({
            audioEnabled,
            videoEnabled,
            audioDeviceId: selectedAudioDevice,
            videoDeviceId: selectedVideoDevice,
            username
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden p-4">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

            {/* Back Button */}
            <div className="absolute top-6 left-6 z-20">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.back()}
                    className="gap-2 text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Button>
            </div>

            <div className="relative z-10 w-full max-w-4xl grid lg:grid-cols-[1.5fr,1fr] gap-6 md:gap-8 items-center">

                {/* Left: Preview */}
                <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted/30 border border-white/10 shadow-2xl ring-1 ring-white/10 group">
                        {videoEnabled && videoTrack ? (
                            <LocalVideoPreview track={videoTrack} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-card/50 text-muted-foreground gap-3">
                                <div className="p-4 rounded-full bg-background/50 backdrop-blur-sm">
                                    <VideoOff className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="text-sm font-medium">Camera is off</p>
                            </div>
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            <Button
                                variant={audioEnabled ? "secondary" : "destructive"}
                                size="icon"
                                className="rounded-full h-10 w-10 transition-all"
                                onClick={toggleAudio}
                            >
                                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                            </Button>
                            <Button
                                variant={videoEnabled ? "secondary" : "destructive"}
                                size="icon"
                                className="rounded-full h-10 w-10 transition-all"
                                onClick={toggleVideo}
                            >
                                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground font-medium mb-1.5 block ml-1">Microphone</label>
                            <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice} disabled={audioDevices.length === 0}>
                                <SelectTrigger className="h-9 text-xs">
                                    <span className="truncate">
                                        {audioDevices.find(d => d.deviceId === selectedAudioDevice)?.label ||
                                            (selectedAudioDevice ? `Microphone ${audioDevices.findIndex(d => d.deviceId === selectedAudioDevice) + 1}` : "Default Microphone")}
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {audioDevices.map((d, i) => (
                                        <SelectItem key={d.deviceId} value={d.deviceId}>
                                            {d.label || `Microphone ${i + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-muted-foreground font-medium mb-1.5 block ml-1">Camera</label>
                            <Select value={selectedVideoDevice} onValueChange={changeVideoDevice} disabled={videoDevices.length === 0}>
                                <SelectTrigger className="h-9 text-xs">
                                    <span className="truncate">
                                        {videoDevices.find(d => d.deviceId === selectedVideoDevice)?.label ||
                                            (selectedVideoDevice ? `Camera ${videoDevices.findIndex(d => d.deviceId === selectedVideoDevice) + 1}` : "Default Camera")}
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {videoDevices.map((d, i) => (
                                        <SelectItem key={d.deviceId} value={d.deviceId}>
                                            {d.label || `Camera ${i + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Right: Join Info */}
                <div className="flex flex-col gap-6 p-6 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                    <div className="space-y-2 text-center md:text-left">
                        <div className="inline-flex items-center justify-center p-3 rounded-xl bg-primary/10 text-primary mb-2">
                            <Users className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Ready to join?</h1>
                        <p className="text-muted-foreground text-sm">
                            You are about to enter <span className="text-foreground font-semibold">{roomName}</span>.
                            Please verify your audio and video settings.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* <div className="space-y-2">
                            <label className="text-sm font-medium">Display Name</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter your name"
                            />
                        </div> */}

                        <div className="pt-2">
                            <Button
                                size="lg"
                                className="w-full text-base gap-2"
                                onClick={handleJoin}
                                disabled={isLoading || !username.trim()}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                Join Meeting
                            </Button>
                            <p className="text-xs text-center text-muted-foreground mt-4">
                                By joining, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
