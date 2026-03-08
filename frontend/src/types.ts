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

export type FormValues = ScrapeRequestBody & {
	DAY_MODIFIERS: DayModifierKey[];
};
