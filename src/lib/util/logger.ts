/* eslint-disable @typescript-eslint/no-explicit-any */
const randomColorFromStr = (str: string) => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const h = Math.abs(hash) % 360;
	return `hsl(${h}, 75%, 71%)`;
};

const whiteOrBlack = (hsl: string) => {
	const parts = hsl
		.replace("hsl(", "")
		.replace(")", "")
		.split(",");
	const l = parseInt(parts[2]);
	return l > 70 ? "black" : "white";
};

const isBrowser = typeof window !== "undefined";

export const log = (prefix: string | string[], ...args: any[]) => {
	const prefixes = Array.isArray(prefix) ? prefix : [prefix];
	if (!isBrowser)
		return console.log(prefixes.map((p) => `[${p}]`).join(" "), ...args);
	const prefixesWithMeta = prefixes.map((p) => ({
		prefix: p,
		bgColor: randomColorFromStr(p),
		textColor: whiteOrBlack(randomColorFromStr(p)),
	}));

	console.log(
		`%c${prefixesWithMeta.map(({ prefix }) => prefix).join(" %c")}`,
		...prefixesWithMeta.map(
			({ bgColor, textColor }, i) =>
				`color: ${textColor}; background-color: ${bgColor}; margin-left: ${i === 0 ? 0 : -6}px; padding: 0px 4px 0 4px; border-radius: 0px 9999px 9999px 0px;`,
		),
		...args,
	);
};

export const error = (prefix: string | string[], ...args: any[]) => {
	const prefixes = Array.isArray(prefix) ? prefix : [prefix];
	if (!isBrowser)
		return console.error(prefixes.map((p) => `[${p}]`).join(" "), ...args);
	const prefixesWithMeta = prefixes.map((p) => ({
		prefix: p,
		bgColor: randomColorFromStr(p),
		textColor: whiteOrBlack(randomColorFromStr(p)),
	}));

	console.error(
		`%c${prefixesWithMeta.map(({ prefix }) => prefix).join(" %c")}`,
		...prefixesWithMeta.map(
			({ bgColor, textColor }, i) =>
				`color: ${textColor}; background-color: ${bgColor}; margin-left: ${i === 0 ? 0 : -6}px; padding: 0px 4px 0 4px; border-radius: 0px 9999px 9999px 0px;`,
		),
		...args,
	);
};
