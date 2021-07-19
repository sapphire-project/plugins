import { container } from '@sapphire/pieces';
import { EventEmitter } from 'events';
import { createServer as httpCreateServer, Server as HttpServer, ServerOptions as HttpOptions } from 'http';
import type { ListenOptions } from 'net';
import { ApiRequest } from '../api/ApiRequest';
import { ApiResponse } from '../api/ApiResponse';
import { MediaParserStore } from '../MediaParserStore';
import { MiddlewareStore } from '../MiddlewareStore';
import { RouteMatch, RouteStore } from '../RouteStore';
import { Auth, ServerOptionsAuth } from './Auth';

export const enum ServerEvents {
	Error = 'error',
	Request = 'request',
	Match = 'match',
	NoMatch = 'noMatch',
	RouteError = 'routeError',
	MiddlewareFailure = 'middlewareFailure',
	MiddlewareError = 'middlewareError',
	MiddlewareSuccess = 'middlewareSuccess'
}

/**
 * @since 1.0.0
 */
export class Server extends EventEmitter {
	/**
	 * The routes this server holds.
	 * @since 1.0.0
	 */
	public readonly routes: RouteStore;

	/**
	 * The middlewares this server holds.
	 * @since 1.0.0
	 */
	public readonly middlewares: MiddlewareStore;

	/**
	 * The media parsers this server holds.
	 * @since 1.3.0
	 */
	public readonly mediaParsers: MediaParserStore;

	/**
	 * The authentication system.
	 * @since 1.0.0
	 */
	public readonly auth: Auth | null;

	/**
	 * The http.Server instance that manages the recieved HTTP requests.
	 * @since 1.0.0
	 */
	public readonly server: HttpServer;

	/**
	 * The options for this server.
	 * @since 1.0.0
	 */
	public readonly options: AuthLessServerOptions;

	/**
	 * @since 1.0.0
	 * @param options The options for this server
	 */
	public constructor({ auth, ...options }: ServerOptions = {}) {
		super();

		container.server = this;

		this.options = options;
		this.server = httpCreateServer({
			// eslint-disable-next-line @typescript-eslint/naming-convention
			IncomingMessage: ApiRequest,
			// eslint-disable-next-line @typescript-eslint/naming-convention
			ServerResponse: ApiResponse,
			...(options.server ?? {})
		});
		this.routes = new RouteStore();
		this.middlewares = new MiddlewareStore();
		this.mediaParsers = new MediaParserStore();
		this.auth = Auth.create(auth);
		this.server.on('error', this.emit.bind(this, ServerEvents.Error));
		this.server.on('request', this.emit.bind(this, ServerEvents.Request));
	}

	public connect() {
		const { server } = this;
		server.listen({
			port: 4000,
			...(this.options.listenOptions ?? {})
		});

		return new Promise<void>((resolve, reject) => {
			function listening() {
				cleanup();
				resolve();
			}

			function error(error: Error) {
				cleanup();
				reject(error);
			}

			function close() {
				cleanup();
				reject(new Error('Closed unexpectedly.'));
			}

			function cleanup() {
				server.off('listening', listening);
				server.off('error', error);
				server.off('close', close);
			}

			server.on('listening', listening);
			server.on('error', error);
			server.on('close', close);
		});
	}

	public disconnect() {
		return new Promise<void>((resolve, reject) => {
			this.server.close((error) => (error ? resolve() : reject(error)));
		});
	}
}

/**
 * RFC 1341 4: Defines a Content-Type's type, which follows the following structure:
 *
 * - `type` = `text` | `multipart` | `message` | `image` | `audio` | `video` | `application` | x-token
 * - `x-token` = The two characters "X-" followed, with no intervening white space, by any token
 * @since 1.3.0
 */
export type ContentTypeType = 'text' | 'multipart' | 'message' | 'image' | 'audio' | 'video' | 'application' | `X-${string}`;

/**
 * RFC 1341 4: Defines a Content-Type's parameter, which follows the following structure:
 *
 * - `parameter` = `attribute` "=" `value`
 * - `attribute` = `token`
 * - `value` = `token` / `quoted-string`
 * - `token` = 1*<any CHAR except `SPACE`, `CTLs`, or `tspecials`>
 * - `tspecials` = `(` | `)` | `<` | `>` | `@` | `,` | `;` | `:` | `\` | `"` | `/` | `[` | `]` | `?` | `.` | `=`
 *
 * @note `tspecials` must be in quoted-string, to use within parameter values.
 * @note The definition of `tspecials` is the same as the RFC 822 definition of `specials` with the addition of the
 * three characters `/`, `?`, and `=`.
 * @since 1.3.0
 */
export type ContentTypeParameter = `; ${string}=${string}`;

/**
 * RFC 1341 4: Defines the syntax for a Content-Type field without parameters, which follows the following structure:
 * `type "/" subtype`.
 */
export type MimeTypeWithoutParameters = `${ContentTypeType}/${string}`;

/**
 * RFC 1341 4: Defines the syntax for a Content-Type field, which follows the following structure:
 * `type "/" subtype *[";" parameter]`.
 * @since 1.3.0
 */
export type MimeType = `${MimeTypeWithoutParameters}${'' | ContentTypeParameter}`;

/**
 * The API options.
 * @since 1.0.0
 */
export interface ServerOptions {
	/**
	 * The prefix for all routes, e.g. `v1/`.
	 * @since 1.0.0
	 * @default ''
	 */
	prefix?: string;

	/**
	 * The origin header to be set on every request at 'Access-Control-Allow-Origin'.
	 * @since 1.0.0
	 * @default '*'
	 */
	origin?: string;

	/**
	 * (RFC 7230 3.3.2) The maximum decimal number of octets.
	 * @since 1.0.0
	 * @default 1024 * 1024 * 50
	 */
	maximumBodyLength?: number;

	/**
	 * The accepted content types for this route. If set to null, the route will accept any data.
	 * @since 1.3.0
	 * @default null
	 */
	acceptedContentMimeTypes?: MimeTypeWithoutParameters[] | null;

	/**
	 * The HTTP server options.
	 * @since 1.0.0
	 * @default {}
	 */
	server?: HttpOptions;

	/**
	 * The HTTP listen options.
	 * @since 1.0.0
	 * @default { port: 4000 }
	 */
	listenOptions?: ListenOptions;

	/**
	 * The auth options. If neither `auth` nor `auth.secret` are defined, auth-related routes and middlewares will be
	 * automatically disabled.
	 * @since 1.0.0
	 * @default {}
	 */
	auth?: ServerOptionsAuth;
}

/**
 * The {@link ServerOptions} without {@link ServerOptions.auth}.
 * @since 1.0.0
 */
export type AuthLessServerOptions = Omit<ServerOptions, 'auth'>;

/**
 * The context sent in the error events.
 * @since 1.2.0
 */
export interface MiddlewareErrorContext {
	/**
	 * The erroneous request.
	 * @since 1.2.0
	 */
	request: ApiRequest;

	/**
	 * The server's response.
	 * @since 1.2.0
	 */
	response: ApiResponse;

	/**
	 * The route match.
	 * @since 1.2.0
	 */
	match: RouteMatch;
}

declare module '@sapphire/pieces' {
	interface PieceContextExtras {
		server: Server;
	}
}
