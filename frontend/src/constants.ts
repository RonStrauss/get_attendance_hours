import { BaseOptionType } from 'antd/es/select';
import { AutomatorTarget, DayModifierKey } from './types';

export const scraperOptions: BaseOptionType[] = [
	{ value: 'hilan', label: 'חילנט' },
	{ value: 'synerion', label: 'סיינריון', disabled: true },
];

export const automatorOptions: { value: AutomatorTarget; label: string }[] = [
	{ value: 'webtime', label: 'Ovdimnet (טלדור/one)' },
];

export const modifierSupport: Record<DayModifierKey, boolean> = {
	vacation: true,
	sickDays: false,
	splitDays: false,
};

export const modifierLabels: Record<DayModifierKey, string> = {
	vacation: 'חופשה',
	sickDays: 'מחלה',
	splitDays: 'ימים מפוצלים',
};
