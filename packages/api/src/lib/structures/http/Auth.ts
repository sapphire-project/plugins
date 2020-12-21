import type { SapphireClient } from '@sapphire/framework';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

export class Auth {
	public client: SapphireClient;

	// eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
	#secret: string;

	public constructor(client: SapphireClient, secret: string) {
		this.client = client;
		this.#secret = secret;
	}

	/**
	 * Encrypts an object with aes-256-cbc to use as a token.
	 * @since 1.0.0
	 * @param data An object to encrypt
	 * @param secret The secret to encrypt the data with
	 */
	public encrypt(data: AuthData): string {
		const iv = randomBytes(16);
		const cipher = createCipheriv('aes-256-cbc', this.#secret, iv);
		return `${cipher.update(JSON.stringify(data), 'utf8', 'base64') + cipher.final('base64')}.${iv.toString('base64')}`;
	}

	/**
	 * Decrypts an object with aes-256-cbc to use as a token.
	 * @since 1.0.0
	 * @param token An data to decrypt
	 * @param secret The secret to decrypt the data with
	 */
	public decrypt(token: string): AuthData {
		const [data, iv] = token.split('.');
		const decipher = createDecipheriv('aes-256-cbc', this.#secret, Buffer.from(iv, 'base64'));
		return JSON.parse(decipher.update(data, 'base64', 'utf8') + decipher.final('utf8'));
	}
}

export interface AuthData {
	id: string;
	expires: number;
	refresh: string;
	token: string;
}
