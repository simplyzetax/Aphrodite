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
}

export default Encoding;