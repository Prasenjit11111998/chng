import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectDialogs, closeDialog } from "../store/dialogsSlice";
import { Check, Ban, Info, AlertTriangle } from "lucide-react";

export const Dialogs: React.FC = () => {
  const dispatch = useDispatch();
  const dialogList = useSelector(selectDialogs);

  if (dialogList.length === 0) {
    return null;
  }

  // Render the first dialog in the stack
  const dialog = dialogList[0];
  const { id, title, message, buttons, type } = dialog;

  const colors: Record<string, string> = {
    success: "purple",
    error: "red",
    info: "blue",
    warning: "pink",
  };

  const Icons: Record<string, React.ComponentType<any>> = {
    success: Check,
    error: Ban,
    info: Info,
    warning: AlertTriangle,
  };

  const color = colors[type] || "blue";
  const Icon = Icons[type] || Info;

  // Map to the theme-specific colors configured in Tailwind
  const bgAccentClass = `bg-accent-${color}`;
  const borderAccentClass = `border border-accent-${color}-alt`;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm z-50 animate-fade-in">
      <div
        className={`flex flex-col items-center justify-between w-full max-w-sm p-5 gap-6 bg-panel ${borderAccentClass} rounded-2xl shadow-xl animate-scale-in`}
      >
        {/* Header */}
        <div className="flex justify-between w-full items-center">
          <div className="flex items-center gap-3">
            <div className={`rounded-full ${bgAccentClass} p-2 inline-flex items-center justify-center w-8 h-8`}>
              <Icon size={16} className="text-on-accent font-bold" />
            </div>
            <p className="text-lg font-semibold text-foreground">{title}</p>
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1 w-full">
          <p className="text-sm font-normal text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row items-center gap-4 w-full">
          {buttons.map((btn, i) => {
            const isPrimary = i === 1; // Svelte code sets secondary as first, primary as second
            return (
              <button
                key={i}
                className={`flex-1 hover:scale-105 active:scale-100 transition-all duration-200 flex items-center justify-center gap-2 p-2.5 rounded-xl text-sm font-medium ${
                  isPrimary
                    ? `${bgAccentClass} text-on-accent`
                    : "bg-button text-foreground border border-border"
                }`}
                onClick={() => {
                  btn.action();
                  dispatch(closeDialog(id) as any);
                }}
              >
                {btn.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
