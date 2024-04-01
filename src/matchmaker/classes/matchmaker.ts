import Queue from "./queue";
import type { MMData } from "../schemas/mmdata";
import Client from "./client";
import { safeDestr } from "destr";
import mmDataSchema from "../schemas/mmdata";
import type { ServerWebSocket } from "bun";
import type { WebSocketData } from "../server";
import { errorResponses } from "./error";

import jwt from "jsonwebtoken";
import { config } from "../..";

class Matchmaker {

    public queues: Queue[] = [];
    public userAgent: string;
    public decryptionKey: string;

    constructor(userAgent: string, decryptionKey: string) {
        this.userAgent = userAgent;
        this.decryptionKey = decryptionKey;
    }

    public addQueue(queue: Queue): void {
        this.queues.push(queue);
    }

    public removeQueue(queue: Queue): void {
        this.queues = this.queues.filter((q) => q.matchId !== queue.matchId);
    }

    private findQueue(mmData: MMData) {
        const region = mmData.attributes["player.preferredSubregion"];
        const playlist = mmData.bucketId.split(":")[2];
        const customkey = mmData.attributes["player.option.customKey"] || null;
        const uA = mmData.attributes["player.userAgent"];

        return this.queues.find((q) => q.region === region && q.playlist === playlist && q.customkey === customkey && q.useragent === uA && q.clients.length < 100);
    }

    // Client creation and validation methods
    private createClient(mmData: MMData, socket: ServerWebSocket<WebSocketData>) {
        return new Client(mmData, socket);
    }

    /**
     * 
     * @param data The raw jwt token
     * @returns The valid MMData object or undefined if the jwt token is invalid
     */
    private getMMData(data: string) {
        try {
            const validJwt = jwt.verify(data, config.UPLINK_KEY);
            if (!validJwt || typeof validJwt !== "string") {
                return undefined;
            }

            const validated = mmDataSchema.safeParse(validJwt);
            if (!validated.success) {
                return undefined;
            }
            return validated.data;
        } catch (error) {
            return undefined;
        }
    }

    private checkExpired(mmData: MMData) {
        const currentTime = new Date();
        if (new Date(currentTime).getTime() - new Date(mmData.expireAt).getTime() > 30000) {
            return true;
        } else {
            return false;
        }
    }

    public initQueueOrFind(jwtToken: string, socket: ServerWebSocket<WebSocketData>): void {

        const validMMData = this.getMMData(jwtToken);
        if (!validMMData) {
            return errorResponses.invalidMMData.sendError(socket);
        }

        const isExpired = this.checkExpired(validMMData);
        if (isExpired) {
            return errorResponses.timestampExpired.sendError(socket);
        }

        const queue = this.findQueue(validMMData);

        const client = this.createClient(validMMData, socket);

        if (!queue || queue.clients.length === 100) {
            const newQueue = new Queue(validMMData, this);
            console.log("Creating new queue with ID", newQueue.matchId);
            newQueue.addClient(client);
            this.addQueue(newQueue);
            newQueue.sendInitialMessages(client);
            console.log("Amount of queues:", this.queues.length)
        } else {
            //console.log("Adding client to queue with ID", queue.matchId);
            if (queue.clients.some((c) => c.getAccountId === client.getAccountId)) {
                return errorResponses.alreadyInQueue.sendError(socket);
            }
            queue.addClient(client);
            queue.sendInitialMessages(client);
        }
    }

    public get earliestCreatedQueue() {
        return this.queues.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
    }

}

export default Matchmaker;