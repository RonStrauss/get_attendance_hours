import { ElementHandle, Page } from 'puppeteer';
import formAutomationError from '../errors/FormAutomationError';

export interface FillInputOptions extends DefaultFillInputOptions {
	inputSelector: string;
	inputValue: string;
	errorMsg?: string;
}

export interface DefaultFillInputOptions {
	handler: Page | ElementHandle;
	earlyReturnOnNonEmpty?: boolean;
}

export async function fillInputByName(options: FillInputOptions) {
	const inputSelector = `input[name=${options.inputSelector}]`;
	return fillInput({ ...options, inputSelector });
}
export async function fillInputById(options: FillInputOptions) {
	const inputSelector = `#${options.inputSelector}`;
	return fillInput({ ...options, inputSelector });
}
export async function fillInputByPartialId(options: FillInputOptions) {
	const inputSelector = `input[id*="${options.inputSelector}"]`;
	return fillInput({ ...options, inputSelector });
}

async function fillInput({
	handler,
	inputSelector,
	inputValue,
	errorMsg,
	earlyReturnOnNonEmpty,
}: FillInputOptions) {
	if (!inputSelector) {
		formAutomationError(`No selector provided`);
	}
	const element = await handler.$(inputSelector);
	if (element === null) {
		formAutomationError(errorMsg ?? `couldn't find input: ${inputSelector}`);
	}

	const input = await element.toElement('input');

	if (earlyReturnOnNonEmpty) {
		const value = await input.evaluate(({ value }) => value);
		if (value) {
			return false;
		}
	}

	await input.type(inputValue);

	return true;
}
