import type { Categories } from "../types";
import { Converter } from "./converter";
import { MagickConverter } from "./magick";

// ==========================================
// 1. Converter Registry Setup
// ==========================================
// We only support local image processing using ImageMagick WASM.
const getConverters = (): Converter[] => {
	return [new MagickConverter()];
};

export const converters = getConverters();

// Returns the converter matching the input file format (always ImageMagick for supported formats)
export function getConverterByFormat(format: string) {
	for (const converter of converters) {
		if (converter.supportedFormats.some((f) => f.name === format)) {
			return converter;
		}
	}
	return null;
}

// ==========================================
// 2. File Format Categories
// ==========================================
// Defines image-only capabilities for the format converter.
export const categories: Categories = {
	image: { formats: [], canConvertTo: ['image'] },
};

const magick = converters.find((c) => c.name === "imagemagick");
if (magick) {
	categories.image.formats = magick.formatStrings((f) => f.toSupported);
}

// Helper function to sort converters based on whether they natively support a format (used during zip/bulk uploads)
export const byNative = (format: string) => {
	return (a: Converter, b: Converter) => {
		const aFormat = a.supportedFormats.find((f) => f.name === format);
		const bFormat = b.supportedFormats.find((f) => f.name === format);

		if (aFormat && bFormat) {
			return aFormat.isNative ? -1 : 1;
		}
		return 0;
	};
};

// ==========================================
// 3. Public Exports
// ==========================================
export { Converter };
export type { WorkerStatus } from "../types";
export { FormatInfo } from "./converter";
export { imageFormats } from "./magick-automated";
export { MagickConverter } from "./magick";
