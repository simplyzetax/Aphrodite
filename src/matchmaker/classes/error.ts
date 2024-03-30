import type { ServerWebSocket } from "bun";
import type { WebSocketData } from "../server";

class MMError {

    public code: number;
    public message: string;

    constructor(code: number, message: string) {
        this.code = code;
        this.message = message;
    }

    public sendError(socket: ServerWebSocket<WebSocketData>) {
        //console.log("Sending error", this.code, this.message);
        socket.close(this.code, JSON.stringify({
            message: this.message,
            code: this.code,
            timestamp: Date.now(),
            id: socket.data.id,
        }));
    }
}

export const errorResponses = {
    invalidMMData: new MMError(4001, "Invalid Matchmaking Data"),
    timestampExpired: new MMError(4002, "WebSocket connection closed: Timestamp expired."),
    alreadyInQueue: new MMError(4003, "Already in queue"),
    queueNotFound: new MMError(4004, "Queue not found"),
};

export default MMError;