import { ServerResponse, STATUS_CODES } from 'http';
import { MimeTypes } from '../../utils/MimeTypes';
import { HttpCodes } from '../http/HttpCodes';
import type { CookieStore } from './CookieStore';

/**
 * @since 1.0.0
 */
export class ApiResponse extends ServerResponse {
	/**
	 * @since 1.0.0
	 */
	public cookies!: CookieStore;

	/**
	 * @since 1.0.0
	 */
	public ok(data: unknown = STATUS_CODES[HttpCodes.OK]) {
		this.status(HttpCodes.OK);
		return this.respond(data);
	}

	/**
	 * @since 1.0.0
	 */
	public created(data: unknown = STATUS_CODES[HttpCodes.Created]) {
		this.status(HttpCodes.Created);
		return this.respond(data);
	}

	/**
	 * @since 1.0.0
	 */
	public noContent(data: unknown = STATUS_CODES[HttpCodes.NoContent]) {
		this.status(HttpCodes.NoContent);
		return this.respond(data);
	}

	/**
	 * @since 1.0.0
	 */
	public badRequest(data?: unknown) {
		return this.error(HttpCodes.BadRequest, data);
	}

	/**
	 * @since 1.0.0
	 */
	public unauthorized(data?: unknown) {
		return this.error(HttpCodes.Unauthorized, data);
	}

	/**
	 * @since 1.0.0
	 */
	public forbidden(data?: unknown) {
		return this.error(HttpCodes.Forbidden, data);
	}

	/**
	 * @since 1.0.0
	 */
	public notFound(data?: unknown) {
		return this.error(HttpCodes.NotFound, data);
	}

	/**
	 * @since 1.0.0
	 */
	public conflict(data?: unknown) {
		return this.error(HttpCodes.Conflict, data);
	}

	/**
	 * @since 1.0.0
	 */
	public error(error: number | string, data?: unknown): void {
		if (typeof error === 'string') {
			return this.status(HttpCodes.InternalServerError).json({ error });
		}

		return this.status(error).json({ error: data ?? STATUS_CODES[error] });
	}

	/**
	 * @since 1.0.0
	 */
	public respond(data: unknown) {
		return typeof data === 'string' ? this.text(data) : this.json(data);
	}

	/**
	 * @since 1.0.0
	 */
	public status(code: number): this {
		this.statusCode = code;
		return this;
	}

	/**
	 * @since 1.0.0
	 */
	public json(data: any): void {
		return this.setContentType(MimeTypes.ApplicationJson).end(JSON.stringify(data));
	}

	/**
	 * @since 1.0.0
	 */
	public text(data: string): void {
		return this.setContentType(MimeTypes.TextPlain).end(data);
	}

	/**
	 * @since 1.0.0
	 */
	public setContentType(contentType: MimeTypes) {
		this.setHeader('Content-Type', contentType);
		return this;
	}
}
