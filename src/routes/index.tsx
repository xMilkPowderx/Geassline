import { createFileRoute } from "@tanstack/react-router";
import { DownloadPage } from "@/components/download-page";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DownloadPage />;
}
