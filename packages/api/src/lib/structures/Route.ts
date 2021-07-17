import { Piece, PieceContext, PieceOptions } from '@sapphire/pieces';
import type { Awaited } from '@sapphire/utilities';
import { Collection } from 'discord.js';
import { RouteData } from '../utils/RouteData';
import { methodEntries, Methods } from './http/HttpMethods';
import type { MimeTypeWithoutParameters } from './http/Server';
import type { MethodCallback, RouteStore } from './RouteStore';

/**
 * @since 1.0.0
 */
export abstract class Route extends Piece {
	/**
	 * (RFC 7230 3.3.2) The maximum decimal number of octets.
	 */
	public readonly maximumBodyLength: number;

	/**
	 * The accepted content types.
	 */
	public readonly acceptedContentMimeTypes: readonly MimeTypeWithoutParameters[] | null;

	/**
	 * The route information.
	 */
	public readonly router: RouteData;

	/**
	 * The methods this route accepts.
	 */
	public readonly methods = new Collection<Methods, MethodCallback>();

	public constructor(context: PieceContext, options: RouteOptions = {}) {
		super(context, options);

		const api = this.container.server.options;
		this.router = new RouteData(`${api.prefix ?? ''}${options.route ?? ''}`);

		for (const [method, symbol] of methodEntries) {
			const value = Reflect.get(this, symbol) as MethodCallback;
			if (typeof value === 'function') this.methods.set(method, value);
		}

		this.maximumBodyLength = options.maximumBodyLength ?? api.maximumBodyLength ?? 1024 * 1024 * 50;
		this.acceptedContentMimeTypes = options.acceptedContentMimeTypes ?? api.acceptedContentMimeTypes ?? null;
	}

	/**
	 * Per-piece listener that is called when the piece is loaded into the store.
	 * Useful to set-up asynchronous initialization tasks.
	 */
	public onLoad(): Awaited<unknown> {
		const store = this.store as unknown as RouteStore;

		for (const [method, cb] of this.methods) {
			store.table.get(method)!.set(this, cb.bind(this));
		}

		return undefined;
	}

	/**
	 * Per-piece listener that is called when the piece is unloaded from the store.
	 * Useful to set-up clean-up tasks.
	 */
	public onUnload(): Awaited<unknown> {
		const store = this.store as unknown as RouteStore;

		for (const [method] of this.methods) {
			store.table.get(method)!.delete(this);
		}

		return undefined;
	}
}

export interface RouteOptions extends PieceOptions {
	/**
	 * The route the piece should represent.
	 * @since 1.0.0
	 * @default ''
	 * @example
	 * ```typescript
	 * '/users'
	 * // request.params -> {}
	 * ```
	 * @example
	 * ```typescript
	 * '/guilds/:guild/members/:member/'
	 * // request.params -> { guild: '...', member: '...' }
	 * ```
	 */
	route?: string;

	/**
	 * (RFC 7230 3.3.2) The maximum decimal number of octets.
	 * @since 1.0.0
	 * @default this.context.server.options.maximumBodyLength ?? 1024 * 1024 * 50
	 */
	maximumBodyLength?: number;

	/**
	 * The accepted content types for this route. If set to null, the route will accept any data.
	 * @since 1.3.0
	 * @default this.context.server.options.acceptedContentMimeTypes ?? null
	 */
	acceptedContentMimeTypes?: MimeTypeWithoutParameters[] | null;
}
