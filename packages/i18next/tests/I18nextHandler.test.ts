import { isClass } from '@sapphire/utilities';
import { InternationalizationHandler } from '../src';

function structureTest(i18n: InternationalizationHandler) {
	expect(i18n.languagesLoaded).toBe(false);
	expect(i18n.languages).toBeDefined();
}

describe('InternationalizationHandler', () => {
	test('InternationalizationHandler should be a class', () => {
		expect(isClass(InternationalizationHandler)).toBe(true);
	});

	test('Empty Constructor', () => {
		const i18n = new InternationalizationHandler();
		structureTest(i18n);
	});

	test('Empty Object Constructor', () => {
		const i18n = new InternationalizationHandler({});
		structureTest(i18n);
	});
});
