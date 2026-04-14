export type ScrapingErrorCode = 
	| 'LOGIN_FAILED'
	| 'NAVIGATION_FAILED'
	| 'ELEMENT_NOT_FOUND'
	| 'NO_DATA_FOUND'
	| 'EXTRACTION_FAILED'
	| 'VALIDATION_FAILED'
	| 'NETWORK_ERROR'
	| 'UNKNOWN_ERROR';

export interface ScrapingErrorDetails {
	errorCode: ScrapingErrorCode;
	message: string;
	details?: Record<string, unknown>;
	scraper?: string;
	timestamp?: number;
}

export class ScrapingError extends Error {
	public readonly errorCode: ScrapingErrorCode;
	public readonly details?: Record<string, unknown>;
	public readonly scraper?: string;
	public readonly timestamp: number;

	constructor(errorCode: ScrapingErrorCode, message: string, details?: Record<string, unknown>, scraper?: string) {
		super(message);
		this.name = 'ScrapingError';
		this.errorCode = errorCode;
		this.details = details;
		this.scraper = scraper;
		this.timestamp = Date.now();
	}

	toJSON(): ScrapingErrorDetails {
		return {
			errorCode: this.errorCode,
			message: this.message,
			details: this.details,
			scraper: this.scraper,
			timestamp: this.timestamp,
		};
	}
}

export default function scrapeError(
	errorCode: ScrapingErrorCode = 'UNKNOWN_ERROR',
	message?: string,
	details?: Record<string, unknown>,
	scraper?: string,
): never {
	throw new ScrapingError(
		errorCode,
		message ?? 'failed to scrape data',
		details,
		scraper,
	);
}
