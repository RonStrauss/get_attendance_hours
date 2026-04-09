import type { DefaultOptionType } from 'antd/es/select';

export type ScraperTarget = 'hilan' | 'synerion';
export type AutomatorTarget = 'webtime';
export type DayModifierKey = 'vacation' | 'sickDays' | 'splitDays';
export type ThemeMode = 'system' | 'light' | 'dark';

export interface ScrapeRequestBody {
	SCRAPING_TARGET: ScraperTarget;
	AUTOMATION_TARGET: AutomatorTarget;
	SCRAPER_USERNAME: string;
	SCRAPER_PASSWORD: string;
	AUTOMATOR_USERNAME: string;
	AUTOMATOR_PASSWORD: string;
}

export interface ScrapeResponse {
	insertedDays: number;
}

/** Reuse antd's DefaultOptionType instead of declaring our own SelectOption */
export type SelectOption<T extends string = string> = DefaultOptionType & { value: T };

export interface DayModifierConfig {
	key: DayModifierKey;
	supported: boolean;
}

export interface AppConfigResponse {
	scrapingTargets: SelectOption<ScraperTarget>[];
	automationTargets: SelectOption<AutomatorTarget>[];
	dayModifiers: DayModifierConfig[];
	defaults: {
		SCRAPING_TARGET: ScraperTarget;
		AUTOMATION_TARGET: AutomatorTarget;
		DAY_MODIFIERS: DayModifierKey[];
	};
}

export type FormValues = ScrapeRequestBody & {
	DAY_MODIFIERS: DayModifierKey[];
};

// Translations for UI labels (kept on client side for localization)
export const dayModifierLabels: Record<DayModifierKey, string> = {
	vacation: 'חופשה',
	sickDays: 'מחלה',
	splitDays: 'ימים מפוצלים',
};
