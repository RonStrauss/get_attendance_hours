import { Page } from 'puppeteer';
import missingCredentialsError from '../../../errors/MissingCredentialsError';
import { Day, DayHoursWithDayType, DayValue, Hour } from '../../types/HourDay';
import { getCredentials } from '../../../util/getCredentials';
import { Scraper } from '../Scraper';
import { LoginInputStrategy, SelectorLookupStrategy } from '../../types/LoginInputStrategy';
import { DefaultLoginStrategy } from '../../strategies/login/impl/DefaultLoginStrategy';
import formAutomationError from '../../../errors/FormAutomationError';
import scrapeError from '../../../errors/ScrapingError';
import { UnsupportedConfigError, unsupportedConfigError } from '../../../errors/UnsupportedError';
import { stringIsHourBase } from '../../../util/typeChecks';
import { DayType } from '../../types/CommonTypes';
import { RawDayRowHilan } from '../types/Hilan';
import { TimeSheetConfig } from '../../types/Config';
import env from '../../../env/env.schema';

export interface HilanScraperConfig extends TimeSheetConfig {
	dayModifiersSupport: {
		readonly vacation: boolean;
		readonly sickDays: boolean;
		readonly splitDays: boolean;
	};
}
export class HilanScraper extends Scraper {
	protected readonly INITIAL_URL: string = 'https://shufersal.net.hilan.co.il/login';

	constructor(protected readonly config: HilanScraperConfig) {
		super();
	}

	async getDays(): Promise<Day[]> {
		this.validateConfigValues();
		const page = await super.page;
		await this.handleLogin(page);
		await this.navigateToTimesheet(page);
		await this.prepareHoursLogPageForScraping(page);
		const days = await this.scrapeDays(page);
		console.log(days);

		return days;
	}

	protected async handleLogin(page: Page): Promise<void> {
		const credentials = getCredentials('hilan');

		if (!credentials.username || !credentials.password) {
			missingCredentialsError('missing hilan username or password');
		}

		const expectedInputs: LoginInputStrategy[] = [
			{
				inputSelector: {
					rawSelector: 'user_nm',
					lookupStrategy: SelectorLookupStrategy.BY_ID,
				},
				inputValue: credentials.username,
				errorMsg: 'couldnt find hilan username input',
			},
			{
				inputSelector: {
					rawSelector: 'password_nm',
					lookupStrategy: SelectorLookupStrategy.BY_ID,
				},
				inputValue: credentials.password,
				errorMsg: 'couldnt find hilan password input',
			},
		];

		const loginStrategy = new DefaultLoginStrategy(page, expectedInputs, this.INITIAL_URL);
		await loginStrategy.handleLoginInputs();
		await page.waitForNetworkIdle();
	}
	protected async navigateToTimesheet(page: Page): Promise<void> {
		const hoursLogAnchorHref = await page.$eval('[href*=calendarpage]', (el) =>
			el ? (el as HTMLAnchorElement).href : formAutomationError('couldnt find hoursLogAnchor'),
		);

		if (!hoursLogAnchorHref) {
			formAutomationError('hoursLogAnchor is falsy');
		}

		page.goto(hoursLogAnchorHref);

		await page.waitForNavigation({ waitUntil: 'networkidle2' });
	}

	private async prepareHoursLogPageForScraping(page: Page): Promise<void> {
		const collectValidDays = await page.$$(`#calendar_container tr:nth-child(n+3) td[title]`);

		if (!collectValidDays.length) {
			return scrapeError('ELEMENT_NOT_FOUND', 'Failed to find calendar elements with logged hours', { selector: '#calendar_container' }, 'hilan');
		}

		for (const element of collectValidDays) {
			await element.click();
		}

		// unmark current day, as the empty value can break next functions.
		// TODO current day might interest us if split days. Implement eventually.
		await page.click('.currentDay');

		await page.click('input[id*=RefreshSelectedDays]');

		await page.waitForNetworkIdle();
	}

	private async scrapeDays(page: Page): Promise<Day[]> {
		const rawRows = await this.extractRawRows(page);
		const dayHashMap = this.buildDayHashMap(rawRows);

		let normalizedDays = Object.entries(dayHashMap).map(([dayValue, hours]): Day => {
			const resolvedHours = this.resolveHoursAndModifiersForDay(hours);
			return {
				dayValue: dayValue as DayValue,
				hours: resolvedHours.hours,
				dayType: resolvedHours.dayType,
			};
		});

		if (!this.config.dayModifiersSupport.sickDays) {
			normalizedDays = normalizedDays.filter((day) => day.dayType !== DayType.SICK_DAY);
		}

		if (!this.config.dayModifiersSupport.vacation) {
			normalizedDays = normalizedDays.filter((day) => day.dayType !== DayType.VACATION);
		}

		return normalizedDays;
	}

	protected validateConfigValues() {
		if (this.config.dayModifiersSupport.sickDays) {
			console.log('hilan will scrape sick days');
		}
		if (this.config.dayModifiersSupport.splitDays) {
			console.log('hilan will scrape split days');
		}
		if (this.config.dayModifiersSupport.vacation) {
			console.log('hilan will scrape vacation days');
		}
	}

	private async extractRawRows(page: Page): Promise<RawDayRowHilan[]> {
		const rowSelector = 'tr[class]:has(tr td[id*=cellOf_ManualEntry]):has(.regularItemCell)';

		return page.$$eval(rowSelector, (rows) =>
			rows.map((row): RawDayRowHilan => {
				const day = row.children[0]?.textContent
					?.split(' ')[0]
					.split('/')
					.map((n) => parseInt(n))
					.join('/') as DayValue | undefined;

				const hours = Array.from(
					row.querySelectorAll<HTMLInputElement>(
						'td[id*=cellOf_ManualEntry] input, td[id*=cellOf_ManualExit] input',
					),
				).map((i) => i.value as Hour);

				return { day, hours, selectElementTitle: row.querySelector('select')?.title };
			}),
		);
	}

	private buildDayHashMap(rows: RawDayRowHilan[]): Record<DayValue, DayHoursWithDayType[]> {
		const shouldThrowOnMalformed = Boolean(env.THROW_ON_MALFORMED_DAYS);
		return rows.reduce(
			(dayHashMap, row) => {
				if (row.day) {
					if (row.hours.length % 2 !== 0) {
					scrapeError('VALIDATION_FAILED', `Invalid hours for day ${row.day}: non-even combination of hours`, { day: row.day, hoursCount: row.hours.length }, 'hilan');

					dayHashMap[row.day] ??= [];

					for (let i = 0; i < row.hours.length; i += 2) {
						const [inHour, outHour] = row.hours.slice(i, i + 2);
						const dayType = this.resolveSelectTitle(row.selectElementTitle);

						if ((!stringIsHourBase(inHour) || !stringIsHourBase(outHour)) && dayType === DayType.REGULAR) {
							if (shouldThrowOnMalformed) {
								scrapeError('VALIDATION_FAILED', `Malformed hour values for day ${row.day}: hours do not match expected format`, { day: row.day, inHour, outHour }, 'hilan');
							} else {
								return dayHashMap;
							}
						}

						dayHashMap[row.day].push({
							in: inHour,
							out: outHour,
							dayType: dayType,
						});
					}
				}

				return dayHashMap;
			},
			{} as Record<DayValue, DayHoursWithDayType[]>,
		);
	}

	private resolveHoursAndModifiersForDay(hours: DayHoursWithDayType[]): Omit<Day, 'dayValue'> {
		if (this.config.dayModifiersSupport.splitDays) {
			return {
				dayType: hours[0].dayType,
				hours,
			};
		}

		return {
			hours: [{ in: hours[0].in, out: hours[0].out }],
			dayType: hours[0].dayType,
		};
	}

	private resolveSelectTitle(value?: string): DayType {
		if (this.normalizeHebrew(value) === this.normalizeHebrew('מחלה')) {
			return DayType.SICK_DAY;
		}

		if (this.normalizeHebrew(value) === this.normalizeHebrew('חופשה')) {
			return DayType.VACATION;
		}

		return DayType.REGULAR;
	}

	private normalizeHebrew(str?: string): string {
		return (str ?? '')
			.normalize('NFKC') // normalize Unicode variants
			.replace(/\p{P}+/gu, '') // remove all punctuation (Unicode-safe)
			.replace(/\s+/g, ' ') // normalize whitespace (optional)
			.trim();
	}
}
