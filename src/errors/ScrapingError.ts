import { DefaultErrorOptions } from '../clients/types/CommonTypes';
import { ErrorWithCode } from './ErrorCodes';

export class ScrapingError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'ScrapingError';
	}
}

export default function scrapeError({ message, errorCode }: DefaultErrorOptions): never {
	throw new ScrapingError({
		message: message ?? 'failed to scrape data',
		errorCode,
	});
}
