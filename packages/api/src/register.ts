import './index';
import { Plugin, postInitialization, preLogin, SapphireClient } from '@sapphire/framework';
import type { ClientOptions } from 'discord.js';
import { join } from 'path';
import { Server } from './lib/structures/http/Server';

/**
 * @since 1.0.0
 */
export class Api extends Plugin {
	/**
	 * @since 1.0.0
	 */
	public static [postInitialization](this: SapphireClient, options: ClientOptions): void {
		this.server = new Server(options.api);
		this.stores
			.register(this.server.routes) //
			.register(this.server.mediaParsers)
			.register(this.server.middlewares);

		this.stores.get('listeners').registerPath(join(__dirname, 'listeners'));
		this.server.routes.registerPath(join(__dirname, 'routes'));
		this.server.middlewares.registerPath(join(__dirname, 'middlewares'));
		this.server.mediaParsers.registerPath(join(__dirname, 'mediaParsers'));
	}

	/**
	 * @since 1.0.0
	 */
	public static async [preLogin](this: SapphireClient): Promise<void> {
		await this.server.connect();
	}
}

SapphireClient.plugins.registerPostInitializationHook(Api[postInitialization], 'API-PostInitialization');
SapphireClient.plugins.registerPreLoginHook(Api[preLogin], 'API-PreLogin');
