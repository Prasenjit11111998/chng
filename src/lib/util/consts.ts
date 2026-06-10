const pubEnv = import.meta.env.VITE_ENV || import.meta.env.MODE;
const pubDisableAllExternalRequests = import.meta.env.VITE_DISABLE_ALL_EXTERNAL_REQUESTS || "false";

export const GITHUB_URL_Chng = "https://github.com/Chng-sh/Chng";
export const GITHUB_URL_ChngD = "https://github.com/Chng-sh/chngd";
export const GITHUB_API_URL = "https://api.github.com/repos/Chng-sh/Chng";
export const DISCORD_URL = "https://discord.gg/kqevGxYPak";
export const CONTACT_EMAIL = "hello@chng.sh";
export const CHNG_NAME =
	pubEnv === "development"
		? "Chng Local"
		: pubEnv === "nightly"
			? "Chng Nightly"
			: "Chng.sh";

export const DISABLE_ALL_EXTERNAL_REQUESTS =
	pubDisableAllExternalRequests === "true";

export const GB = 1024 * 1024 * 1024;
export const MAX_ARRAY_BUFFER_SIZE = 2 * GB; // Default fallback, will be detected dynamically
