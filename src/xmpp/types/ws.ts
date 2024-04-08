import type XMPPClient from "../classes/client";

export type WebSocketData = {
    XMPPClient: XMPPClient | null;
    connectedAt: Date;
    SecWebSocketKey: string;
};