import { container } from '@sapphire/pieces';
import { isObject } from '@sapphire/utilities';
import { Message, MessageOptions } from 'discord.js';
import type { StringMap, TFunctionKeys, TFunctionResult, TOptions } from 'i18next';
import type { O } from './internals';
import type { DiscordChannel, InternationalizationContext, TextBasedDiscordChannel } from './types';

type Target = Message | DiscordChannel;

/**
 * Retrieves the language name for a specific target, using {@link InternationalizationHandler.fetchLanguage}, and if it
 * returns a nullish value, then it falls back to {@link Guild.preferredLocale}, then
 * {@link InternationalizationOptions.defaultName} if no guild was provided, and finally 'en-US' if none was set.
 * @since 2.0.0
 * @param target The target to fetch the language from.
 * @see {@link _fetchLanguage}
 * @returns The name of the language key.
 */
export function fetchLanguage(target: Target): Promise<string> {
	// Handle Message:
	if (target instanceof Message) {
		return _fetchLanguage({ author: target.author, channel: target.channel, guild: target.guild });
	}

	// Handle DMChannel:
	if (target.type === 'DM') {
		return _fetchLanguage({ author: null, channel: target, guild: null });
	}

	// Handle any other channel:
	return _fetchLanguage({ author: null, channel: target, guild: target.guild });
}

/**
 * Retrieves the language-assigned function from i18next designated to a target's preferred language code.
 * @since 2.0.0
 * @param target The target to fetch the language from.
 * @returns The language function from i18next.
 */
export async function fetchT(target: Target) {
	return container.i18n.getT(await fetchLanguage(target));
}

/**
 * Resolves a key and its parameters.
 * @since 2.0.0
 * @param target The target to fetch the language key from.
 * @param key The i18next key.
 * @param values The values to be passed to TFunction.
 * @returns The data that `key` held, processed by i18next.
 */
export async function resolveKey<
	TResult extends TFunctionResult = string,
	TKeys extends TFunctionKeys = string,
	TInterpolationMap extends O = StringMap
>(target: Target, key: TKeys | TKeys[], options?: TOptions<TInterpolationMap>): Promise<TResult> {
	return container.i18n.format(await fetchLanguage(target), key, options);
}

export interface LocalizedMessageOptions<TKeys extends TFunctionKeys = string, TInterpolationMap extends O = StringMap>
	extends PartialLocalizedMessageOptions<TInterpolationMap> {
	keys: TKeys | TKeys[];
}

export interface PartialLocalizedMessageOptions<TInterpolationMap extends O = StringMap> extends Omit<MessageOptions, 'content'> {
	formatOptions?: TOptions<TInterpolationMap>;
}

/**
 * Send a localized message using `key`an objects option.
 * @since 2.0.0
 * @param target The target to send the message to.
 * @param options The options to be sent, requiring at least `keys` to be passed.
 * @example
 * ```typescript
 * await sendLocalized(message, 'commands/ping:loading');
 * // ➡ "Pinging..."
 * ```
 */
export async function sendLocalized<TKeys extends TFunctionKeys = string>(target: Target, keys: TKeys | TKeys[]): Promise<Message>;

/**
 * Send a localized message using an objects option.
 * @since 2.0.0
 * @param target The target to send the message to.
 * @param options The options to be sent, requiring at least `keys` to be passed.
 * @example
 * ```typescript
 * await sendLocalized(message, { keys: 'commands/ping:loading' });
 * // ➡ "Pinging..."
 * ```
 * @example
 * ```typescript
 * const latency = 42;
 *
 * await sendLocalized(message, {
 * 	keys: 'commands/ping:loading',
 * 	formatOptions: { latency }
 * });
 * // ➡ "Pinging... current latency is 42ms."
 * ```
 */
export async function sendLocalized<TKeys extends TFunctionKeys = string, TInterpolationMap extends O = StringMap>(
	target: Target,
	options: LocalizedMessageOptions<TKeys, TInterpolationMap>
): Promise<Message>;
export async function sendLocalized<TKeys extends TFunctionKeys = string, TInterpolationMap extends O = StringMap>(
	target: Target,
	options: TKeys | TKeys[] | LocalizedMessageOptions<TKeys, TInterpolationMap>
): Promise<Message> {
	const channel = _getChannel(target);
	return channel.send(await _resolveOverloads(target, options));
}

/**
 * Edits a message using the language key only.
 * @since 2.0.0
 * @param target The target to send the message to.
 * @param options The options to be sent, requiring at least `keys` to be passed.
 * @example
 * ```typescript
 * await sendLocalized(message, 'commands/ping:success');
 * // ➡ "Pong!"
 * ```
 */
export async function editLocalized<TKeys extends TFunctionKeys = string>(target: Message, keys: TKeys | TKeys[]): Promise<Message>;

/**
 * Edits a message using an objects option.
 * @since 2.0.0
 * @param target The target to send the message to.
 * @param options The options to be sent, requiring at least `keys` to be passed.
 * @example
 * ```typescript
 * await editLocalized(message, { keys: 'commands/ping:success' });
 * // ➡ "Pong!"
 * ```
 * @example
 * ```typescript
 * const latency = 42;
 * const took = 96;
 *
 * await editLocalized(message, {
 * 	keys: 'commands/ping:success',
 * 	formatOptions: { latency, took }
 * });
 * // ➡ "Pong! Took me 96ms to reply, and my heart took 42ms to beat!"
 * ```
 */
export async function editLocalized<TKeys extends TFunctionKeys = string, TInterpolationMap extends O = StringMap>(
	target: Message,
	options: LocalizedMessageOptions<TKeys, TInterpolationMap>
): Promise<Message>;
export async function editLocalized<TKeys extends TFunctionKeys = string, TInterpolationMap extends O = StringMap>(
	target: Message,
	options: TKeys | TKeys[] | LocalizedMessageOptions<TKeys, TInterpolationMap>
): Promise<Message> {
	return target.edit(await _resolveOverloads(target, options));
}

async function _fetchLanguage(context: InternationalizationContext): Promise<string> {
	const lang = await container.i18n.fetchLanguage(context);
	return lang ?? context.guild?.preferredLocale ?? container.i18n.options.defaultName ?? 'en-US';
}

function _getChannel(target: Target): TextBasedDiscordChannel {
	if (target instanceof Message) return target.channel;
	if (target.isText()) return target;
	throw new TypeError(`Cannot resolve ${target.name} to a text-based channel.`);
}

async function _resolveOverloads<TKeys extends TFunctionKeys = string, TInterpolationMap extends O = StringMap>(
	target: Target,
	options: TKeys | TKeys[] | LocalizedMessageOptions<TKeys, TInterpolationMap>
) {
	if (isObject(options)) {
		const casted = options as LocalizedMessageOptions<TKeys, TInterpolationMap>;
		return { ...options, content: await resolveKey(target, casted.keys, casted.formatOptions) };
	}

	return { content: await resolveKey(target, options) };
}
