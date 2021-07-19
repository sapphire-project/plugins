import type { Server, ServerOptions } from './lib/structures/http/Server';
import type { MediaParserStore } from './lib/structures/MediaParserStore';
import type { MiddlewareStore } from './lib/structures/MiddlewareStore';
import type { RouteStore } from './lib/structures/RouteStore';

export * from './lib/structures/api/ApiRequest';
export * from './lib/structures/api/ApiResponse';
export * from './lib/structures/api/CookieStore';
export * from './lib/structures/http/Auth';
export * from './lib/structures/http/HttpCodes';
export * from './lib/structures/http/HttpMethods';
export * from './lib/structures/http/Server';
export * from './lib/structures/MediaParser';
export * from './lib/structures/MediaParserStore';
export * from './lib/structures/Middleware';
export * from './lib/structures/MiddlewareStore';
export * from './lib/structures/Route';
export * from './lib/structures/RouteStore';
export * from './lib/utils/MimeTypes';
export * from './lib/utils/RouteData';

declare module 'discord.js' {
	interface Client {
		server: Server;
	}

	interface ClientOptions {
		api?: ServerOptions;
	}
}

declare module '@sapphire/pieces' {
	interface StoreRegistryEntries {
		routes: RouteStore;
		mediaParsers: MediaParserStore;
		middlewares: MiddlewareStore;
	}

	interface PieceContextExtras {
		server: Server;
	}
}
