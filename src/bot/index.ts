import { Client, Partials, Collection, GatewayIntentBits, ActivityType } from "discord.js";
import path from "path";
import fs from "fs";
import { config, db } from "..";
import Logger from "../utils/logging";

export const client = new Client({
    partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.GuildMember, Partials.User, Partials.GuildScheduledEvent],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildMessageTyping,
    ],
    presence: {
        activities: [
            {
                name: "Fortnite with Aphrodite",
                type: ActivityType.Playing,
            },
        ],
        status: "online",
    },
});

client.commands = new Collection();
const foldersPath = path.join(import.meta.dir, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith(".ts"));
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = (await import(filePath));
        Logger.debug(`Loading command at ${filePath}`);
        if ("data" in command && "execute" in command) {
            client.commands.set(command.data.name, command);
        } else {
            Logger.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

const eventsPath = path.join(import.meta.dir, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".ts"));

async function registerEvents(client: Client<any>) {
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        let event = await import(`file://${filePath}`);
        if (event.once) {
            client.once(event.name, (...args: any) => event.execute(...args));
        } else {
            client.on(event.name, (...args: any) => event.execute(...args));
        }
    }
}

registerEvents(client)
    .then(() => {
        Logger.startup("All events registered!");
    })
    .catch((error) => {
        Logger.error("Error while registering events:", error);
    });

export async function login() {
    await client.login(config.BOT_TOKEN);
}