"use client";

import { useRoomContext } from "@livekit/components-react";
import { useState, useEffect, useMemo } from "react";
import { RoomEvent } from "livekit-client";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateRoomPermissions, muteAllParticipants } from "@/lib/api/admin-api";
import { Mic, Video, ScreenShare, Smile, MessageSquare } from "lucide-react";

export function HostControls({ roomName }: { roomName: string }) {
    const room = useRoomContext();
    const [metadataStr, setMetadataStr] = useState("");

    // Sync Metadata
    useEffect(() => {
        if (!room) return;
        setMetadataStr(room.metadata || "{}");

        const onMeta = (meta: string | undefined) => {
            setMetadataStr(meta || "{}");
        };
        room.on(RoomEvent.RoomMetadataChanged, onMeta);
        return () => {
            room.off(RoomEvent.RoomMetadataChanged, onMeta);
        };
    }, [room]);

    const metadata = useMemo(() => {
        try {
            return JSON.parse(metadataStr);
        } catch {
            return {};
        }
    }, [metadataStr]);

    const allowAudio = metadata.allow_audio !== false;
    const allowVideo = metadata.allow_video !== false;
    const allowScreen = metadata.allow_screen !== false;
    const allowReaction = metadata.allow_reaction !== false;
    // const allowChat = metadata.allow_chat !== false; // Future implementation

    const updatePermission = async (key: string, val: boolean, muteKind?: "audio" | "video") => {
        if (!room) return;
        const newMeta = { ...metadata, [key]: val };

        try {
            await updateRoomPermissions(room.name, newMeta);
            if (val === false && muteKind) {
                await muteAllParticipants(room.name, muteKind === "audio", muteKind === "video");
            }
            toast.success("Permissions updated");
        } catch (e: any) {
            toast.error("Failed to update permissions: " + e.message);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Description */}
            <div className="p-4 border-b border-border bg-muted/20">
                <p className="text-sm text-muted-foreground">
                    Use these host settings to control your meeting. Only hosts have access to these controls.
                </p>
            </div>

            <div className="p-4 space-y-6">

                {/* MEETING MODERATION Section */}

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Waiting Room
                    </h4>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/60">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium leading-none">
                                Enable Waiting Room
                            </label>
                            <p className="text-[10px] text-muted-foreground">
                                If enabled, new participants must be admitted by an admin.
                            </p>
                        </div>
                        <Switch
                            checked={metadata.waiting_room_enabled !== false}
                            onCheckedChange={(checked) => updatePermission("waiting_room_enabled", checked)}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Allow Participants
                    </h4>

                    {/* Screen Share */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Share their screen
                            </label>
                            {/* <p className="text-[10px] text-muted-foreground">
                                Izinkan peserta membagikan layar mereka.
                            </p> */}
                        </div>
                        <Switch
                            checked={allowScreen}
                            onCheckedChange={(checked) => updatePermission("allow_screen", checked)}
                        />
                    </div>

                    {/* Reactions */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Send reactions
                            </label>
                        </div>
                        <Switch
                            checked={allowReaction}
                            onCheckedChange={(checked) => updatePermission("allow_reaction", checked)}
                        />
                    </div>

                    {/* Mic */}
                    <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none">
                                Turn on their microphone
                            </label>
                            <Switch
                                checked={allowAudio}
                                onCheckedChange={(checked) => updatePermission("allow_audio", checked, !checked ? "audio" : undefined)}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            If turned off, participants cannot turn on their microphone. Hosts can still turn on their microphone.
                        </p>
                    </div>

                    {/* Video */}
                    <div className="flex flex-col gap-2 pt-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none">
                                Turn on their video
                            </label>
                            <Switch
                                checked={allowVideo}
                                onCheckedChange={(checked) => updatePermission("allow_video", checked, !checked ? "video" : undefined)}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                            If turned off, participants cannot turn on their camera.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
