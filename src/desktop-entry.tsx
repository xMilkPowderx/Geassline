import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Workstation } from "@/components/workstation";
import { ErrorBoundary } from "@/components/error-boundary";
import "@/styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Geassline root element missing");

createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <Workstation />
    </ErrorBoundary>
  </StrictMode>,
);