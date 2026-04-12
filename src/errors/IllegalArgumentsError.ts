import { DefaultErrorOptions } from '../clients/types/CommonTypes';
import { ErrorWithCode } from './ErrorCodes';

export class IllegalArgumentError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'IllegalArgument';
	}
}
export default function illegalArgumentError({ message, errorCode }: DefaultErrorOptions): never {
	throw new IllegalArgumentError({ message: message ?? 'illegal argument/s provided', errorCode });
}
