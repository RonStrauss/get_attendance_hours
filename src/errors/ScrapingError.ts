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

// Overload signatures for backward compatibility and flexibility
export default function scrapeError(message: string): never;
export default function scrapeError(
	errorCode: ScrapingErrorCode,
	message: string,
	details?: Record<string, unknown>,
	scraper?: string,
): never;
export default function scrapeError(
	errorCode?: ScrapingErrorCode | string,
	message?: string,
	details?: Record<string, unknown>,
	scraper?: string,
): never {
	// Handle backward compatibility: if first arg is a string but not a valid error code, treat it as message
	if (typeof errorCode === 'string' && !isValidErrorCode(errorCode) && message === undefined) {
		throw new ScrapingError('UNKNOWN_ERROR', errorCode, undefined, undefined);
	}

	const finalErrorCode = (typeof errorCode === 'string' && isValidErrorCode(errorCode))
		? errorCode
		: 'UNKNOWN_ERROR';
	const finalMessage = (typeof errorCode === 'string' && !isValidErrorCode(errorCode))
		? errorCode
		: (message ?? 'failed to scrape data');

	throw new ScrapingError(finalErrorCode, finalMessage, details, scraper);
}

function isValidErrorCode(code: string): code is ScrapingErrorCode {
	const validCodes: ScrapingErrorCode[] = [
		'LOGIN_FAILED',
		'NAVIGATION_FAILED',
		'ELEMENT_NOT_FOUND',
		'NO_DATA_FOUND',
		'EXTRACTION_FAILED',
		'VALIDATION_FAILED',
		'NETWORK_ERROR',
		'UNKNOWN_ERROR',
	];
	return validCodes.includes(code as ScrapingErrorCode);
}
