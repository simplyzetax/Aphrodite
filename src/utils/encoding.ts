import type { Context } from "hono";

class Encoding {
    public static encodeBase64(input: string): string {
        return btoa(input);
    }

    public static decodeBase64(input: string): string {
        return atob(input);
    }

    public static encodeUtf8(input: string): string {
        return unescape(encodeURIComponent(input));
    }

    public static decodeUtf8(input: string): string {
        return decodeURIComponent(escape(input));
    }

    public static isValidBase64(input: string): boolean {
        return /^[A-Za-z0-9+/]*={0,2}$/.test(input);
    }

    public static async getJSONBody(c: Context): Promise<any | undefined> {
        try {
            return await c.req.json();
        } catch (e) {
            return undefined;
        }
    }
}

export default Encoding;