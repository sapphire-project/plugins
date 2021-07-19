import { getRootData } from '@sapphire/pieces';
import { isFunction } from '@sapphire/utilities';
import { opendir } from 'fs/promises';
import i18next, { StringMap, TFunction, TFunctionKeys, TFunctionResult, TOptions } from 'i18next';
import Backend, { i18nextFsBackend } from 'i18next-fs-backend';
import { join } from 'path';
import type { O } from './internals';
import type { InternationalizationContext, InternationalizationOptions } from './types';

/**
 * A generalized class for handling `i18next` JSON files and their discovery.
 * @since 1.0.0
 */
export class InternationalizationHandler {
	/**
	 * Describes whether {@link InternationalizationHandler.init} has been run and languages are loaded in {@link InternationalizationHandler.languages}.
	 * @since 1.0.0
	 */
	public languagesLoaded = false;

	/**
	 * A `Set` of initially loaded namespaces.
	 * @since 1.2.0
	 */
	public namespaces = new Set<string>();

	/**
	 * A `Map` of `i18next` language functions keyed by their language code.
	 * @since 1.0.0
	 */
	public readonly languages = new Map<string, TFunction>();

	/**
	 * The options InternationalizationHandler was initialized with in the client.
	 * @since 1.0.0
	 */
	public readonly options: InternationalizationOptions;

	/**
	 * The director passed to `i18next-fs-backend`.
	 * Also used in {@link InternationalizationHandler.walkLanguageDirectory}.
	 * @since 1.2.0
	 */
	public readonly languagesDir: string;

	/**
	 * The backend options for `i18next-fs-backend` used by `i18next`.
	 * @since 1.0.0
	 */
	protected readonly backendOptions: i18nextFsBackend.i18nextFsBackendOptions;

	/**
	 * @param options The options that `i18next`, `i18next-fs-backend`, and {@link InternationalizationHandler} should use.
	 * @since 1.0.0
	 * @constructor
	 */
	public constructor(options?: InternationalizationOptions) {
		this.options = options ?? {};
		this.languagesDir = this.options.defaultLanguageDirectory ?? join(getRootData().root, 'languages');

		this.backendOptions = {
			loadPath: join(this.languagesDir, '{{lng}}', '{{ns}}.json'),
			addPath: this.languagesDir,
			...this.options.backend
		};
	}

	/**
	 * The method to be overridden by the developer.
	 *
	 * @note In the event that fetchLanguage is not defined or returns null / undefined, the defaulting from {@link fetchLanguage} will be used.
	 * @since 2.0.0
	 * @return A string for the desired language or null for no match.
	 * @see {@link fetchLanguage}
	 * @example
	 * ```typescript
	 * // Always use the same language (no per-guild configuration):
	 * client.fetchLanguage = () => 'en-US';
	 * ```
	 * @example
	 * ```typescript
	 * // Retrieving the language from an SQL database:
	 * client.fetchLanguage = async (context) => {
	 *   const guild = await driver.getOne('SELECT language FROM public.guild WHERE id = $1', [context.guild.id]);
	 *   return guild?.language ?? 'en-US';
	 * };
	 * ```
	 * @example
	 * ```typescript
	 * // Retrieving the language from an ORM:
	 * client.fetchLanguage = async (context) => {
	 *   const guild = await driver.getRepository(GuildEntity).findOne({ id: context.guild.id });
	 *   return guild?.language ?? 'en-US';
	 * };
	 * ```
	 * @example
	 * ```typescript
	 * // Retrieving the language on a per channel basis, e.g. per user or guild channel (ORM example but same principles apply):
	 * client.fetchLanguage = async (context) => {
	 *   const channel = await driver.getRepository(ChannelEntity).findOne({ id: context.channel.id });
	 *   return channel?.language ?? 'en-US';
	 * };
	 * ```
	 */
	public fetchLanguage: (context: InternationalizationContext) => Promise<string | null> | string | null = () => null;

	/**
	 * Initializes the handler by loading in the namespaces, passing the data to i18next, and filling in the {@link InternationalizationHandler#languages}.
	 * @since 1.0.0
	 */
	public async init() {
		const { namespaces, languages } = await this.walkLanguageDirectory(this.languagesDir);
		const userOptions = isFunction(this.options.i18next) ? this.options.i18next(namespaces, languages) : this.options.i18next;

		i18next.use(Backend);
		await i18next.init({
			backend: this.backendOptions,
			fallbackLng: this.options.defaultName ?? 'en-US',
			initImmediate: false,
			interpolation: {
				escapeValue: false,
				...userOptions?.interpolation
			},
			load: 'all',
			defaultNS: 'default',
			ns: namespaces,
			preload: languages,
			...userOptions
		});

		this.namespaces = new Set(namespaces);
		for (const item of languages) {
			this.languages.set(item, i18next.getFixedT(item));
		}
		this.languagesLoaded = true;
	}

	/**
	 * Retrieve a raw TFunction from the passed locale.
	 * @param locale The language to be used.
	 * @since 1.0.0
	 */
	public getT(locale: string) {
		if (!this.languagesLoaded) throw new Error('Cannot call this method until InternationalizationHandler#init has been called');

		const t = this.languages.get(locale);
		if (t) return t;
		throw new ReferenceError('Invalid language provided');
	}

	/**
	 * Localizes a content given one or more keys and i18next options.
	 * @since 2.0.0
	 * @param locale The language to be used.
	 * @param key The key or keys to retrieve the content from.
	 * @param options The interpolation options.
	 * @see {@link https://www.i18next.com/overview/api#t}
	 * @returns The localized content.
	 */
	public format<TResult extends TFunctionResult = string, TKeys extends TFunctionKeys = string, TInterpolationMap extends O = StringMap>(
		locale: string,
		key: TKeys | TKeys[],
		options?: TOptions<TInterpolationMap>
	): TResult {
		if (!this.languagesLoaded) throw new Error('Cannot call this method until InternationalizationHandler#init has been called');

		const language = this.languages.get(locale);
		if (!language) throw new ReferenceError('Invalid language provided');

		const missingHandlers = this.options.defaultMissingKey
			? { defaultValue: language(this.options.defaultMissingKey, { replace: { key } }) }
			: undefined;

		return language(key, { ...missingHandlers, ...options });
	}

	/**
	 * @description Skips any files that don't end with `.json`.
	 * @param dir The directory that should be walked.
	 * @param namespaces The currently known namespaces.
	 * @param current The directory currently being traversed.
	 * @since 1.0.0
	 */
	public async walkLanguageDirectory(dir: string, namespaces: string[] = [], current = '') {
		const directory = await opendir(dir);

		const languages: string[] = [];
		for await (const entry of directory) {
			const fn = entry.name;
			if (entry.isDirectory()) {
				// This structure may very well be changed in future.
				// See i18next/i18next-fs-backend#13
				const isLanguage = fn.includes('-');
				if (isLanguage) languages.push(fn);

				({ namespaces } = await this.walkLanguageDirectory(join(dir, fn), namespaces, isLanguage ? '' : `${fn}/`));
			} else if (entry.name.endsWith('.json')) {
				namespaces.push(`${current}${fn.substr(0, fn.length - 5)}`);
			}
		}

		return { namespaces: [...new Set(namespaces)], languages };
	}
}
