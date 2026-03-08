import { Page } from 'puppeteer';
import { Automator } from '../Automator';
import { Day } from '../../types/HourDay';
import { UnsupportedConfigError } from '../../../errors/UnsupportedError';
import { getCredentials } from '../../../util/getCredentials';
import missingCredentialsError from '../../../errors/MissingCredentialsError';
import { LoginInputStrategy, SelectorLookupStrategy } from '../../types/LoginInputStrategy';
import { DefaultLoginStrategy } from '../../strategies/login/impl/DefaultLoginStrategy';
import formAutomationError from '../../../errors/FormAutomationError';
import { DayType, GroupedDays } from '../../types/CommonTypes';
import { getDayFromDayType, getSafeHourAndMinute } from '../../../util/deconstructors';
import { WebtimeDayHours } from '../types/Webtime';
import { fillInputByName } from '../../../util/fillInput';
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
			formAutomationError('couldnt find save button');
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
			const tr = await page.$(this.getTrannySelector(day));
			if (!tr) {
				formAutomationError(`couldnt find tr for day ${day.dayValue}`);
			}

			await this.fillMissionInput(page, day);

			await this.handleFillHourInputsStartAndEnd(page, day, incrementTotalDaysHandled);
		}

		return state.totalDays;
	}

	private async handleFillHourInputsStartAndEnd(page: Page, day: Day, onInput: () => void) {
		const { start, end } = this.getHoursSelectors(day);

		const [hourIn, minuteIn] = getSafeHourAndMinute(day.hours.in);
		const [hourOut, minuteOut] = getSafeHourAndMinute(day.hours.out);

		const defaultOptions = { page, earlyReturnOnNonEmpty: true };

		// TODO: switch to LoginInputStrategy
		await fillInputByName({
			...defaultOptions,
			inputSelector: start.hour,
			inputValue: hourIn,
		});
		await fillInputByName({
			...defaultOptions,
			inputSelector: start.minute,
			inputValue: minuteIn,
		});

		await fillInputByName({
			...defaultOptions,
			inputSelector: end.hour,
			inputValue: hourOut,
		});
		await fillInputByName({
			...defaultOptions,
			inputSelector: end.minute,
			inputValue: minuteOut,
		});

		onInput();
	}

	private async selectAssignmentValue(page: Page, dayType: DayType) {
		const selectElement = await page.$('#assignments');

		if (!selectElement) {
			formAutomationError('couldnt find select element');
		}

		await selectElement.select(this.dayType2DescriptorRawValue[dayType]);
	}

	private async fillMissionInput(page: Page, day: Day, forceFill = false) {
		const missionInput = await page.$(this.getTrannySelector(day) + ' input[fieldname="assignment_name"] ');

		if (!missionInput) {
			formAutomationError('couldnt find mission input');
		}

		const currentValue = await missionInput.evaluate((input) => (input as HTMLInputElement).value);

		if (currentValue && !forceFill) {
			return;
		}

		await missionInput.click();
	}

	private getTrannySelector(day: Day): string {
		// TODO split days incompatibility, adjust as needed
		// takes row #, instead of looking at day value..
		return `#tableDyn1 tr[row_no="${getDayFromDayType(day)}"]`;
	}

	private getHoursSelectors(day: Day): WebtimeDayHours {
		const dayNumber = getDayFromDayType(day);
		return {
			start: {
				hour: `time_start_HH_${dayNumber}`,
				minute: `time_start_MM_${dayNumber}`,
			},
			end: {
				hour: `time_end_HH_${dayNumber}`,
				minute: `time_end_MM_${dayNumber}`,
			},
		};
	}
}
