"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createLocalVideoTrack, createLocalAudioTrack, LocalVideoTrack, LocalAudioTrack } from "livekit-client";
import { Mic, MicOff, Video, VideoOff, Settings, Users, ArrowRight, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    password?: string;
}

interface PreJoinProps {
    roomName: string;
    initialUsername: string;
    isKicked?: boolean;
    isAdmin?: boolean;
    onJoin: (choices: MediaChoices) => void;
    isLoading?: boolean;
    passwordRequired?: boolean;
    disableNameInput?: boolean;
}

export default function PreJoin({ roomName, initialUsername, onJoin, isLoading, passwordRequired, disableNameInput }: PreJoinProps) {
    const router = useRouter();
    const [username, setUsername] = useState(initialUsername);
    const [password, setPassword] = useState("");
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);

    const [videoTrack, setVideoTrack] = useState<LocalVideoTrack | null>(null);
    const [audioTrack, setAudioTrack] = useState<LocalAudioTrack | null>(null);

    const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
    const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

    const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
    const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");

    const [initializing, setInitializing] = useState(true);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
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

                const devices = await navigator.mediaDevices.enumerateDevices();
                const audios = devices.filter(d => d.kind === "audioinput" && d.deviceId !== "");
                const videos = devices.filter(d => d.kind === "videoinput" && d.deviceId !== "");

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

    const toggleVideo = async () => {
        if (videoEnabled) {
            setVideoEnabled(false);
            videoTrack?.stop();
            setVideoTrack(null);
        } else {
            setVideoEnabled(true);
            try {
                const vTrack = await createLocalVideoTrack({
                    deviceId: selectedVideoDevice,
                    resolution: { width: 1280, height: 720 }
                });
                setVideoTrack(vTrack);
            } catch (e) {
                console.error("Failed to enable video", e);
                setVideoEnabled(false);
            }
        }
    };

    const toggleAudio = () => {
        setAudioEnabled(!audioEnabled);
    };

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
        videoTrack?.stop();

        onJoin({
            audioEnabled,
            videoEnabled,
            audioDeviceId: selectedAudioDevice,
            videoDeviceId: selectedVideoDevice,
            username,
            password: passwordRequired ? password : ""
        });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden p-4">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
            <div className="absolute h-full w-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

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

            <div className="relative z-10 w-full max-w-md flex flex-col gap-4">

                <div className="flex flex-col gap-4 p-4 rounded-3xl bg-card/40 backdrop-blur-xl border border-white/10 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="text-center space-y-1">
                        <h1 className="text-xl font-bold tracking-tight">Ready to join?</h1>
                        <p className="text-muted-foreground text-xs">
                            <span className="text-foreground font-semibold">{roomName}</span>
                        </p>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden bg-muted/30 border border-white/10 shadow-inner group">
                        {videoEnabled && videoTrack ? (
                            <LocalVideoPreview track={videoTrack} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-card/50 text-muted-foreground gap-2">
                                <div className="p-3 rounded-full bg-background/50 backdrop-blur-sm">
                                    <VideoOff className="w-6 h-6 opacity-50" />
                                </div>
                                <p className="text-xs font-medium">Camera is off</p>
                            </div>
                        )}

                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            <Button
                                variant={audioEnabled ? "secondary" : "destructive"}
                                size="icon"
                                className="rounded-full h-8 w-8 transition-all"
                                onClick={toggleAudio}
                            >
                                {audioEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant={videoEnabled ? "secondary" : "destructive"}
                                size="icon"
                                className="rounded-full h-8 w-8 transition-all"
                                onClick={toggleVideo}
                            >
                                {videoEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice} disabled={audioDevices.length === 0}>
                                <SelectTrigger className="h-8 text-xs bg-background/50 border-white/10">
                                    <span className="truncate">
                                        {audioDevices.find(d => d.deviceId === selectedAudioDevice)?.label || "Mic"}
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {audioDevices.map((d, i) => (
                                        <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">
                                            {d.label || `Mic ${i + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Select value={selectedVideoDevice} onValueChange={changeVideoDevice} disabled={videoDevices.length === 0}>
                                <SelectTrigger className="h-8 text-xs bg-background/50 border-white/10">
                                    <span className="truncate">
                                        {videoDevices.find(d => d.deviceId === selectedVideoDevice)?.label || "Camera"}
                                    </span>
                                </SelectTrigger>
                                <SelectContent>
                                    {videoDevices.map((d, i) => (
                                        <SelectItem key={d.deviceId} value={d.deviceId} className="text-xs">
                                            {d.label || `Camera ${i + 1}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-3 pt-1">
                        {!disableNameInput ? (
                            <div className="space-y-1">
                                <label className="text-xs font-medium ml-1">Display Name</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter your name"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <span className="text-xs text-muted-foreground">Joining as</span>
                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                    <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">
                                        {username.charAt(0).toUpperCase()}
                                    </div>
                                    {username}
                                </div>
                            </div>
                        )}

                        {passwordRequired && (
                            <div className="space-y-1">
                                <label className="text-xs font-medium ml-1">Room Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter password"
                                />
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full text-sm h-10 gap-2 mt-2"
                            onClick={handleJoin}
                            disabled={isLoading || !username.trim()}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            Join Now
                        </Button>
                    </div>

                </div>
            </div>
        </div>
    );
}
