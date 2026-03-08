import { day2GroupedDays } from './converters/day2GroupedDays';
import { DefaultScrapingOrchestrator } from './orchestrators/scraping/impl/DefaultScrapingOrchestrator';
import { DefaultAutomatingOrchestrator } from './orchestrators/automating/impl/DefaultAutomatingOrchestrator';
import env, { Environment } from './env/env.schema';

export async function startScraping(options?: Partial<Environment>) {
	if (options) {
		overrideEnvironment(options);
	}
	const config = getTimesheetClientsConfig();

	const scraper = new DefaultScrapingOrchestrator(config);
	const days = await scraper.orchestrateDayScraping();

	const grouped = day2GroupedDays(days);

	const automator = new DefaultAutomatingOrchestrator(config);
	await automator.orchestrateDayAutomation(grouped);

	return grouped.regular.length + grouped.sickDay.length + grouped.vacation.length;
}

function getTimesheetClientsConfig() {
	return {
		dayModifiersSupport: {
			sickDays: false,
			splitDays: false,
			vacation: true,
		},
	} as const;
}

function overrideEnvironment({
	AUTOMATION_TARGET,
	AUTOMATOR_PASSWORD,
	AUTOMATOR_USERNAME,
	SCRAPER_PASSWORD,
	SCRAPER_USERNAME,
	SCRAPING_TARGET,
	THROW_ON_MALFORMED_DAYS,
}: Partial<Environment>) {
	if (AUTOMATION_TARGET) {
		env.AUTOMATION_TARGET = AUTOMATION_TARGET;
	}
	if (AUTOMATOR_PASSWORD) {
		env.AUTOMATOR_PASSWORD = AUTOMATOR_PASSWORD;
	}
	if (AUTOMATOR_USERNAME) {
		env.AUTOMATOR_USERNAME = AUTOMATOR_USERNAME;
	}
	if (SCRAPER_PASSWORD) {
		env.SCRAPER_PASSWORD = SCRAPER_PASSWORD;
	}
	if (SCRAPER_USERNAME) {
		env.SCRAPER_USERNAME = SCRAPER_USERNAME;
	}
	if (SCRAPING_TARGET) {
		env.SCRAPING_TARGET = SCRAPING_TARGET;
	}
	if (typeof THROW_ON_MALFORMED_DAYS === 'boolean') {
		env.THROW_ON_MALFORMED_DAYS = THROW_ON_MALFORMED_DAYS;
	}
}
