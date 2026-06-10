import { store } from "../../store";
import { addToast, removeToast } from "../../store/toastsSlice";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastOptions {
	type?: ToastType;
	message: string | any;
	disappearing?: boolean;
	durations?: {
		enter?: number;
		stay?: number;
		exit?: number;
	};
	additional?: any;
}

export class ToastManager {
	public static add(options: ToastOptions): number {
		const id = Math.floor(Math.random() * 1000000);
		const disappearing = options.disappearing !== false;
		const stayDuration = options.durations?.stay || (disappearing ? 5000 : 86400000);

		store.dispatch(addToast({
			id,
			type: options.type || "info",
			message: typeof options.message === "string" ? options.message : String(options.message),
			disappearing,
			additional: options.additional,
		}));

		if (disappearing) {
			setTimeout(() => {
				store.dispatch(removeToast(id));
			}, stayDuration);
		}

		return id;
	}

	public static remove(id: number) {
		store.dispatch(removeToast(id));
	}
}
