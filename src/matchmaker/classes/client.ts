import type { ServerWebSocket } from "bun";
import type { MMData } from "../schemas/mmdata";
import type { WebSocketData } from "../server";
import { v4 } from "uuid";
import UUID from "./uuid";

class Client {

    public accountId: string;
    public socket: ServerWebSocket<WebSocketData>;
    public mmData: MMData;
    public readyToBeUpdated: boolean = false;
    public ticketId: string = UUID.gr();

    constructor(mmData: MMData, socket: ServerWebSocket<WebSocketData>) {
        this.accountId = mmData.playerId;
        this.socket = socket;
        this.mmData = mmData;
    }

    public get getAccountId() {
        return this.accountId;
    }

    public get getSocket() {
        return this.socket;
    }

    public get getMMData() {
        return this.mmData;
    }

}

export default Client;