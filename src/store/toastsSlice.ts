import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ToastItem {
  id: number;
  type: "success" | "error" | "info" | "warning";
  message: string;
  disappearing: boolean;
  additional?: any;
}

interface ToastsState {
  toasts: ToastItem[];
}

const initialState: ToastsState = {
  toasts: [],
};

const toastsSlice = createSlice({
  name: 'toasts',
  initialState,
  reducers: {
    addToast(state, action: PayloadAction<ToastItem>) {
      state.toasts.push(action.payload);
    },
    removeToast(state, action: PayloadAction<number>) {
      state.toasts = state.toasts.filter(t => t.id !== action.payload);
    }
  }
});

export const { addToast, removeToast } = toastsSlice.actions;
export default toastsSlice.reducer;
