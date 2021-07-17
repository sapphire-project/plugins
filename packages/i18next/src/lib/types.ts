import type { DMChannel, Guild, NewsChannel, StageChannel, StoreChannel, TextChannel, ThreadChannel, User, VoiceChannel } from 'discord.js';
import type { InitOptions } from 'i18next';
import type { i18nextFsBackend } from 'i18next-fs-backend';

/**
 * Used to dynamically add options based on found languages in {@link InternationalizationHandler#init}.
 * @since 1.1.0
 * @private
 */
export type DynamicOptions<T extends InitOptions> = (namespaces: string[], languages: string[]) => T;

/**
 * The options used in {@link InternationalizationHandler}.
 * @since 1.0.0
 */
export interface InternationalizationOptions {
	/**
	 * Used as the default 2nd to last fallback locale if no other is found.
	 * It's only followed by "en-US".
	 * @since 1.0.0
	 */
	defaultName?: string;

	/**
	 * The options passed to `backend` in `i18next.init`.
	 * @since 1.0.0
	 */
	backend?: i18nextFsBackend.i18nextFsBackendOptions;

	/**
	 * The options passed to `i18next.init`.
	 * @since 1.0.0
	 */
	i18next?: InitOptions | DynamicOptions<InitOptions>;

	/**
	 * The directory in which "i18next-fs-backend" should search for files.
	 * Defaults to "<rootDirectory>/languages".
	 * @since 1.0.0
	 */
	defaultLanguageDirectory?: string;

	/**
	 * The default value to be used if a specific language key isn't found.
	 * Defaults to "default:default".
	 * @since 1.0.0
	 */
	defaultMissingKey?: string;

	/**
	 * The default NS that is prefixed to all keys that don't specify it.
	 * Defaults to "default".
	 * @since 1.0.0
	 */
	defaultNS?: string;
}

export type TextBasedDiscordChannel = TextChannel | NewsChannel | ThreadChannel | DMChannel;
export type DiscordChannel = TextBasedDiscordChannel | StoreChannel | StageChannel | VoiceChannel;

/**
 * Context for {@link I18nextBaseImplementation.fetchLanguage} functions.
 * This context enables implementation of per-guild, per-channel, and per-user localization.
 */
export interface InternationalizationContext {
	guild: Guild | null;
	channel: DiscordChannel | null;
	author: User | null;
}

export interface InternationalizationClientOptions {
	i18n?: InternationalizationOptions;

	/**
	 * Hook that returns the name of a language. Should correspond to {@link I18nextClient.fetchLanguage}.
	 * @since 1.0.0
	 * @default () => {@link I18nOptions.defaultName}
	 */
	fetchLanguage?: (context: InternationalizationContext) => Promise<string | null> | string | null;
}
