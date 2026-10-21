// One-off: classify each docs/screenshots PNG as old (dark/teal) or new
// (ivory/green) by sampling pixel colors. Used to verify which captures
// actually reflect the redesign.
import { chromium } from "@playwright/test";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const SHOTS = fileURLToPath(new URL("../../../docs/screenshots/", import.meta.url));
const files = ["login", "dashboard", "business-list", "business-detail", "analytics"];
const b = await chromium.launch();
const p = await b.newPage();

for (const f of files) {
  const buf = fs.readFileSync(SHOTS + f + ".png");
  const uri = "data:image/png;base64," + buf.toString("base64");
  await p.setContent(`<img id="i" src="${uri}">`);
  await p.locator("#i").waitFor();

  const r = await p.evaluate(() => {
    const img = document.getElementById("i");
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const x = c.getContext("2d");
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height).data;
    let dark = 0, teal = 0, ivory = 0, n = 0;
    for (let i = 0; i < d.length; i += 4 * 97) {
      const R = d[i], G = d[i + 1], B = d[i + 2];
      n++;
      if (R < 60 && G < 70 && B < 75) dark++;
      if (G > 120 && R < 80 && B > 110 && B < 200) teal++;
      if (R > 240 && G > 235 && B > 215 && B < 245) ivory++;
    }
    return { w: c.width, h: c.height, n, dark, teal, ivory };
  });

  const pct = (v) => ((100 * v) / r.n).toFixed(1) + "%";
  console.log(
    f.padEnd(18),
    `${r.w}x${r.h}`.padEnd(10),
    "dark=" + pct(r.dark).padEnd(7),
    "teal=" + pct(r.teal).padEnd(7),
    "ivory=" + pct(r.ivory)
  );
}

await b.close();
