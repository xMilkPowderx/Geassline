import { toast as sonner } from "sonner";
import { useAppLog } from "@/lib/app-log";

type Extra = { description?: string };

function record(level: "info" | "success" | "error", message: unknown, extra?: Extra) {
  const text = typeof message === "string" ? message : String(message ?? "");
  const full = extra?.description ? `${text} — ${extra.description}` : text;
  if (full) useAppLog.getState().push(level, full);
}

export const toast = {
  success: (message: string, extra?: Extra) => {
    record("success", message, extra);
    return sonner.success(message, extra);
  },
  error: (message: string, extra?: Extra) => {
    record("error", message, extra);
    return sonner.error(message, extra);
  },
  message: (message: string, extra?: Extra) => {
    record("info", message, extra);
    return sonner.message(message, extra);
  },
};
