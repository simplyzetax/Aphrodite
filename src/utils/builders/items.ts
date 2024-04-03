import { eq } from "drizzle-orm";
import type { AthenaItem } from "../../types/item";
import { db } from "../..";
import { items, type Item } from "../../database/models/items";

class ItemBuilder {

    private profileId: string;

    private dbItems: Item[] = [];
    private items: Record<string, AthenaItem> = {};

    constructor(profileId: string) {
        this.profileId = profileId;
    }

    async buildItems(): Promise<Record<string, AthenaItem> | undefined> {
        this.dbItems = await db.select().from(items).where(eq(items.profileId, this.profileId));

        if (this.dbItems.length === 0) return undefined;

        for (const dbItem of this.dbItems) {
            const value: AthenaItem = {
                templateId: dbItem.templateId,
                attributes: dbItem.jsonAttributes,
            }

            value.attributes.favorite = dbItem.favorite;
            value.attributes.item_seen = dbItem.seen ? 1 : 0;

            this.items[dbItem.id] = value;
        }

        return this.items;
    }

}

export default ItemBuilder;