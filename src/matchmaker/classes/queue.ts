import type { MMData } from "../schemas/mmdata";
import type Client from "./client";
import type Matchmaker from "./matchmaker";
import UUID from "./uuid";

class Queue {
    public region: string;
    public playlist: string;
    public customkey: string | null;
    public useragent: string;
    public clients: Client[] = [];

    public createdAt: Date;

    private mm: Matchmaker;

    public sessionId: string;
    public matchId: string;

    constructor(mmData: MMData, mm: Matchmaker) {
        this.region = mmData.attributes["player.preferredSubregion"];
        this.playlist = mmData.bucketId.split(":")[2];
        this.customkey = mmData.attributes["player.option.customKey"] || null;
        this.useragent = mmData.attributes["player.userAgent"];
        this.mm = mm;

        this.createdAt = new Date();

        this.sessionId = UUID.gr();
        this.matchId = UUID.gr();
    }

    public addClient(client: Client): void {
        this.clients.push(client);
    }

    public removeClient(client: Client): void {
        this.clients = this.clients.filter((c) => c.getAccountId !== client.getAccountId);

        if (this.clients.length === 0) {
            console.log("Queue is empty, deleting it");
            this.mm.removeQueue(this);
        }

        for (const client of this.clients) {
            client.socket.send(
                JSON.stringify({
                    payload: {
                        ticketId: client.ticketId,
                        queuedPlayers: this.clients.length,
                        playerAmount: this.clients.length - 1,
                        status: this.clients.length === 0 ? 2 : 3,
                        state: "Queued",
                    },
                    name: "StatusUpdate",
                }),
            );
        }
    }

    public sendInitialMessages(newClient: Client) {

        newClient.socket.send(
            JSON.stringify({
                payload: {
                    state: "Connecting",
                },
                name: "StatusUpdate",
            }),
        );

        newClient.socket.send(
            JSON.stringify({
                payload: {
                    totalPlayers: this.clients.length,
                    connectedPlayers: this.clients.length - 1,
                    state: "Waiting",
                },
                name: "StatusUpdate",
            }),
        );

        newClient.readyToBeUpdated = true;

        const clients = this.clients;
        for (const client of clients) {
            client.socket.send(
                JSON.stringify({
                    payload: {
                        ticketId: client.ticketId,
                        queuedPlayers: this.clients.length,
                        playerAmount: this.clients.length - 1,
                        status: this.clients.length === 0 ? 2 : 3,
                        state: "Queued",
                    },
                    name: "StatusUpdate",
                }),
            );
        }
    }


}

export default Queue;