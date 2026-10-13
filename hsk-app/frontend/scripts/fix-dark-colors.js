const fs   = require("fs");
const path = require("path");

const replacements = [
  ['bg-[#0F0F1A]',  'bg-[#FFFBEA]'],
  ['bg-[#16162A]',  'bg-[#FFF8D6]'],
  ['"#0F0F1A"',     '"#FFFBEA"'],
  ['"#16162A"',     '"#FFFDF0"'],
  ['"#0d0d1a"',     '"#FFFBEA"'],
  ['"#0d1220"',     '"#FFF8D0"'],
  ['"#150d30"',     '"#FFF3A0"'],
  ['"#12082a"',     '"#FFF8D0"'],
  ['"#1a0a2e"',     '"#FFF3A0"'],
  ['"#0d1a2e"',     '"#FFF8D0"'],
  ['"#13131F"',     '"#FFF8D0"'],
  ['"#2E2E50"',     '"#E8D98A"'],
  ['#2E2E50',       '#E8D98A'],
  // text-white/xx trên background sáng → text tối
  // (chỉ thay trong background context, không thay toàn bộ)
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!full.includes(".next") && !full.includes("node_modules")) walk(full);
    } else if (e.name.endsWith(".tsx") || e.name.endsWith(".ts")) {
      let content = fs.readFileSync(full, "utf8");
      let changed = false;
      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.split(from).join(to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content, "utf8");
        console.log("Updated:", e.name);
      }
    }
  }
}

walk("d:/Downloads/DOANLN/hsk-app/frontend/app");
walk("d:/Downloads/DOANLN/hsk-app/frontend/components");
console.log("Done.");
