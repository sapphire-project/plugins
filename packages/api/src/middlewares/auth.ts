import type { PieceContext } from '@sapphire/pieces';
import type { ApiRequest } from '../lib/structures/api/ApiRequest';
import type { ApiResponse } from '../lib/structures/api/ApiResponse';
import { Middleware } from '../lib/structures/Middleware';

export class PluginMiddleware extends Middleware {
	private readonly cookieName: string;
	public constructor(context: PieceContext) {
		super(context, { position: 40 });

		const { server } = this.container;
		this.cookieName = server.auth?.cookie ?? 'SAPPHIRE_AUTH';
		this.enabled = server.auth !== null;
	}

	public run(request: ApiRequest, response: ApiResponse) {
		// If there are no cookies, set auth as null:
		const authorization = response.cookies.get(this.cookieName);
		if (!authorization) {
			request.auth = null;
			return;
		}

		// Decrypt the cookie, and if the token is invalid, remove the cookie:
		request.auth = this.container.server.auth!.decrypt(authorization);
		if (request.auth === null) response.cookies.remove(this.cookieName);
	}
}
