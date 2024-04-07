import type { ILocker, TempLoadouts } from "../../types/loadouts";

const wow = {
    templateId: "CosmeticLocker:cosmeticlocker_athena",
    quantity: 1,
    attributes: {
        locker_slots_data: {
            slots: {
                Pickaxe: {
                    items: [
                        ""
                    ],
                    activeVariants: null
                },
                Dance: {
                    items: [
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ]
                },
                Glider: {
                    items: [
                        ""
                    ],
                    activeVariants: null
                },
                Character: {
                    items: [
                        ""
                    ],
                    activeVariants: null
                },
                Backpack: {
                    items: [
                        ""
                    ],
                    activeVariants: null
                },
                ItemWrap: {
                    items: [
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        ""
                    ],
                    activeVariants: null
                },
                LoadingScreen: {
                    items: [
                        ""
                    ]
                },
                SkyDiveContrail: {
                    items: [
                        ""
                    ],
                    activeVariants: null
                },
                MusicPack: {
                    items: [
                        ""
                    ]
                }
            }
        },
        use_count: 0,
        banner_icon_template: "",
        locker_name: "aphrodite-loadout",
        banner_color_template: "",
        items_seen: true,
        favorite: false
    }
}

export function buildLoadouts(lockers: ILocker[]) {

    const slotsToDatabaseIds: { [x: string]: string } = {
        Character: "characterId",
        Backpack: "backpackId",
        Pickaxe: "pickaxeId",
        Glider: "gliderId",
        SkyDiveContrail: "contrailId",
        MusicPack: "musicPackId",
        LoadingScreen: "loadingScreenId",
        Dance: "danceId",
        ItemWrap: "itemWrapId",
    };

    const tempLoadouts: TempLoadouts = {};
    for (const locker of lockers) {
        tempLoadouts[locker.lockerName] = {
            templateId: locker.templateId,
            quantity: 1,
            attributes: {
                locker_slots_data: {
                    slots: ['Pickaxe', 'Dance', 'Glider', 'Character', 'Backpack', 'ItemWrap', 'LoadingScreen', 'SkyDiveContrail', 'MusicPack'].reduce((acc, key) => {
                        const itemValue = locker[`${slotsToDatabaseIds[key]}`];
                        const item = Array.isArray(itemValue) ? itemValue : [`${itemValue}`];
                        const items = key === 'ItemWrap' ? [...new Array(7)].flatMap(() => item) : key === 'Dance' ? [...new Array(6)].flatMap(() => item) : item;
                        const newSlot = {
                            [key]: {
                                items,
                                ...(key === 'Character' || key === 'Backpack' || key === 'Glider' || key === 'ItemWrap' || key === 'Pickaxe' || key === 'SkyDiveContrail' || key === 'MusicPack' ? { activeVariants: null } : {}),
                            }
                        };
                        return Object.assign(acc, newSlot);
                    }, {}),
                },
                use_count: 0,
                banner_icon_template: locker.bannerId,
                locker_name: locker.lockerName,
                banner_color_template: locker.bannerColorId,
                items_seen: true,
                favorite: false,
            },
        };
    }
    return tempLoadouts;
}

export function buildOneLoadout(locker: ILocker) {

    const slotsToDatabaseIds: { [x: string]: string } = {
        Character: "characterId",
        Backpack: "backpackId",
        Pickaxe: "pickaxeId",
        Glider: "gliderId",
        SkyDiveContrail: "contrailId",
        MusicPack: "musicPackId",
        LoadingScreen: "loadingScreenId",
        Dance: "danceId",
        ItemWrap: "itemWrapId",
    };

    return {
        templateId: locker.templateId,
        quantity: 1,
        attributes: {
            locker_slots_data: {
                slots: ['Pickaxe', 'Dance', 'Glider', 'Character', 'Backpack', 'ItemWrap', 'LoadingScreen', 'SkyDiveContrail', 'MusicPack'].reduce((acc, key) => {
                    const itemValue = locker[`${slotsToDatabaseIds[key]}`];
                    const item = Array.isArray(itemValue) ? itemValue : [`${itemValue}`];
                    const items = key === 'ItemWrap' ? [...new Array(7)].flatMap(() => item) : key === 'Dance' ? [...new Array(6)].flatMap(() => item) : item;
                    const newSlot = {
                        [key]: {
                            items,
                            ...(key === 'Character' || key === 'Backpack' || key === 'Glider' || key === 'ItemWrap' || key === 'Pickaxe' || key === 'SkyDiveContrail' || key === 'MusicPack' ? { activeVariants: null } : {}),
                        }
                    };
                    return Object.assign(acc, newSlot);
                }, {}),
            },
            use_count: 0,
            banner_icon_template: locker.bannerId,
            locker_name: locker.lockerName,
            banner_color_template: locker.bannerColorId,
            items_seen: true,
            favorite: false,
        },
    };
}