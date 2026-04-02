import { ElementHandle, Page } from 'puppeteer';
import { Automator } from '../Automator';
import { Day, DayHours } from '../../types/HourDay';
import { UnsupportedConfigError } from '../../../errors/UnsupportedError';
import { getCredentials } from '../../../util/getCredentials';
import missingCredentialsError from '../../../errors/MissingCredentialsError';
import { LoginInputStrategy, SelectorLookupStrategy } from '../../types/LoginInputStrategy';
import { DefaultLoginStrategy } from '../../strategies/login/impl/DefaultLoginStrategy';
import formAutomationError from '../../../errors/FormAutomationError';
import { DayType, GroupedDays } from '../../types/CommonTypes';
import {
	getPaddedDayFromDayType,
	getPaddedMonthFromDayType,
	getSafeHourAndMinute,
} from '../../../util/deconstructors';
import { WebtimeDayHours } from '../types/Webtime';
import { DefaultFillInputOptions, fillInputByPartialId } from '../../../util/fillInput';
import { TimeSheetConfig } from '../../types/Config';

export interface WebtimeAutomatorConfig extends TimeSheetConfig {
	dayModifiersSupport: {
		vacation: boolean;
		sickDays: false;
		splitDays: false;
	};
}
export class WebtimeAutomator extends Automator {
	protected INITIAL_URL = 'https://webtime.taldor.co.il/?msg=login&ret=wt_periodic.adp';

	private readonly dayType2DescriptorRawValue: Record<DayType, string> = {
		[DayType.REGULAR]: '2791',
		[DayType.SICK_DAY]: '513',
		[DayType.VACATION]: '512',
	};

	constructor(protected readonly config: WebtimeAutomatorConfig) {
		super();
	}

	async fillDays(days: GroupedDays): Promise<void> {
		this.validateConfigValues();
		const page = await super.page;
		await this.handleLogin(page);
		await this.navigateToTimesheet();
		await this.fillTimesheet(page, days);
	}

	protected async handleLogin(page: Page): Promise<void> {
		const credentials = getCredentials('webtime');

		if (!credentials.username || !credentials.password) {
			missingCredentialsError('missing webtime username or password');
		}

		const expectedInputs: LoginInputStrategy[] = [
			{
				inputSelector: {
					rawSelector: 'email',
					lookupStrategy: SelectorLookupStrategy.BY_INPUT_NAME,
				},
				inputValue: credentials.username,
			},
			{
				inputSelector: {
					rawSelector: 'password',
					lookupStrategy: SelectorLookupStrategy.BY_INPUT_NAME,
				},
				inputValue: credentials.password,
			},
		];

		const loginStrategy = new DefaultLoginStrategy(page, expectedInputs, this.INITIAL_URL);
		await loginStrategy.handleLoginInputs();
		await page.waitForNetworkIdle();
	}

	protected async navigateToTimesheet(): Promise<void> {
		// empty implementation
		// page automatically navigates to timesheet
		return;
	}

	protected validateConfigValues(): void {
		if (this.config.dayModifiersSupport.sickDays) {
			throw new UnsupportedConfigError('sick days are not currently supported');
		}
		if (this.config.dayModifiersSupport.splitDays) {
			throw new UnsupportedConfigError('split days scraping are not currently supported');
		}
		if (this.config.dayModifiersSupport.vacation) {
			console.log('webtime will fill vacation days');
		}
	}

	protected async fillTimesheet(page: Page, days: GroupedDays): Promise<void> {
		await this.handleDayInputting(page, days[DayType.REGULAR], DayType.REGULAR);

		if (this.config.dayModifiersSupport.vacation && days[DayType.VACATION].length) {
			await this.handleDayInputting(page, days[DayType.VACATION], DayType.VACATION);
		}

		// TODO: add sick notes upload to be able to support sick days properly
		if (this.config.dayModifiersSupport.vacation && days[DayType.SICK_DAY].length) {
			await this.handleDayInputting(page, days[DayType.SICK_DAY], DayType.SICK_DAY);
		}

		const button = await page.$('#save_btn');

		if (!button) {
			formAutomationError("couldn't find save button");
		}

		await Promise.all([
			button.click(),
			await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 1000 * 60 * 5 }),
		]);

		return;
	}

	private async handleDayInputting(page: Page, days: Day[], type: DayType): Promise<number> {
		const state = { totalDays: 0 };
		const incrementTotalDaysHandled = () => state.totalDays++;
		await this.selectAssignmentValue(page, type);

		for (const day of days) {
			const tr = (await page.$$(this.getRowsSelector(day))) as ElementHandle<HTMLTableRowElement>[];
			if (!tr.length) {
				formAutomationError(`couldn't find row/s for day ${day.dayValue}`);
			}

			await this.fillMissionInput(tr);

			await this.handleFillHourInputsStartAndEnd(tr, day.hours, incrementTotalDaysHandled);
		}

		return state.totalDays;
	}

	private async handleFillHourInputsStartAndEnd(
		rows: ElementHandle<Element>[],
		hours: DayHours,
		onSuccessfulInput: () => void,
	) {
		for (const row of rows) {
			const { start, end } = this.getPossiblyPartialHoursSelector();
			const [hourIn, minuteIn] = getSafeHourAndMinute(hours.in);
			const [hourOut, minuteOut] = getSafeHourAndMinute(hours.out);

			const defaultOptions: DefaultFillInputOptions = {
				handler: row,
				earlyReturnOnNonEmpty: true,
			};

			const inputValuesResults = [
				{ inputSelector: start.hour, inputValue: hourIn },
				{ inputSelector: start.minute, inputValue: minuteIn },
				{ inputSelector: end.hour, inputValue: hourOut },
				{ inputSelector: end.minute, inputValue: minuteOut },
				// TODO: switch to LoginInputStrategy
			].map(async (values) => await fillInputByPartialId({ ...defaultOptions, ...values }));

			if (inputValuesResults.some(Boolean)) {
				onSuccessfulInput();
			}
		}
	}

	private async selectAssignmentValue(page: Page, dayType: DayType) {
		const selectElement = await page.$('#assignments');

		if (!selectElement) {
			formAutomationError("couldn't find select element");
		}

		await selectElement.select(this.dayType2DescriptorRawValue[dayType]);
	}

	private async fillMissionInput(rows: ElementHandle<HTMLTableRowElement>[], forceFill = false) {
		for (const row of rows) {
			const missionInput = await row.$('input[fieldname="assignment_name"]');

			if (!missionInput) {
				formAutomationError("couldn't find mission input");
			}

			const currentValue = await missionInput.evaluate((input) => (input as HTMLInputElement).value);

			if (currentValue && !forceFill) {
				return;
			}

			await missionInput.click();
		}
	}

	private getRowsSelector(day: Day): string {
		const [year, month, dayOfMonth] = [
			new Date().getFullYear(),
			getPaddedMonthFromDayType(day),
			getPaddedDayFromDayType(day),
		];
		return `#tableDyn1 tr:has(input[value="${year}-${month}-${dayOfMonth}"])`;
	}

	private getPossiblyPartialHoursSelector(day?: string): WebtimeDayHours {
		return {
			start: {
				hour: `time_start_HH_${day ?? ''}`,
				minute: `time_start_MM_${day ?? ''}`,
			},
			end: {
				hour: `time_end_HH_${day ?? ''}`,
				minute: `time_end_MM_${day ?? ''}`,
			},
		};
	}

	// TODO fully implement
	// private getExpectedInputs(target: 'login' | 'timesheetAutomation'): LoginInputStrategy[] {
	// 	switch (target) {
	// 		case 'login':
	// 			return [
	// 				{
	// 					inputSelector: {
	// 						rawSelector: 'email',
	// 						lookupStrategy: SelectorLookupStrategy.BY_INPUT_NAME,
	// 					},
	// 					inputValue: credentials.username,
	// 				},
	// 				{
	// 					inputSelector: {
	// 						rawSelector: 'password',
	// 						lookupStrategy: SelectorLookupStrategy.BY_INPUT_NAME,
	// 					},
	// 					inputValue: credentials.password,
	// 				},
	// 			];
	// 		case 'timesheetAutomation':
	// 			return [];

	// 		default:
	// 			return [];
	// 	}
	// }
}
