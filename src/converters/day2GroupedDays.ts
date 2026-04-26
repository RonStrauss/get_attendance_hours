import { DayType, GroupedDays } from '../clients/types/CommonTypes';
import { Day } from '../clients/types/HourDay';

/**
 * Returns a map of DayType -> Day[]
 * @param days an array of days
 * @returns days grouped by type
 */
export function day2GroupedDays(days: Day[]): GroupedDays {
	const record: GroupedDays = {
		[DayType.REGULAR]: [],
		[DayType.SICK_DAY]: [],
		[DayType.VACATION]: [],
	};

	for (const day of days) {
		if (!day.dayType) continue;
		record[day.dayType].push(day);
	}

	return record;
}
