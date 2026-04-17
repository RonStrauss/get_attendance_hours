import { Router } from 'express';
import { z } from 'zod';
import env, { envSchema } from '../env/env.schema';
import { getTimesheetClientsConfig, startScraping } from '../main';
import { ScrapingError } from '../errors/ScrapingError';

const router = Router();

// Configuration data without labels (labels stay in frontend for localization)
const scraperTargets = [
	{ value: 'hilan' as const, label: 'חילנט' },
	{ value: 'synerion' as const, label: 'סיינריון', disabled: true },
] as const;

const automationTargets = [{ value: 'webtime' as const, label: 'Ovdimnet (טלדור/one)' }] as const;

// Validation schema for API response (security measure)
const appConfigSchema = z.object({
	scrapingTargets: z.array(
		z.object({
			value: z.string(),
			label: z.string(),
			disabled: z.boolean().optional(),
		}),
	),
	automationTargets: z.array(
		z.object({
			value: z.string(),
			label: z.string(),
			disabled: z.boolean().optional(),
		}),
	),
	dayModifiers: z.array(
		z.object({
			key: z.enum(['vacation', 'sickDays', 'splitDays']),
			supported: z.boolean(),
		}),
	),
	defaults: z.object({
		SCRAPING_TARGET: z.enum(['hilan', 'synerion']),
		AUTOMATION_TARGET: z.enum(['webtime']),
		DAY_MODIFIERS: z.array(z.enum(['vacation', 'sickDays', 'splitDays'])),
	}),
});

export type AppConfig = z.infer<typeof appConfigSchema>;

export interface ErrorResponse {
	error: {
		errorCode: string;
		message: string;
		scraper?: string;
		details?: Record<string, unknown>;
		timestamp?: number;
	};
}

function buildErrorResponse(error: unknown): ErrorResponse {
	if (error instanceof ScrapingError) {
		return {
			error: error.toJSON(),
		};
	}

	if (error instanceof Error) {
		return {
			error: {
				errorCode: 'UNKNOWN_ERROR',
				message: error.message,
				timestamp: Date.now(),
			},
		};
	}

	return {
		error: {
			errorCode: 'UNKNOWN_ERROR',
			message: 'An unexpected error occurred',
			timestamp: Date.now(),
		},
	};
}

router.get('/config', async (_, res) => {
	const config = getTimesheetClientsConfig();
	// Explicitly define default selected modifiers rather than deriving from "supported"
	// "supported" indicates capability, not default selection preference
	const defaultSelectedDayModifiers: (keyof typeof config.dayModifiersSupport)[] = ['vacation'];

	const appConfig = {
		scrapingTargets: scraperTargets,
		automationTargets,
		dayModifiers: (Object.keys(config.dayModifiersSupport) as (keyof typeof config.dayModifiersSupport)[]).map(
			(modifierKey) => ({
				key: modifierKey,
				supported: config.dayModifiersSupport[modifierKey],
			}),
		),
		defaults: {
			SCRAPING_TARGET: env.SCRAPING_TARGET,
			AUTOMATION_TARGET: env.AUTOMATION_TARGET,
			DAY_MODIFIERS: defaultSelectedDayModifiers,
		},
	};

	// Validate response before sending (security measure)
	const validated = appConfigSchema.safeParse(appConfig);
	if (!validated.success) {
		console.error('Invalid app config:', validated.error);
		return res.status(500).json({ msg: 'internal server error' });
	}

	return res.send(validated.data);
});

router.post('/scrape', async (req, res) => {
	const payload = envSchema.safeParse(req.body);
	if (!payload.success) {
		return res.status(400).json(buildErrorResponse(new Error('illegal body provided')));
	}

	try {
		const insertedDays = await startScraping(payload.data);
		return res.send({ insertedDays });
	} catch (error) {
		console.error(error);
		const errorResponse = buildErrorResponse(error);
		return res.status(500).json(errorResponse);
	}
});

export default router;
