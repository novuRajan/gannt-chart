export interface BaseInput {
	name: string;
	type: string;
	options?: unknown[];
	validations?: string[];
	[key: string]: string | number | boolean | unknown;
}
