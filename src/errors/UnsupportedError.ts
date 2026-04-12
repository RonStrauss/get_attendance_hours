import { DefaultErrorOptions } from '../clients/types/CommonTypes';
import { ErrorWithCode } from './ErrorCodes';

export class UnsupportedTargetError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'UnsupportedTarget';
	}
}
export function unsupportedTargetError({ message, errorCode }: DefaultErrorOptions): never {
	throw new UnsupportedTargetError({
		message: message ?? 'current target is not supported',
		errorCode,
	});
}

export class UnsupportedConfigError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'UnsupportedConfig';
	}
}

export function unsupportedConfigError({ message, errorCode }: DefaultErrorOptions): never {
	throw new UnsupportedConfigError({
		message: message ?? 'config value not supported',
		errorCode,
	});
}
