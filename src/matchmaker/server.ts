import type { Server } from "bun";
import Matchmaker from "./classes/matchmaker";
import Logger from "../utils/logging";

export type WebSocketData = {
    id: string;
    rawMMData: string;
}

const mm = new Matchmaker("userAgent", "1ed15d853c21264dec6766dae36d12a261f668e455cfa756fdb41c69ca130920");

function authorizeRequest(req: Request): string | null {
    const auth = req.headers.get("Authorization");
    if (!auth) {
        return null;
    }

    const [, , encrypted] = auth.split(" ");
    if (!encrypted) {
        return null;
    }

    return encrypted;
}

function upgradeWebSocket(req: Request, server: Server, encrypted: string) {
    const secWsKey = req.headers.get("Sec-WebSocket-Key");

    server.upgrade(req, {
        data: {
            id: secWsKey,
            rawMMData: encrypted,
        },
    });
}

const server = Bun.serve<WebSocketData>({
    port: 3001,
    fetch(req, server) {
        const encrypted = authorizeRequest(req);
        if (!encrypted) {
            return new Response("Unauthorized request", { status: 401 });
        }

        upgradeWebSocket(req, server, encrypted);
    },
    websocket: {
        message(ws, message) { },
        open(ws) {
            //console.log("WebSocket opened");
            mm.initQueueOrFind(ws.data.rawMMData, ws);
        },
        close(ws, code, message) {
            const queue = mm.queues.find((q) => q.clients.some((c) => c.getSocket === ws));
            if (!queue) return;

            const client = queue.clients.find((c) => c.getSocket === ws);
            if (!client) return;

            //console.log("Removed client from queue with ID", client.getAccountId)
            queue.removeClient(client);
        },
        drain(ws) { },
    },
});

Logger.startup("Matchmaker started on port 3001 🪐");