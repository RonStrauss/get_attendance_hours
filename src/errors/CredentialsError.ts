import { DefaultErrorOptions } from '../clients/types/CommonTypes';
import { ErrorWithCode } from './ErrorCodes';

export class MissingCredentialsError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'MissingCredentials';
	}
}
export default function missingCredentialsError({ message, errorCode }: DefaultErrorOptions): never {
	throw new MissingCredentialsError({ message: message ?? 'missing credentials', errorCode });
}

export class WrongCredentialsError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'WrongCredentials';
	}
}
export function wrongCredentialsError({ message, errorCode }: DefaultErrorOptions): never {
	throw new WrongCredentialsError({ message: message ?? 'the provided credentials were wrong', errorCode });
}

export class ExpiredCredentialsError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'ExpiredCredentials';
	}
}
export function expiredCredentialsError({ message, errorCode }: DefaultErrorOptions): never {
	throw new ExpiredCredentialsError({
		message: message ?? 'the provided credentials have expired and are no longer valid',
		errorCode,
	});
}
