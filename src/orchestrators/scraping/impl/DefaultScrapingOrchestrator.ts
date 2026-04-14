import { HilanScraper, HilanScraperConfig } from '../../../clients/scrapers/impl/HilanScraper';
import { getDaysFromSynerion } from '../../../clients/scrapers/synerion';
import { Day } from '../../../clients/types/HourDay';
import scrapeError from '../../../errors/ScrapingError';
import { unsupportedTargetError } from '../../../errors/UnsupportedError';
import { ScrapingOrchestrator } from '../ScrapingOrchestrator';

export class DefaultScrapingOrchestrator extends ScrapingOrchestrator {
	// TODO this will be problematic once new targets are added
	// it enforces webtime's config on other targets
	// possible solutions include generating a config per all target combinations
	constructor(private readonly config: HilanScraperConfig) {
		super('scraper');
	}

	async orchestrateDayScraping(): Promise<Day[]> {
		const target = this.target;

		let days: Day[];

		switch (target) {
			case 'synerion':
				days = await this.scrapeFromSynerion();
				break;

			case 'hilan':
				days = await this.scrapeFromHilan();
				break;

			default:
				console.error(`scraping target ${target} not recognized`);
				unsupportedTargetError();
		}

		return days;
	}

	private async scrapeFromHilan(): Promise<Day[]> {
		const scraper = new HilanScraper(this.config);
		const days = await scraper.getDays();
		if (!days?.length) {
			scrapeError('NO_DATA_FOUND', 'No days with logged hours found in hilan', { scraper: 'hilan' }, 'hilan');
		}
		return days;
	}

	private async scrapeFromSynerion(): Promise<Day[]> {
		const days = await getDaysFromSynerion();
		if (!days?.length) {
			scrapeError('NO_DATA_FOUND', 'No days with logged hours found in synerion', { scraper: 'synerion' }, 'synerion');
		}
		return days;
	}
}
