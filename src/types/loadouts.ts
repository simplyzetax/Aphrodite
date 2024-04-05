export interface ILocker {
    id: string;
    profileId: string;
    templateId: string;
    lockerName: string;
    bannerId: string;
    bannerColorId: string;
    characterId: string;
    backpackId: string;
    gliderId: string;
    danceId: unknown;
    pickaxeId: string;
    itemWrapId: unknown;
    contrailId: string;
    loadingScreenId: string;
    musicPackId: string;
    [key: string]: unknown; // This line allows for any string key
}

export type TempLoadouts = Record<string, {
    templateId: string;
    quantity: number;
    attributes: {
        locker_slots_data: {
            slots: Record<string, {
                items: string[];
                activeVariants: Record<string, any>[];
            }>;
        };
        use_count: number;
        banner_icon_template: string;
        locker_name: string;
        banner_color_template: string;
        items_seen: boolean;
        favorite: boolean;
    };
}>;