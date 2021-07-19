import { Listener, PieceContext } from '@sapphire/framework';
import type { ApiRequest } from '../lib/structures/api/ApiRequest';
import type { ApiResponse } from '../lib/structures/api/ApiResponse';
import { ServerEvents } from '../lib/structures/http/Server';

export class PluginEvent extends Listener {
	public constructor(context: PieceContext) {
		super(context, { emitter: 'server', event: ServerEvents.NoMatch });
	}

	public run(_: ApiRequest, response: ApiResponse) {
		if (!response.writableEnded) response.notFound();
	}
}
