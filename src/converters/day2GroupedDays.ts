import { DayType, GroupedDays } from '../clients/types/CommonTypes';
import { Day } from '../clients/types/HourDay';

/**
 * Returns a map of DayType -> Day[]
 * Groups days based on their hours' dayType. Days with mixed dayTypes are duplicated
 * across multiple groups, one for each unique dayType in that day's hours.
 * @param days an array of days
 * @returns days grouped by hour type
 */
export function day2GroupedDays(days: Day[]): GroupedDays {
	const record: GroupedDays = {
		[DayType.REGULAR]: [],
		[DayType.SICK_DAY]: [],
		[DayType.VACATION]: [],
	};

	for (const day of days) {
		// Get unique dayTypes in this day's hours
		const dayTypesInDay = new Set(day.hours.map((h) => h.dayType));

		for (const dayType of dayTypesInDay) {
			// Create a new day object with only the hours of this type
			const dayWithFilteredHours: Day = {
				dayValue: day.dayValue,
				hours: day.hours.filter((h) => h.dayType === dayType),
			};
			record[dayType].push(dayWithFilteredHours);
		}
	}

	return record;
}
