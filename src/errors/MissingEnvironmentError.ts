import { DefaultErrorOptions } from "../clients/types/CommonTypes";
import { ErrorWithCode } from "./ErrorCodes";

export class MissingEnvironmentError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'MissingEnvironmentError';
	}
}

export default function missingEnvironmentError({ message, errorCode }: DefaultErrorOptions): never {
	throw new MissingEnvironmentError({
		message: message ?? 'missing one or more environment variables',
		errorCode,
	});
}
