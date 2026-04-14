import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
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
import { ThemeModeMenu } from './components/ThemeModeMenu';
import { AutomatorStep } from './components/steps/AutomatorStep';
import { ModifiersStep } from './components/steps/ModifiersStep';
import { ScraperStep } from './components/steps/ScraperStep';
import { AppConfigResponse, FormValues, ScrapeRequestBody, ScrapeResponse, ThemeMode, isErrorResponse, errorCodeMessages } from './types';

// Validation schema for API response (security measure)
const appConfigSchema = z.object({
	scrapingTargets: z.array(
		z.object({
			value: z.enum(['hilan', 'synerion']),
			label: z.string(),
			disabled: z.boolean().optional(),
		}),
	),
	automationTargets: z.array(
		z.object({
			value: z.enum(['webtime']),
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
	const [appConfig, setAppConfig] = useState<AppConfigResponse | null>(null);
	const [loadingConfig, setLoadingConfig] = useState(true);
	const [configLoadFailed, setConfigLoadFailed] = useState(false);
	const [apiMessage, messageContext] = message.useMessage();

	const isDark = themeMode === 'system' ? systemDark : themeMode === 'dark';
	const currentAlgorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

	const selectedModifiers = Form.useWatch('DAY_MODIFIERS', form) ?? [];
	const supportedModifiers = useMemo(
		() =>
			new Set(
				(appConfig?.dayModifiers ?? []).filter((modifier) => modifier.supported).map((modifier) => modifier.key),
			),
		[appConfig],
	);

	const modifiersValue = useMemo(
		() => selectedModifiers.filter((modifier) => supportedModifiers.has(modifier)),
		[selectedModifiers, supportedModifiers],
	);

	useEffect(() => {
		if (!appConfig) {
			return;
		}

		form.setFieldValue('DAY_MODIFIERS', modifiersValue);
	}, [appConfig, form, modifiersValue]);

	const fetchAppConfig = useCallback(async () => {
		setLoadingConfig(true);
		setConfigLoadFailed(false);

		try {
			const response = await fetch('/api/config');
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();
			// Validate response data before using it (security measure)
			const validated = appConfigSchema.safeParse(data);
			if (!validated.success) {
				console.error('Invalid config response:', validated.error);
				throw new Error('Invalid config response from server');
			}

			setAppConfig(validated.data);
			form.setFieldsValue(validated.data.defaults);
		} catch (error) {
			console.error(error);
			setConfigLoadFailed(true);
			apiMessage.error('Failed to load configuration. Please try again.');
		} finally {
			setLoadingConfig(false);
		}
	}, [apiMessage, form]);

	useEffect(() => {
		void fetchAppConfig();
	}, [fetchAppConfig]);

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

			const data = await response.json();

			if (!response.ok) {
				if (isErrorResponse(data)) {
					const errorMessage =
						errorCodeMessages[data.error.errorCode] ??
						errorCodeMessages.UNKNOWN_ERROR ??
						'Unexpected error. Please try again later.';
					const detailedMessage = `${errorMessage}${data.error.scraper ? ` (${data.error.scraper})` : ''}${data.error.details ? `: ${JSON.stringify(data.error.details)}` : ''}`;
					apiMessage.error(detailedMessage);
				} else {
					apiMessage.error('Unexpected error. Please try again later.');
				}
				return;
			}

			const typedData = data as ScrapeResponse;
			setInsertedDays(typedData.insertedDays ?? 0);
			apiMessage.success('Request completed successfully');
		} catch (error) {
			console.error(error);
			apiMessage.error('Server communication error. Check your connection.');
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
						initialValues={appConfig?.defaults}
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
								) : loadingConfig ? (
									<Spin />
								) : configLoadFailed || !appConfig ? (
									<Result
										status="error"
										title="טעינת הגדרות המערכת נכשלה"
										extra={[
											<Button key="retry" type="primary" onClick={() => void fetchAppConfig()}>
												נסה שוב
											</Button>,
										]}
									/>
								) : (
									<Spin spinning={submitting && currentStep === 2}>
										<div className={currentStep === 0 ? 'step-pane' : 'step-pane hidden'}>
											<ScraperStep options={appConfig.scrapingTargets} />
										</div>
										<div className={currentStep === 1 ? 'step-pane' : 'step-pane hidden'}>
											<AutomatorStep options={appConfig.automationTargets} />
										</div>
										<div className={currentStep === 2 ? 'step-pane' : 'step-pane hidden'}>
											<ModifiersStep modifiers={appConfig.dayModifiers} />
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
