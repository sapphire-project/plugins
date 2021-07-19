import type { PieceContext } from '@sapphire/pieces';
import type { ApiRequest } from '../lib/structures/api/ApiRequest';
import type { ApiResponse } from '../lib/structures/api/ApiResponse';
import { CookieStore } from '../lib/structures/api/CookieStore';
import { Middleware } from '../lib/structures/Middleware';

export class PluginMiddleware extends Middleware {
	private readonly production: boolean = process.env.NODE_ENV === 'production';
	private domainOverwrite: string | null = null;
	public constructor(context: PieceContext) {
		super(context, { position: 30 });

		const { server } = this.container;
		this.domainOverwrite = server.auth?.domainOverwrite ?? null;
	}

	public run(request: ApiRequest, response: ApiResponse) {
		response.cookies = new CookieStore(request, response, this.production, this.domainOverwrite);
	}
}
