import type { PieceContext } from '@sapphire/pieces';
import fetch from 'node-fetch';
import { stringify } from 'querystring';
import { promisify } from 'util';
import type { ApiRequest } from '../../lib/structures/api/ApiRequest';
import type { ApiResponse } from '../../lib/structures/api/ApiResponse';
import { HttpCodes } from '../../lib/structures/http/HttpCodes';
import { methods } from '../../lib/structures/http/HttpMethods';
import { Route } from '../../lib/structures/Route';

const sleep = promisify(setTimeout);

export class PluginRoute extends Route {
	public constructor(context: PieceContext) {
		super(context, { route: 'oauth/logout' });
		this.enabled = this.container.server.auth !== null;
	}

	public async [methods.POST](request: ApiRequest, response: ApiResponse) {
		if (!request.auth) return response.status(HttpCodes.Unauthorized).json({ error: 'Unauthorized.' });

		const result = await this.revoke(request.auth.token);
		if (result.ok) return this.success(response);

		// RFC 7009 2.2.1. If the server responds with HTTP status code 503, the client must assume the token still
		// exists and may retry after a reasonable delay.
		// The server may include a "Retry-After" header in the response to indicate how long the service is expected to
		// be unavailable to the requesting client.
		if (result.status === HttpCodes.ServiceUnavailable) {
			// RFC 7231 7.1.3. Servers send the "Retry-After" header field to indicate how long the user agent ought to
			// wait before making a follow-up request.
			//
			// The value of this field can be either an HTTP-date or a number of seconds to delay after the response is
			// received.
			const retryAfter = this.processRetryAfter(result.headers.get('Retry-After'));
			if (retryAfter) {
				await sleep(retryAfter);

				const result = await this.revoke(request.auth.token);
				if (result.ok) return this.success(response);
			}
		}

		// RFC 7009 2.2. The authorization server responds with HTTP status code 200 if the token has been revoked
		// successfully or if the client submitted an invalid token.
		//
		// Note: invalid tokens do not cause an error response since the client cannot handle such an error in a
		// reasonable way. Moreover, the purpose of the revocation request, invalidating the particular token, is
		// already achieved.
		return response.status(HttpCodes.InternalServerError).json({ error: 'Unexpected error from server.' });
	}

	private success(response: ApiResponse) {
		// Sending an empty cookie with "expires" set to 1970-01-01 makes the browser instantly remove the cookie.
		response.cookies.remove(this.container.server.auth!.cookie);
		return response.json({ success: true });
	}

	private async revoke(token: string) {
		const auth = this.container.server.auth!;

		// RFC 7009 2.1.
		// The following parameters must be formatted as "application/x-www-form-urlencoded" in the HTTP request-body:
		//
		// - token: The token the client wants to be revoked.
		// - token_type_hint: [Optional]: `access_token` (RFC 6749 1.4), `refresh_token` (RFC 6749 1.5)
		//
		// The client also includes its authentication credentials, as described in RFC 6749 2.3.
		//
		// RFC 6749 2.3.1.
		// The authorization server MAY include the client credentials in the request - body using the following parameters:
		//
		// - client_id: The client identifier issued to the client during the registration process (RFC 6749 2.2)
		// - client_secret: The client secret.
		//
		// RFC 7009 2.2.
		// The content of the response body is ignored by the client as all necessary information is conveyed in the response code.
		const result = await fetch('https://discord.com/api/v8/oauth2/token/revoke', {
			method: 'POST',
			body: stringify({
				token,
				/* eslint-disable @typescript-eslint/naming-convention */
				client_id: auth.id,
				client_secret: auth.secret
				/* eslint-enable @typescript-eslint/naming-convention */
			}),
			headers: {
				'content-type': 'application/x-www-form-urlencoded'
			}
		});

		return result;
	}

	private processRetryAfter(retryAfter: string | null) {
		// Discord sends Retry-After in seconds, never an HTTP-date, therefore, we will assume this behaviour.
		// Either way, if it's not present, we will retry in 5 seconds.
		return retryAfter === null ? 5000 : Number(retryAfter) * 1000;
	}
}
