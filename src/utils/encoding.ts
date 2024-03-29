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
}

export default Encoding;