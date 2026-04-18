/**
 * Ambient declaration for zod-csv's parseCSVContent.
 *
 * The zod-csv package (v0.2.1) uses extensionless re-exports in its
 * index.d.ts (`export * from './csv'`), which fails to resolve under
 * TypeScript's NodeNext module resolution. This declaration provides
 * the type signatures we actually use.
 */
declare module 'zod-csv' {
	import type { z } from 'zod';

	interface Options {
		comma?: ',' | ';' | '|' | '\t';
		quote?: string;
		skipEmptyLines?: boolean;
	}

	type ResultCSV<T extends z.ZodType> =
		| {
				success: true;
				header: string[];
				allRows: Record<string, string | undefined>[];
				validRows: z.infer<T>[];
			}
		| {
				success: false;
				header: string[];
				allRows: Record<string, string | undefined>[];
				validRows: z.infer<T>[];
				errors: {
					header?: {
						errorCode: string;
						header: string;
					};
					rows?: Record<string, z.ZodError<T>>;
				};
			};

	function parseCSVContent<T extends z.ZodType>(csvContent: string, schema: T, options?: Options): ResultCSV<T>;
}
