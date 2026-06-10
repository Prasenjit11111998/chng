import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type DialogType = "success" | "error" | "info" | "warning";

export interface DialogButton {
  text: string;
  action: () => void;
}

export interface DialogState {
  id: number;
  title: string;
  message: string;
  buttons: DialogButton[];
  type: DialogType;
}

interface DialogsSliceState {
  dialogs: DialogState[];
}

const initialState: DialogsSliceState = {
  dialogs: [],
};

// Module-level registry for non-serializable callback functions
export const dialogCallbackRegistry = new Map<string, () => void>();

const dialogsSlice = createSlice({
  name: 'dialogs',
  initialState,
  reducers: {
    addDialogToState(state, action: PayloadAction<{
      id: number;
      title: string;
      message: string;
      buttons: { text: string; actionId: string }[];
      type: DialogType;
    }>) {
      // Reconstruct non-serializable buttons using registry lookup
      const resolvedButtons = action.payload.buttons.map(b => ({
        text: b.text,
        action: () => {
          const cb = dialogCallbackRegistry.get(b.actionId);
          if (cb) {
            cb();
          }
        }
      }));

      state.dialogs.push({
        id: action.payload.id,
        title: action.payload.title,
        message: action.payload.message,
        buttons: resolvedButtons,
        type: action.payload.type,
      });
    },
    removeDialogFromState(state, action: PayloadAction<number>) {
      state.dialogs = state.dialogs.filter(d => d.id !== action.payload);
    }
  }
});

let nextDialogId = 0;

export const showDialog = (
  title: string,
  message: string,
  buttons: { text: string; action: () => void }[],
  type: DialogType
) => (dispatch: any) => {
  const id = nextDialogId++;
  const serializedButtons = buttons.map((b, i) => {
    const actionId = `dialog_${id}_btn_${i}`;
    dialogCallbackRegistry.set(actionId, b.action);
    return {
      text: b.text,
      actionId
    };
  });

  dispatch(addDialogToState({
    id,
    title,
    message,
    buttons: serializedButtons,
    type
  }));
};

export const closeDialog = (id: number) => (dispatch: any) => {
  dispatch(removeDialogFromState(id));
  
  // Clean up registered callbacks
  for (const key of Array.from(dialogCallbackRegistry.keys())) {
    if (key.startsWith(`dialog_${id}_`)) {
      dialogCallbackRegistry.delete(key);
    }
  }
};

export const { addDialogToState, removeDialogFromState } = dialogsSlice.actions;
export default dialogsSlice.reducer;
export const selectDialogs = (state: { dialogs: DialogsSliceState }) => state.dialogs.dialogs;
