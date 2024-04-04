import * as crypto from 'node:crypto';

class Hashing {

    /**
     * 
     * @param data The data to hash
     * @returns The hashed data
     */
    public static sha256(data: any): string {
        const hasher = new Bun.CryptoHasher('sha256');
        hasher.update(data);
        hasher.digest();

        return hasher.digest('hex');
    }

    /**
     * 
     * @param data The data to hash
     * @returns The hashed data
     */
    public static sha1(data: any): string {
        const hasher = new Bun.CryptoHasher('sha1');
        hasher.update(data);
        hasher.digest();

        return hasher.digest('hex');
    }

    /**
     * 
     * @param data The data to hash
     * @returns The hashed data
     */
    public static md5(data: any): string {
        const hasher = new Bun.CryptoHasher('md5');
        hasher.update(data);
        hasher.digest();

        return hasher.digest('hex');
    }

    /**
     * 
     * @param plaintextPassword The password to hash
     * @returns The hashed password
     */
    public static async hashPassword(plaintextPassword: string): Promise<string> {
        return await Bun.password.hash(plaintextPassword);
    }

    /**
     * 
     * @param password The password to verify
     * @param hash The hash to verify against
     * @returns Whether the password matches the hash
     */
    public static async verifyPassword(password: string, hash: string): Promise<boolean> {
        return await Bun.password.verify(password, hash);
    }

    /**
     *
     * @param data The data to encrypt
     * @param password The password to encrypt the data with
     * @returns The encrypted data as a string
     */
    public static encrypt(data: string, password: string): string {
        const iv = crypto.randomBytes(16);
        const key = crypto.scryptSync(password, 'salt', 32);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    /**
     *
     * @param data The data to decrypt
     * @param password The password to decrypt the data with
     * @returns The decrypted data as a string
     */
    public static decrypt(data: string, password: string): string {
        const textParts = data.split(':');
        const shifted = textParts.shift();
        if (!shifted) {
            throw new Error('Invalid data');
        }
        const iv = Buffer.from(shifted, 'hex');
        const key = crypto.scryptSync(password, 'salt', 32);
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(textParts.join(':'), 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

export default Hashing;