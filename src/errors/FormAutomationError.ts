import { DefaultErrorOptions } from '../clients/types/CommonTypes';
import { ErrorWithCode } from './ErrorCodes';

export class FormAutomationError extends ErrorWithCode {
	constructor({ message, errorCode }: DefaultErrorOptions) {
		super({ message, errorCode });
		this.name = 'FormAutomation';
	}
}
export default function formAutomationError({ message, errorCode }: DefaultErrorOptions): never {
	throw new FormAutomationError({ message: message ?? 'failed to automate form filling', errorCode });
}
