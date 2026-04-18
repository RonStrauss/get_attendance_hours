/**
 * Main entry point supporting both modes:
 * - API mode (default): Starts Express server for REST API
 * - Scraper mode: Runs scraper standalone
 * 
 * Modes are controlled by:
 * - NODE_MODE=scraper environment variable
 * - --scraper-only command-line flag
 */

import env from './env/env.schema';
import type { Router } from 'express';

const args = process.argv.slice(2);
const isScraperOnly = process.env.NODE_MODE === 'scraper' || args.includes('--scraper-only');

async function start() {
	if (isScraperOnly) {
		// Scraper-only mode: Independent scraper execution
		const { runScraper } = await import('./scraper.js');
		try {
			const result = await runScraper();
			console.log(JSON.stringify(result, null, 2));
			process.exit(0);
		} catch (error) {
			console.error('Scraper failed:', error);
			process.exit(1);
		}
	} else {
		// API mode (default): Express server with REST API
		const express = await import('express');
		const apiRoutes = (await import('./api/index.js')).default as unknown as Router;
		const app = express.default();
		app.use(express.json())
			.use('/api', apiRoutes)
			.get('/health', (_, res) => res.send('ok'))
			.listen(env.PORT, () => console.log(`listening on ${env.PORT}`));
	}
}

start().catch((error) => {
	console.error('Failed to start:', error);
	process.exit(1);
});
