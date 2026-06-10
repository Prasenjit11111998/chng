export * from "./ChngFile";
export * from "./conversion-worker";
export type Categories = {
	[key: string]: {
		formats: string[];
		canConvertTo?: string[];
	};
};
export type WorkerStatus = "not-ready" | "downloading" | "ready" | "error";
