import { Day, Hour, ValidDay, ValidHour, ValidMinute, ValidMonth } from '../clients/types/HourDay';

export function getDayFromDayType(day: Day): ValidDay {
	return day.dayValue.split('/')[0] as ValidDay;
}

export function getPaddedDayFromDayType(day: Day): string {
	return getDayFromDayType(day).padStart(2, '0');
}

export function getMonthFromDayType(day: Day): ValidMonth {
	return day.dayValue.split('/')[1] as ValidMonth;
}

export function getPaddedMonthFromDayType(day: Day): string {
	return getMonthFromDayType(day).padStart(2, '0');
}

export function getHourFromHours(hourValue: Hour): ValidHour {
	return hourValue.split(':')[0] as ValidHour;
}

export function getMinutesFromHours(hourValue: Hour): ValidMinute {
	return hourValue.split(':')[1] as ValidMinute;
}

export function getSafeHourAndMinute(hourValue: Hour): [string, string] {
	const [hour = '', minute = ''] = [getHourFromHours(hourValue), getMinutesFromHours(hourValue)];
	return [hour, minute];
}
