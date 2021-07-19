import { Listener, PieceContext } from '@sapphire/framework';
import type { ApiRequest } from '../lib/structures/api/ApiRequest';
import type { ApiResponse } from '../lib/structures/api/ApiResponse';
import { ServerEvents } from '../lib/structures/http/Server';
import type { RouteMatch } from '../lib/structures/RouteStore';

export class PluginEvent extends Listener {
	public constructor(context: PieceContext) {
		super(context, { emitter: 'server', event: ServerEvents.MiddlewareSuccess });
	}

	public async run(request: ApiRequest, response: ApiResponse, match: RouteMatch) {
		try {
			await match.cb(request, response);
		} catch (error) {
			this.container.server.emit(ServerEvents.RouteError, error, { request, response, match });
		}
	}
}
