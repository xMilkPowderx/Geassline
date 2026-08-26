import { desktopBridge, type SshDiskConfig } from "@/lib/geassline-desktop";
import { useVault } from "@/lib/store";
import type { Host } from "@/lib/types";
import { toast } from "@/lib/notice";

function configPath() {
  return useVault.getState().settings.sshConfigPath || "";
}

function applyDisk(disk: SshDiskConfig | undefined) {
  if (!disk?.ok) return 0;
  if (disk.path) {
    const cur = useVault.getState().settings.sshConfigPath;
    if (cur && cur !== disk.path) {
      /* keep explicit path */
    } else if (!cur) {
      useVault.getState().patchSettings({ sshConfigPath: disk.path });
    }
  }
  return useVault.getState().importConfig(disk.text || "", disk.keys || []);
}

export async function reloadSshConfig() {
  const desktop = desktopBridge();
  if (!desktop?.readSshConfig) return 0;
  const disk = await desktop.readSshConfig(configPath());
  return applyDisk(disk);
}

export async function syncHostToConfig(host: Host, previousAlias?: string) {
  const desktop = desktopBridge();
  if (!desktop?.upsertSshHost) return false;
  const alias = (host.name || host.hostname || "").trim();
  if (!alias) {
    toast.error("Host needs a name");
    return false;
  }
  const vault = useVault.getState();
  const identity = vault.identities.find((i) => i.id === host.identityId);
  const forwards = vault.tunnels
    .filter((t) => t.hostId === host.id && (t.source === "config" || t.persist))
    .map((t) => ({
      kind: t.kind,
      listenHost: t.listenHost || "127.0.0.1",
      listen: t.listenPort,
      destHost: t.destHost || "127.0.0.1",
      destPort: t.destPort,
    }));
  try {
    if (previousAlias && previousAlias !== alias && desktop.removeSshHost) {
      await desktop.removeSshHost({ path: configPath(), alias: previousAlias });
    }
    const disk = await desktop.upsertSshHost({
      path: configPath(),
      host: {
        alias,
        hostname: host.hostname || host.address || alias,
        user: host.username,
        port: host.port || 22,
        identityFile: identity?.comment || "",
        proxyJump: host.proxyJump || "",
        forwardAgent: host.agentForward,
        compression: host.compression,
        keepalive: host.keepalive || 30,
        forwards,
      },
    });
    applyDisk(disk);
    return true;
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Could not write SSH config");
    return false;
  }
}

export async function removeHostFromConfig(alias: string) {
  const desktop = desktopBridge();
  if (!desktop?.removeSshHost || !alias) return;
  const disk = await desktop.removeSshHost({ path: configPath(), alias });
  applyDisk(disk);
}
