import { createFileRoute } from "@tanstack/react-router";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ZIP_PATH = join(process.cwd(), "desktop/dist/Geassline-windows-x64.zip");

export const Route = createFileRoute("/download/windows-zip")({
  server: {
    handlers: {
      GET: () => {
        if (!existsSync(ZIP_PATH)) {
          return new Response("Geassline Desktop package is not built yet.", { status: 404 });
        }
        return new Response(readFileSync(ZIP_PATH), {
          headers: {
            "content-type": "application/zip",
            "content-disposition": 'attachment; filename="Geassline-windows-x64.zip"',
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
