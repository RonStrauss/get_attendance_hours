/**
 * Standalone scraper entry point
 * This module runs the scraper independently without requiring the REST API
 * It can be used as:
 * - A standalone CLI script
 * - A child process spawned from another application
 * - An importable function for testing/debugging
 */

import { fileURLToPath } from 'node:url';
import { day2GroupedDays } from './converters/day2GroupedDays';
import { DefaultScrapingOrchestrator } from './orchestrators/scraping/impl/DefaultScrapingOrchestrator';
import { DefaultAutomatingOrchestrator } from './orchestrators/automating/impl/DefaultAutomatingOrchestrator';
import env, { Environment } from './env/env.schema';

export interface ScraperResult {
	insertedDays: number;
	groupedDays: ReturnType<typeof day2GroupedDays>;
}

/**
 * Run scraper and automator independently
 * Loads configuration from environment variables
 */
export async function runScraper(options?: Partial<Environment>): Promise<ScraperResult> {
	if (options) {
		overrideEnvironment(options);
	}

	const config = {
		dayModifiersSupport: {
			sickDays: false,
			splitDays: true,
			vacation: true,
		},
	} as const;

	const scraper = new DefaultScrapingOrchestrator(config);
	const days = await scraper.orchestrateDayScraping();

	const grouped = day2GroupedDays(days);

	const automator = new DefaultAutomatingOrchestrator(config);
	await automator.orchestrateDayAutomation(grouped);

	const insertedDays = grouped.regular.length + grouped.sickDay.length + grouped.vacation.length;

	return {
		insertedDays,
		groupedDays: grouped,
	};
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

// When run as CLI/standalone script
const isMainModule = typeof process.argv[1] === 'string' && fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
	runScraper()
		.then((result) => {
			console.log(JSON.stringify(result, null, 2));
			process.exit(0);
		})
		.catch((error) => {
			console.error('Scraper failed:', error);
			process.exit(1);
		});
}
