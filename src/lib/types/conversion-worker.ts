export interface ConvertMessage {
	type: "convert";
	input: {
		file: File;
		name: string;
		from: string;
		to: string;
	};
	to: string;
	compression: number | null;
	keepMetadata?: boolean;
}

export interface CompressMessage {
	type: "compress";
	input: {
		file: File;
		name: string;
		from: string;
	};
	targetSize: number;
	startQuality: number;
}

export interface FinishedMessage {
	type: "finished";
	output: ArrayBufferLike | Uint8Array;
	zip?: boolean;
	format?: string;
}

export interface LoadMessage {
	type: "load";
	wasm: ArrayBuffer;
}

export interface LoadedMessage {
	type: "loaded";
}

export interface ReadyMessage {
	type: "ready";
}

export interface ErrorMessage {
	type: "error";
	error: string;
}

export type WorkerMessage = (
	| ConvertMessage
	| CompressMessage
	| FinishedMessage
	| LoadMessage
	| LoadedMessage
	| ReadyMessage
	| ErrorMessage
) & {
	id: string;
};
