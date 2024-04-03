import type { ILocker, TempLoadouts } from "../../types/loadouts";

export function buildLoadouts(lockers: ILocker[]) {

    const tempLoadouts: TempLoadouts = {};
    for (const locker of lockers) {
        tempLoadouts[locker.id] = {
            templateId: locker.templateId,
            quantity: 1,
            attributes: {
                locker_slots_data: {
                    slots: ['Pickaxe', 'Dance', 'Glider', 'Character', 'Backpack', 'ItemWrap', 'LoadingScreen', 'SkyDiveContrail', 'MusicPack'].reduce((acc, key) => ({
                        ...acc,
                        [key]: {
                            items: [`${locker[`${key.toLowerCase()}Id`]}`],
                            activeVariants: key === 'Character' ? [{ variants: [] }] : [],
                        }
                    }), {}),
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