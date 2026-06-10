import type { ChngFile, WorkerStatus } from "../types";

export class FormatInfo {
	public name: string;

	constructor(
		name: string,
		public fromSupported = true,
		public toSupported = true,
		public isNative = true,
	) {
		this.name = name;
		if (!this.name.startsWith(".")) {
			this.name = `.${this.name}`;
		}

		if (!this.fromSupported && !this.toSupported) {
			throw new Error("Format must support at least one direction");
		}
	}
}

export class Converter {
	public name = "Unknown";
	public supportedFormats: FormatInfo[] = [];
	private _status: WorkerStatus = "not-ready";
	public readonly reportsProgress: boolean = false;

	public onStatusChange?: (name: string, status: WorkerStatus) => void;

	public get status() {
		return this._status;
	}

	public set status(val: WorkerStatus) {
		this._status = val;
		if (this.onStatusChange) {
			this.onStatusChange(this.name, val);
		}
	}

	private timeoutId?: any;

	constructor(public readonly timeout: number = 10) {
		this.startTimeout();
	}

	private startTimeout() {
		this.timeoutId = setTimeout(() => {
			if (this.status !== "ready") this.status = "not-ready";
		}, this.timeout * 1000);
	}

	protected clearTimeout() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
			this.timeoutId = undefined;
		}
	}

	public async convert(
		input: ChngFile,
		to: string,
		...args: any[]
	): Promise<ChngFile> {
		throw new Error("Not implemented");
	}

	public async cancel(input: ChngFile): Promise<void> {
		throw new Error("Not implemented");
	}

	public async valid(): Promise<boolean> {
		return true;
	}

	public formatStrings(predicate?: (f: FormatInfo) => boolean) {
		if (predicate) {
			return this.supportedFormats.filter(predicate).map((f) => f.name);
		}
		return this.supportedFormats.map((f) => f.name);
	}
}
