import Logger from "../utils/logging";
import XMPPClient from "./classes/client";
import type { WebSocketData } from "./types/ws";

const xmpp = Bun.serve<WebSocketData>({
    port: 3005,
    fetch(req, server) {

        const secWebSocketKey = req.headers.get('Sec-Websocket-Key');
        if (!secWebSocketKey) return new Response(null, { status: 400 });

        console.log(req.headers)

        server.upgrade(req, {
            data: {
                connectedAt: Date.now(),
                user: null,
                XMPPClient: null,
                SecWebSocketKey: secWebSocketKey,
            },
        });

        return undefined;
    },
    websocket: {
        // handler called when a message is received
        open(ws) {
            const xmppclient = new XMPPClient(ws);
            ws.data.XMPPClient = xmppclient;
        },
        async message(ws, message) {
            console.log("[XMPP] Received message", message)
            if (!ws.data.XMPPClient) {
                console.log("[XMPP] No XMPPClient found")
                return ws.close(1008, "No XMPPClient found");
            }
            await ws.data.XMPPClient.handleMessage(message);
        },
    },
});

Logger.startup("XMPP listening on port 3005")