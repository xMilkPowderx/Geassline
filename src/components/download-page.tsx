import { Download } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { WINDOWS_DESKTOP_ZIP } from "@/lib/geassline-desktop";

export function DownloadPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md">
        <Logo className="size-8" />
        <h1 className="mt-5 text-3xl font-medium tracking-tight">Geassline</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
          Offline Windows SSH client. Terminals, files, editor, tunnels, and FIDO2 through
          Windows OpenSSH. Hosts load from your SSH config.
        </p>
        <Button asChild className="mt-8 h-11 w-full">
          <a href={WINDOWS_DESKTOP_ZIP} download="Geassline-windows-x64.zip">
            <Download className="size-4" />
            Download for Windows
          </a>
        </Button>
        <ol className="mt-8 space-y-2 text-sm text-muted-foreground">
          <li>1. Unzip the download.</li>
          <li>2. Open electron.exe (the window is Geassline).</li>
          <li>3. If SmartScreen appears: More info → Run anyway.</li>
        </ol>
      </div>
    </div>
  );
}
