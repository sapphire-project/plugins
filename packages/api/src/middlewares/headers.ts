import type { PieceContext } from '@sapphire/pieces';
import { METHODS } from 'http';
import type { ApiRequest } from '../lib/structures/api/ApiRequest';
import type { ApiResponse } from '../lib/structures/api/ApiResponse';
import { Middleware } from '../lib/structures/Middleware';
import type { Route } from '../lib/structures/Route';

export class PluginMiddleware extends Middleware {
	private readonly origin: string;
	private readonly methods: string = METHODS.join(', ');

	public constructor(context: PieceContext) {
		super(context, { position: 10 });
		this.origin = this.container.server.options.origin ?? '*';
	}

	public run(request: ApiRequest, response: ApiResponse, route: Route | null) {
		response.setHeader('Date', new Date().toUTCString());
		response.setHeader('Access-Control-Allow-Credentials', 'true');
		response.setHeader('Access-Control-Allow-Origin', this.origin);
		response.setHeader('Access-Control-Allow-Headers', 'Authorization, User-Agent, Content-Type');
		response.setHeader('Access-Control-Allow-Methods', this.methods);

		// RFC 7231 4.3.7.
		// > This method allows a client to determine the options and/or requirements associated with a
		// > resource, or the capabilities of a server, without implying a resource action.
		//
		// Due to this method's nature, it is recommended to end the request after setting pre-flight CORS headers.
		if (request.method === 'OPTIONS') response.end();
		// If there is no route, there is no reason to continue matching other middlewares.
		else if (route === null) response.end();
	}
}
