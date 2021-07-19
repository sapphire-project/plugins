import type { PieceContext } from '@sapphire/pieces';
import type { ApiRequest } from '../lib/structures/api/ApiRequest';
import type { ApiResponse } from '../lib/structures/api/ApiResponse';
import { HttpCodes } from '../lib/structures/http/HttpCodes';
import type { MediaParserStore } from '../lib/structures/MediaParserStore';
import { Middleware } from '../lib/structures/Middleware';
import type { Route } from '../lib/structures/Route';

export class PluginMiddleware extends Middleware {
	private readonly mediaParsers: MediaParserStore;
	public constructor(context: PieceContext) {
		super(context, { position: 20 });
		this.mediaParsers = this.container.server.mediaParsers;
	}

	public async run(request: ApiRequest, response: ApiResponse, route: Route) {
		// RFC 1341 4.
		const contentType = request.headers['content-type'];
		if (typeof contentType !== 'string') return;

		// RFC 7230 3.3.2.
		const lengthString = request.headers['content-length'];
		if (typeof lengthString !== 'string') return;

		// Verify if the content length is lower than accepted:
		const length = Number(lengthString);
		const maximumLength = route.maximumBodyLength;
		if (length > maximumLength) {
			response.status(HttpCodes.PayloadTooLarge).json({ error: 'Exceeded maximum content length.' });
			return;
		}

		// Verify if the content type is supported by the parser:
		const type = this.mediaParsers.parseContentType(contentType);
		const parser = this.mediaParsers.get(type);
		if (!parser || !parser.accepts(route)) {
			response.status(HttpCodes.UnsupportedMediaType).json({ error: `Unsupported type ${type}.` });
			return;
		}

		try {
			// Parse the content body:
			request.body = await parser.run(request);
		} catch {
			response.status(HttpCodes.BadRequest).json({ error: `Cannot parse ${type} data.` });
		}
	}
}
