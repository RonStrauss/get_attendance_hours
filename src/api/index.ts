import { Router } from 'express';
import { startScraping } from '../main';
import { envSchema } from '../env/env.schema';

const router = Router();

router.post('/scrape', async (req, res) => {
	const payload = envSchema.safeParse(req.body);
	if (!payload.success) {
		return res.status(400).json({ msg: 'illegal body provided' });
	}

	try {
		const insertedDays = await startScraping(payload.data);
		return res.send({ insertedDays });
	} catch (error) {
		console.error(error);
		return res.status(500).send({ msg: 'scraping failed' });
	}
});

export default router;
