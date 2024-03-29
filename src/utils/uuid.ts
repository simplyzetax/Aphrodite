import { v4 as uuidv4 } from 'uuid';

class UUID {
    /**
     * 
     * @returns {string} UUID v4
     */
    public static gr(): string {
        return uuidv4().replace(/-/g, '');
    }

    public static g(): string {
        return uuidv4();
    }
}

export default UUID;