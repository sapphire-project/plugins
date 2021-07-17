import { container, Plugin, preGenericsInitialization, preLogin, SapphireClient } from '@sapphire/framework';
import type { ClientOptions } from 'discord.js';
import { InternationalizationClientOptions, InternationalizationHandler } from './index';

export class I18nextPlugin extends Plugin {
	public static [preGenericsInitialization](this: SapphireClient, options: ClientOptions): void {
		container.i18n = new InternationalizationHandler(options.i18n);
		if (typeof options.fetchLanguage === 'function') container.i18n.fetchLanguage = options.fetchLanguage;
	}

	public static async [preLogin](this: SapphireClient): Promise<void> {
		await container.i18n.init();
	}
}

SapphireClient.plugins.registerPostInitializationHook(I18nextPlugin[preGenericsInitialization], 'I18next-PreGenericsInitialization');
SapphireClient.plugins.registerPreLoginHook(I18nextPlugin[preLogin], 'I18next-PreLogin');

declare module '@sapphire/pieces' {
	interface Container {
		i18n: InternationalizationHandler;
	}
}

declare module 'discord.js' {
	export interface ClientOptions extends InternationalizationClientOptions {}
}
