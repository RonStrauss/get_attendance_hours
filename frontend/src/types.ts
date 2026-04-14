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

export type ErrorCode = 
	| 'LOGIN_FAILED'
	| 'NAVIGATION_FAILED'
	| 'ELEMENT_NOT_FOUND'
	| 'NO_DATA_FOUND'
	| 'EXTRACTION_FAILED'
	| 'VALIDATION_FAILED'
	| 'NETWORK_ERROR'
	| 'UNKNOWN_ERROR';

export interface ErrorDetails {
	errorCode: ErrorCode;
	message: string;
	scraper?: string;
	details?: Record<string, unknown>;
	timestamp?: number;
}

export interface ErrorResponse {
	error: ErrorDetails;
}

const supportedErrorCodes: Record<ErrorCode, true> = {
	LOGIN_FAILED: true,
	NAVIGATION_FAILED: true,
	ELEMENT_NOT_FOUND: true,
	NO_DATA_FOUND: true,
	EXTRACTION_FAILED: true,
	VALIDATION_FAILED: true,
	NETWORK_ERROR: true,
	UNKNOWN_ERROR: true,
};

export function isErrorResponse(response: unknown): response is ErrorResponse {
	if (response === null || typeof response !== 'object' || !('error' in response)) {
		return false;
	}

	const { error } = response;

	if (error === null || typeof error !== 'object') {
		return false;
	}

	const errorRecord = error as Record<string, unknown>;

	return (
		typeof errorRecord.errorCode === 'string' &&
		errorRecord.errorCode in supportedErrorCodes &&
		typeof errorRecord.message === 'string'
	);
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

// Error message translations (for localization)
export const errorCodeMessages: Record<ErrorCode, string> = {
	LOGIN_FAILED: 'Login failed - verify username and password',
	NAVIGATION_FAILED: 'Navigation error - try again later',
	ELEMENT_NOT_FOUND: 'No data found to extract - verify that hours are logged',
	NO_DATA_FOUND: 'No hours found for the selected period',
	EXTRACTION_FAILED: 'Data extraction error - try again',
	VALIDATION_FAILED: 'Data processing error - invalid data format',
	NETWORK_ERROR: 'Network connection error - check your connection',
	UNKNOWN_ERROR: 'Unknown error - try again later',
};
