import { byNative, converters } from "../converters";
import type { Converter } from "../converters/converter";
import { m } from "../paraglide/messages";
import { ToastManager } from "../util/toast";
import { MAX_ARRAY_BUFFER_SIZE } from "../../store/filesSlice";
import { GB } from "../util/consts";
import PQueue from "p-queue";

export class ChngFile {
	public id: string = Math.random().toString(36).slice(2, 8);
	public readonly file: File;
	private _progress = 0;
	private _result: ChngFile | null = null;
	public to = "";
	public blobUrl?: string;
	private _processing = false;
	public cancelled = false;
	public converters: Converter[] = [];
	public isZip = false;

	// Callbacks to sync with Redux store
	public onProgress?: (id: string, progress: number) => void;
	public onProcessingChange?: (id: string, processing: boolean) => void;
	public onResult?: (id: string, result: ChngFile | null) => void;
	public onError?: (id: string, error: string) => void;

	public get from() {
		return ("." + this.file.name.split(".").pop() || "").toLowerCase();
	}

	public get name() {
		return this.file.name;
	}

	public get progress() {
		return this._progress;
	}

	public set progress(val: number) {
		this._progress = val;
		if (this.onProgress) {
			this.onProgress(this.id, val);
		}
	}

	public get result() {
		return this._result;
	}

	public set result(val: ChngFile | null) {
		this._result = val;
		if (this.onResult) {
			this.onResult(this.id, val);
		}
	}

	public get processing() {
		return this._processing;
	}

	public set processing(val: boolean) {
		this._processing = val;
		if (this.onProcessingChange) {
			this.onProcessingChange(this.id, val);
		}
	}

	public findConverters(supportedFormats: string[] = [this.from]) {
		return this.converters
			.filter((converter) =>
				converter
					.formatStrings()
					.some((f) => supportedFormats.includes(f)),
			)
			.sort(byNative(this.from));
	}

	public findConverter() {
		if (this.isZip) return this.converters[0];

		const converter = this.converters.find((converter) => {
			if (
				!converter.formatStrings().includes(this.from) ||
				!converter.formatStrings().includes(this.to)
			) {
				return false;
			}

			const theirFrom = converter.supportedFormats.find(
				(f) => f.name === this.from,
			);
			const theirTo = converter.supportedFormats.find(
				(f) => f.name === this.to,
			);
			if (!theirFrom || !theirTo) return false;
			if (!theirFrom.isNative && !theirTo.isNative) return false;
			return true;
		});
		return converter;
	}

	public isLarge(): boolean {
		return this.file.size > MAX_ARRAY_BUFFER_SIZE;
	}

	public supportsStreaming(): boolean {
		return false;
	}

	constructor(file: File, to: string, blobUrl?: string) {
		const ext = file.name.split(".").pop();
		const newFile = new File(
			[file.slice(0, file.size, file.type)],
			`${file.name.split(".").slice(0, -1).join(".")}.${ext?.toLowerCase()}`,
		);
		this.file = newFile;
		this.to = to.startsWith(".") ? to : `.${to}`;
		this.isZip = this.from === ".zip";
		this.converters = converters.filter((c) =>
			c.formatStrings().includes(this.from),
		);
		this.blobUrl = blobUrl;
	}

	public async convert(...args: any[]): Promise<ChngFile | null> {
		if (!this.converters.length) throw new Error("No converters found");
		const converter = this.findConverter();
		if (!converter) throw new Error("No converter found");
		
		this.result = null;
		this.progress = 0;
		this.processing = true;
		this.cancelled = false;
		
		let res: ChngFile | null = null;
		try {
			res = this.isZip
				? await this.convertZip(converter)
				: await converter.convert(this, this.to, ...args);
			this.result = res;
		} catch (err) {
			if (!this.cancelled) {
				const errMsg = err instanceof Error ? err.message : String(err);
				if (this.onError) {
					this.onError(this.id, errMsg);
				}
				this.toastErr(err);
			}
			this.result = null;
		}
		this.processing = false;
		return res;
	}

	private async convertZip(converter: Converter): Promise<ChngFile> {
		const { extractZip, createZip } = await import("../util/zip");

		const entries = await extractZip(this.file);
		const totalFiles = entries.length;
		const fileProgress: number[] = new Array(totalFiles).fill(0);
		const convertedFiles: File[] = [];

		const queue = new PQueue({
			concurrency: navigator.hardwareConcurrency || 4,
		});

		const updateProgress = () => {
			const totalProgress = fileProgress.reduce((sum, p) => sum + p, 0);
			this.progress = Math.round(totalProgress / totalFiles);
		};

		await queue.addAll(
			entries.map(({ filename, data }, index) => async () => {
				if (this.cancelled) {
					throw new Error("Conversion cancelled");
				}

				const file = new File([new Uint8Array(data)], filename, {
					type: "application/octet-stream",
				});
				const tempVFile = new ChngFile(file, this.to);
				tempVFile.converters = [converter];

				if (converter.reportsProgress) {
					const progressInterval = setInterval(() => {
						fileProgress[index] = tempVFile.progress;
						updateProgress();
					}, 100);

					try {
						const converted = await converter.convert(
							tempVFile,
							this.to,
						);

						let outputExt = this.to;
						if (!outputExt.startsWith(".")) outputExt = `.${outputExt}`;

						convertedFiles[index] = new File(
							[await converted.file.arrayBuffer()],
							converted.name,
						);

						fileProgress[index] = 100;
						updateProgress();
					} finally {
						clearInterval(progressInterval);
					}
				} else {
					const converted = await converter.convert(
						tempVFile,
						this.to,
					);

					let outputExt = this.to;
					if (!outputExt.startsWith(".")) outputExt = `.${outputExt}`;

					convertedFiles[index] = new File(
						[await converted.file.arrayBuffer()],
						converted.name,
					);

					fileProgress[index] = 100;
					updateProgress();
				}
			}),
		);

		const resultArray = await createZip(convertedFiles);
		const outputFilename = this.file.name.replace(/\.[^/.]+$/, ".zip");
		const resultFile = new File(
			[new Uint8Array(resultArray)],
			outputFilename,
		);
		return new ChngFile(resultFile, ".zip");
	}

	public async cancel() {
		if (!this.processing) return;
		const converter = this.findConverter();
		if (!converter) throw new Error("No converter found");
		this.cancelled = true;
		try {
			await converter.cancel(this);
			this.processing = false;
			this.result = null;
		} catch (err) {
			this.toastErr(err);
		}
	}

	public async download() {
		if (!this.result) throw new Error("No result found");

		let to = this.result.to;
		if (!to.startsWith(".")) to = `.${to}`;

		const settings = JSON.parse(localStorage.getItem("settings") ?? "{}");
		const filenameFormat = settings.filenameFormat || "CHNG_%name%";

		const format = (name: string) => {
			const date = new Date().toISOString();
			const baseName = this.file.name.replace(/\.[^/.]+$/, "");
			const originalExtension = this.file.name.split(".").pop()!;
			return name
				.replace(/%date%/g, date)
				.replace(/%name%/g, baseName)
				.replace(/%extension%/g, originalExtension);
		};

		const blob = URL.createObjectURL(
			new Blob([await this.result.file.arrayBuffer()], {
				type: "application/octet-stream",
			}),
		);
		const a = document.createElement("a");
		a.href = blob;
		a.download = `${format(filenameFormat)}${to}`;
		a.target = "_blank";
		a.style.display = "none";
		a.click();
		URL.revokeObjectURL(blob);
		a.remove();
	}

	private toastErr(err: unknown) {
		let toastMsg = "";
		if (typeof err === "string") {
			toastMsg = err;
		} else if (err instanceof Error) {
			toastMsg = err.message;
		} else {
			toastMsg = String(err);
		}

		ToastManager.add({
			type: "error",
			message: m["workers.errors.general"]({
				file: this.file.name,
				message: toastMsg,
			}),
		});
	}

	public hash(): Promise<string> {
		const stream = this.file.stream();
		const hashes = new Set<string>();
		const reader = stream.getReader();
		return new Promise<string>((resolve, reject) => {
			function processChunk() {
				reader.read().then(({ done, value }) => {
					if (done) {
						const combinedHash = Array.from(hashes).sort().join("");
						resolve(combinedHash);
						return;
					}

					crypto.subtle
						.digest("SHA-256", value)
						.then((hashBuffer) => {
							const hashArray = Array.from(
								new Uint8Array(hashBuffer),
							);
							const hashHex = hashArray
								.map((b) => b.toString(16).padStart(2, "0"))
								.join("");
							hashes.add(hashHex);
							processChunk();
						})
						.catch((err) => {
							reject(err);
						});
				});
			}
			processChunk();
		});
	}
}
