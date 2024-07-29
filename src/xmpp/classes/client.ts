import type { ServerWebSocket } from "bun";
import XMLParser from "xml-parser";
import XMLBuilder from "xmlbuilder";

import type { WebSocketData } from "../types/ws";
import { users, type User } from "../../database/models/users";
import UUID from "../../utils/uuid";
import Encoding from "../../utils/encoding";
import { db } from "../..";
import { tokens } from "../../database/models/tokens";
import { eq } from "drizzle-orm";

const xmppDomain = "prod.ol.epicgames.com";

class XMPPClient {

    public static clients: XMPPClient[] = [];

    private ws: ServerWebSocket<WebSocketData>;
    private authenticated = false;
    private user: User | null = null;
    private uuid: string;

    private resource: string | null = null;
    private jid: string | null = null;

    constructor(ws: ServerWebSocket<WebSocketData>) {
        this.ws = ws;
        this.uuid = UUID.g();
    }

    public async handleMessage(message: string | Buffer) {
        if (Buffer.isBuffer(message)) message = message.toString();

        const msg = XMLParser(message);
        if (!msg || !msg.root || !msg.root.name) return this.ws.close(1008, "Invalid XML");

        console.log("[XMPP] Received xmpp message", msg.root.name)

        switch (msg.root.name) {
            case "open": this.handleOpen(); break;
            case "auth": await this.handleAuth(msg); break;
            case "iq": await this.handleIQ(msg); break;
            case "presence": await this.handlePresence(msg); break;
        }

    }

    public handleOpen() {
        this.ws.send(XMLBuilder.create("open")
            .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-framing")
            .attribute("from", xmppDomain)
            .attribute("id", this.uuid)
            .attribute("version", "1.0")
            .attribute("xml:lang", "en").toString());

        if (this.authenticated) {
            this.ws.send(XMLBuilder.create("stream:features").attribute("xmlns:stream", "http://etherx.jabber.org/streams")
                .element("ver").attribute("xmlns", "urn:xmpp:features:rosterver").up()
                .element("starttls").attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-tls").up()
                .element("bind").attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-bind").up()
                .element("compression").attribute("xmlns", "http://jabber.org/features/compress")
                .element("method", "zlib").up().up()
                .element("session").attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-session").up().toString());
        } else {
            this.ws.send(XMLBuilder.create("stream:features").attribute("xmlns:stream", "http://etherx.jabber.org/streams")
                .element("mechanisms").attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl")
                .element("mechanism", "PLAIN").up().up()
                .element("ver").attribute("xmlns", "urn:xmpp:features:rosterver").up()
                .element("starttls").attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-tls").up()
                .element("compression").attribute("xmlns", "http://jabber.org/features/compress")
                .element("method", "zlib").up().up()
                .element("auth").attribute("xmlns", "http://jabber.org/features/iq-auth").up().toString());
        }
    }

    public async handleAuth(msg: XMLParser.Document) {
        if (this.user) return;
        if (!msg.root.content) return this.ws.close(1008, "Invalid XML");

        if (!Encoding.decodeBase64(msg.root.content).includes("\u0000")) return this.ws.close(1008, "Invalid XML");
        const decoded = Encoding.decodeBase64(msg.root.content).split("\u0000");
        if (decoded.length !== 3 || !Array.isArray(decoded)) return this.ws.close(1008, "Not array or invalid length");

        const replacedToken = decoded[2].replace(/eg1~/i, "");
        const [token] = await db.select().from(tokens).where(eq(tokens.token, replacedToken));
        if (!token) return this.ws.close(1008, "Invalid token");

        const alreadyConnected = XMPPClient.clients.find(c => c.user?.accountId === token.accountId);
        if (alreadyConnected) return this.ws.close(1008, "Account already connected");

        const [user] = await db.select().from(users).where(eq(users.accountId, token.accountId));
        if (!user) return this.ws.close(1008, "User not found");
        this.user = user;

        this.ws.send(XMLBuilder.create("success").attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-sasl").toString());

        console.log(`[XMPP] User ${user.displayName} connected`);

        this.authenticated = true;
    }

    public async handleIQ(msg: XMLParser.Document) {
        if (!this.uuid) return this.ws.close(1008, "Invalid UUID");

        switch (msg.root.attributes.id) {
            case "_xmpp_bind1": {
                if (!this.resource && this.user) {
                    const bind = msg.root.children.find(ch => ch.name === "bind");
                    const alreadyConnected = XMPPClient.clients.some(c => c.user?.accountId === this.user?.accountId);

                    if (bind && !alreadyConnected) {
                        const resource = bind.children.find(ch => ch.name === "resource");

                        if (resource?.content) {
                            this.resource = resource.content;
                            this.jid = `${this.user.accountId}@${xmppDomain}/${this.resource}`;

                            this.ws.send(XMLBuilder.create("iq")
                                .attribute("to", this.jid)
                                .attribute("id", "_xmpp_bind1")
                                .attribute("xmlns", "jabber:client")
                                .attribute("type", "result")
                                .element("bind")
                                .attribute("xmlns", "urn:ietf:params:xml:ns:xmpp-bind")
                                .element("jid", this.jid).up().up().toString());
                        }
                    } else if (alreadyConnected) {
                        this.ws.close(1008, "Account already connected");
                    }
                }
                break;
            }
            case "_xmpp_session1": {

                this.ws.send(XMLBuilder.create("iq")
                    .attribute("to", this.jid)
                    .attribute("from", xmppDomain)
                    .attribute("id", "_xmpp_session1")
                    .attribute("xmlns", "jabber:client")
                    .attribute("type", "result").toString());

                //TODO GET PRESENCE from friends, but first I have to actually add friends to the backend :(

                break;
            }
            default: {
                this.ws.send(XMLBuilder.create("iq")
                    .attribute("to", this.jid)
                    .attribute("from", xmppDomain)
                    .attribute("id", msg.root.attributes.id)
                    .attribute("xmlns", "jabber:client")
                    .attribute("type", "result").toString());
            }
        }
    }

    public async handlePresence(msg: XMLParser.Document) {
        if (!this.jid) return this.ws.close(1008, "Invalid JID");

        switch (msg.root.attributes.type) {
            case "unavailable": {
                if (!msg.root.attributes.to) return;

                const { to } = msg.root.attributes;
                const baseAddress = to.split("/")[0];

                if (baseAddress.endsWith(`@muc.${xmppDomain}`) && baseAddress.toLowerCase().startsWith("party-")) {
                    const room = baseAddress.split("@")[0];
                    //TODO: Do this (I don't want to)
                    return;
                }
            }
        }
    }
}

export default XMPPClient;