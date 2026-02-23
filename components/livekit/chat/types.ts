export type ChatItem =
    | {
        id: string;
        ts: number;
        from: string;
        mine: boolean;
        type: "text";
        text: string;
        to?: string;
        isRead?: boolean;
        isDeleted?: boolean;
    }
    | {
        id: string;
        ts: number;
        from: string;
        mine: boolean;
        type: "image";
        blob: Blob;
        mime: string;
        size: number;
        to?: string;
        isRead?: boolean;
        isDeleted?: boolean;
    };

export type ChatTextPayload = {
    type: "chat";
    v: 1;
    id: string;
    ts: number;
    from: string;
    text: string;
    to?: string;
};

export type ImageMetaPayload = {
    type: "image_meta";
    v: 1;
    id: string;
    ts: number;
    from: string;
    mime: string;
    size: number;
    to?: string;
};

export type ImageChunkPayload = {
    type: "image_chunk";
    v: 1;
    id: string;
    seq: number;
    data: string;
};

export type ImageDonePayload = {
    type: "image_done";
    v: 1;
    id: string;
};

export type ChatPinPayload = {
    type: "pin_message";
    v: 1;
    id: string;
    item?: ChatItem;
    itemText?: string;
    itemType?: "text" | "image";
    from?: string;
    to?: string;
};

export type ChatDeletePayload = {
    type: "delete_message";
    v: 1;
    targetId: string;
};

export type Payload = ChatTextPayload | ImageMetaPayload | ImageChunkPayload | ImageDonePayload | ChatPinPayload | ChatDeletePayload;

export const MAX_IMAGE_SIZE = 1_000_000;
export const CHUNK_SIZE = 16_000;
