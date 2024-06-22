import type { Collection } from "discord.js";

declare module "discord.js" {
    export interface Client {
        commands: Collection<string, any>;
    }
    export interface ModalSubmitInteraction {
        customId: string;
    }
    export interface ChatInputCommandInteraction {
        customId: string;
    }
}