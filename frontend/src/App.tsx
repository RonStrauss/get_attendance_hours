import { useEffect, useMemo, useState } from 'react';
import {
	Button,
	Card,
	ConfigProvider,
	Form,
	Result,
	Space,
	Spin,
	Steps,
	Typography,
	message,
	theme,
} from 'antd';
import heIL from 'antd/locale/he_IL';
import { modifierSupport } from './constants';
import { ThemeModeMenu } from './components/ThemeModeMenu';
import { AutomatorStep } from './components/steps/AutomatorStep';
import { ModifiersStep } from './components/steps/ModifiersStep';
import { ScraperStep } from './components/steps/ScraperStep';
import { FormValues, ScrapeRequestBody, ScrapeResponse, ThemeMode } from './types';

const { Title } = Typography;
const themeStorageKey = 'attendance_theme_mode';

const getInitialThemeMode = (): ThemeMode => {
	const stored = localStorage.getItem(themeStorageKey);
	if (stored === 'system' || stored === 'light' || stored === 'dark') {
		return stored;
	}
	return 'system';
};

const getSystemDarkPreference = () => window.matchMedia('(prefers-color-scheme: dark)').matches;

export default function App() {
	const [form] = Form.useForm<FormValues>();
	const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);
	const [systemDark, setSystemDark] = useState<boolean>(getSystemDarkPreference);
	const [currentStep, setCurrentStep] = useState(0);
	const [submitting, setSubmitting] = useState(false);
	const [insertedDays, setInsertedDays] = useState<number | null>(null);
	const [apiMessage, messageContext] = message.useMessage();

	const isDark = themeMode === 'system' ? systemDark : themeMode === 'dark';
	const currentAlgorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

	const selectedModifiers = Form.useWatch('DAY_MODIFIERS', form) ?? [];

	const modifiersValue = useMemo(
		() => selectedModifiers.filter((modifier) => modifierSupport[modifier]),
		[selectedModifiers],
	);

	useEffect(() => {
		form.setFieldValue('DAY_MODIFIERS', modifiersValue);
	}, [form, modifiersValue]);

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const onSystemThemeChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);

		mediaQuery.addEventListener('change', onSystemThemeChange);
		return () => mediaQuery.removeEventListener('change', onSystemThemeChange);
	}, []);

	useEffect(() => {
		localStorage.setItem(themeStorageKey, themeMode);
	}, [themeMode]);

	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.ctrlKey && event.key === 'Enter') {
				event.preventDefault();
				if (currentStep < 2) {
					void handleNextStep();
					return;
				}
				if (!insertedDays) {
					void submitForm();
				}
			}
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [form, currentStep, insertedDays]);

	const handleNextStep = async () => {
		const fieldsByStep: (keyof FormValues)[][] = [
			['SCRAPING_TARGET', 'SCRAPER_USERNAME', 'SCRAPER_PASSWORD'],
			['AUTOMATION_TARGET', 'AUTOMATOR_USERNAME', 'AUTOMATOR_PASSWORD'],
			['DAY_MODIFIERS'],
		];

		await form.validateFields(fieldsByStep[currentStep]);
		setCurrentStep((prev) => Math.min(prev + 1, 2));
	};

	const resetWizard = () => {
		setInsertedDays(null);
		setCurrentStep(0);
	};

	const submitForm = async () => {
		if (currentStep !== 2) {
			return;
		}

		let values: FormValues;
		try {
			values = await form.validateFields();
		} catch {
			return;
		}

		setSubmitting(true);
		setInsertedDays(null);

		const body: ScrapeRequestBody = {
			SCRAPING_TARGET: values.SCRAPING_TARGET,
			AUTOMATION_TARGET: values.AUTOMATION_TARGET,
			SCRAPER_USERNAME: values.SCRAPER_USERNAME,
			SCRAPER_PASSWORD: values.SCRAPER_PASSWORD,
			AUTOMATOR_USERNAME: values.AUTOMATOR_USERNAME,
			AUTOMATOR_PASSWORD: values.AUTOMATOR_PASSWORD,
		};

		try {
			const response = await fetch('/api/scrape', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = (await response.json()) as ScrapeResponse;
			setInsertedDays(data.insertedDays ?? 0);
			apiMessage.success('הבקשה הושלמה בהצלחה');
		} catch (error) {
			console.error(error);
			apiMessage.error('הבקשה נכשלה. בדוק פרטים ונסה שוב.');
		} finally {
			setSubmitting(false);
		}
	};

	const stepItems = [
		{
			title: 'חילוץ',
		},
		{
			title: 'יעד',
		},
		{
			title: insertedDays !== null ? '✔ סיום' : 'שליחה',
		},
	];

	return (
		<ConfigProvider theme={{ algorithm: currentAlgorithm }} direction="rtl" locale={heIL}>
			{messageContext}
			<div className={`app-shell ${isDark ? 'dark' : 'light'}`}>
				<div className="app-container">
					<Space className="top-bar" align="center" size="middle">
						<Title level={2} className="title">
							ממלא שעות שופרסל
						</Title>
						<ThemeModeMenu value={themeMode} onChange={setThemeMode} />
					</Space>

					<Form<FormValues>
						form={form}
						layout="vertical"
						initialValues={{
							SCRAPING_TARGET: 'hilan',
							AUTOMATION_TARGET: 'webtime',
							DAY_MODIFIERS: ['vacation'],
						}}
						requiredMark={false}
						preserve
					>
						<Space direction="vertical" size="large" className="full-width wizard-area">
							<Steps current={currentStep} items={stepItems} />
							<Card className="step-card" bordered={false}>
								{insertedDays !== null ? (
									<Result
										status="success"
										title={`הוזנו ${insertedDays} ימים למערכת`}
										subTitle="הפעולה הסתיימה בהצלחה."
										extra={[
											<Button key="rerun" type="primary" onClick={resetWizard}>
												הפעלה נוספת
											</Button>,
										]}
									/>
								) : (
									<Spin spinning={submitting && currentStep === 2}>
										<div className={currentStep === 0 ? 'step-pane' : 'step-pane hidden'}>
											<ScraperStep />
										</div>
										<div className={currentStep === 1 ? 'step-pane' : 'step-pane hidden'}>
											<AutomatorStep />
										</div>
										<div className={currentStep === 2 ? 'step-pane' : 'step-pane hidden'}>
											<ModifiersStep />
										</div>
										<Space className="step-actions">
											<Button
												htmlType="button"
												onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 0))}
												disabled={currentStep === 0}
											>
												חזרה
											</Button>
											{currentStep < 2 ? (
												<Button type="primary" htmlType="button" onClick={() => void handleNextStep()}>
													הבא
												</Button>
											) : (
												<Button
													type="primary"
													htmlType="button"
													onClick={() => void submitForm()}
													loading={submitting}
												>
													שליחה
												</Button>
											)}
										</Space>
									</Spin>
								)}
							</Card>
						</Space>
					</Form>
				</div>
			</div>
		</ConfigProvider>
	);
}
