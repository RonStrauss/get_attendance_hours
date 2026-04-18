/**
 * Shared configuration and utilities for scraper and API modes
 * This module exports only shared concerns that both modes need
 */

export function getTimesheetClientsConfig() {
	return {
		dayModifiersSupport: {
			sickDays: false,
			splitDays: true,
			vacation: true,
		},
	} as const;
}
