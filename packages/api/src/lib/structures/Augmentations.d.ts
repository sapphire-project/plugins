/**
 * ================================================
 * | THIS IS FOR TYPEDOC. DO NOT REMOVE THIS FILE |
 * ===============================================
 */

import type { RouteStore, MiddlewareStore } from '../..';
import type { Server, ServerOptions } from './http/Server';
import type { MediaParserStore } from './MediaParserStore';

declare module 'discord.js' {
	export interface Client {
		server: Server;
	}

	export interface ClientOptions {
		api?: ServerOptions;
	}
}

declare module '@sapphire/framework' {
	interface StoreRegistryEntries {
		routes: RouteStore;
		mediaParsers: MediaParserStore;
		middlewares: MiddlewareStore;
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		server: Server;
	}
}
