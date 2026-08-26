#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import * as ResEdit from "resedit";

const exePath = process.argv[2];
const icoPath = process.argv[3];
if (!exePath || !icoPath) {
  console.error("usage: embed-windows-icon.mjs <exe> <ico>");
  process.exit(1);
}

const exe = ResEdit.NtExecutable.from(readFileSync(exePath));
const res = ResEdit.NtExecutableResource.from(exe);
const iconFile = ResEdit.Data.IconFile.from(readFileSync(icoPath));
const icons = iconFile.icons.map((item) => item.data);

const groups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries);
if (groups.length) {
  for (const group of groups) {
    ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
      res.entries,
      group.id,
      group.lang,
      icons,
    );
  }
} else {
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(res.entries, 1, 1033, icons);
}

const versions = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
for (const vi of versions) {
  const lang = { lang: 1033, codepage: 1200 };
  vi.setStringValues(lang, {
    FileDescription: "Geassline",
    ProductName: "Geassline",
    InternalName: "Geassline",
    OriginalFilename: "Geassline.exe",
    CompanyName: "Geassline",
  });
  vi.removeStringValue({ lang: 1033, codepage: 1200 }, "Electron");
  vi.outputToResourceEntries(res.entries);
}

res.outputResource(exe, true);
writeFileSync(exePath, Buffer.from(exe.generate()));
console.log("embedded icon", icoPath, "into", exePath);
