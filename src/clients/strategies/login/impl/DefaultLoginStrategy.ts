import { Page } from 'puppeteer';
import { LoginStrategy } from '../LoginStrategy';
import illegalArgumentError from '../../../../errors/IllegalArgumentsError';
import formAutomationError from '../../../../errors/FormAutomationError';
import { fillInputById, fillInputByName, FillInputOptions } from '../../../../util/fillInput';
import { LoginInputStrategy, SelectorLookupStrategy } from '../../../types/LoginInputStrategy';

export class DefaultLoginStrategy implements LoginStrategy {
	constructor(
		private readonly page: Page,
		private readonly expectedInputs: LoginInputStrategy[],
		private readonly loginUrl: string,
	) {
		this.page = page;
		this.expectedInputs = expectedInputs;
		this.loginUrl = loginUrl;
	}

	async handleLoginInputs(): Promise<void> {
		if (!this.page || !this.expectedInputs || !this.loginUrl) {
			illegalArgumentError(
				'missing page, expectedInputs, or loginUrl: ' +
					JSON.stringify([!this.page, this.expectedInputs, this.loginUrl]),
			);
		}

		await this.page.goto(this.loginUrl, { waitUntil: 'networkidle2' });

		for (const input of this.expectedInputs) {
			await this.fillInput(input);
		}

		const submitButton = await this.page.$('button[type=submit]');
		if (!submitButton) {
			formAutomationError("couldn't find submit button");
		}

		await submitButton.click();
		await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
	}

	private async fillInput(input: LoginInputStrategy): Promise<void> {
		if (input.inputValue instanceof Date) {
			input.inputValue = input.inputValue.toISOString();
		}
		const opts: FillInputOptions = {
			inputSelector: input.inputSelector.rawSelector,
			inputValue: String(input.inputValue),
			errorMsg: input.errorMsg || `couldn't fill ${input.inputSelector.rawSelector} input`,
			handler: this.page,
		};

		switch (input.inputSelector.lookupStrategy) {
			case SelectorLookupStrategy.BY_ID:
				await fillInputById(opts);
				break;
			case SelectorLookupStrategy.BY_INPUT_NAME:
				await fillInputByName(opts);
				break;

			default:
				break;
		}
	}
}
