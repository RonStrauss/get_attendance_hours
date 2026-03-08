import { Form, Input, Select } from 'antd';
import { scraperOptions } from '../../constants';
import { FormValues } from '../../types';

export function ScraperStep() {
	return (
		<>
			<Form.Item<FormValues>
				label="בחירת יעד"
				name="SCRAPING_TARGET"
				rules={[{ required: true, message: 'בחר יעד סקרייפר' }]}
			>
				<Select options={scraperOptions} />
			</Form.Item>
			<Form.Item<FormValues>
				label="שם משתמש"
				name="SCRAPER_USERNAME"
				rules={[{ required: true, message: 'הכנס שם משתמש' }]}
			>
				<Input autoComplete="username" />
			</Form.Item>
			<Form.Item<FormValues>
				label="סיסמה"
				name="SCRAPER_PASSWORD"
				rules={[{ required: true, message: 'הכנס סיסמה' }]}
			>
				<Input.Password autoComplete="current-password" />
			</Form.Item>
		</>
	);
}
