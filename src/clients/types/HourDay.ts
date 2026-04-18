import { DayType } from './CommonTypes';

export type Hour = `${number}:${number}`;
export type DayValue = `${ValidDay}/${ValidMonth}`;

export interface Day {
	dayValue: DayValue;
	hours: DayHours[];
}

export interface DayHours {
	in: Hour;
	out: Hour;
	dayType: DayType;
}

export interface DayHoursWithDayType extends DayHours {
	dayType: DayType;
}

export type ValidDay =
	| `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
	| `${1 | 2}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
	| `${3}${0 | 1}`;
export type ValidMonth = `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}` | `${1}${0 | 1 | 2}`;
export type ValidHour =
	| `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
	| `${1}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
	| `${2}${0 | 1 | 2 | 3}`;
export type ValidMinute =
	| `${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`
	| `${1 | 2 | 3 | 4 | 5}${0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9}`;
