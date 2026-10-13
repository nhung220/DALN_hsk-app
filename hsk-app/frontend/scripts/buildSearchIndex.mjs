import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const frontend = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(frontend, "..", "..", "data", "complete-hsk-vocabulary-main", "complete-hsk-vocabulary-main", "wordlists", "exclusive", "new");
const enriched = new Map();

for (let level = 1; level <= 7; level++) {
  const current = JSON.parse(readFileSync(join(frontend, "public", "data", `hsk-new-${level}.json`), "utf8"));
  for (const lesson of current.lessons) {
    for (const word of lesson.words) enriched.set(`${level}:${word.simplified}`, word);
  }
}

const result = [];
for (let level = 1; level <= 7; level++) {
  const rawWords = JSON.parse(readFileSync(join(source, `${level}.json`), "utf8"));
  rawWords.forEach((raw, index) => {
    const existing = enriched.get(`${level}:${raw.simplified}`);
    if (existing) { result.push(existing); return; }

    const forms = raw.forms ?? [];
    const form = forms[0] ?? {};
    const meanings = forms.flatMap(item => item.meanings ?? [])
      .filter(text => !/^(surname|old variant|variant of)/i.test(text)).slice(0, 5);
    const bestForm = forms.find(item => !(item.meanings ?? []).some(text => /^surname/i.test(text))) ?? form;

    result.push({
      id: `search-new-${level}-${index}`,
      simplified: raw.simplified,
      traditional: form.traditional && form.traditional !== raw.simplified ? form.traditional : undefined,
      pinyin: bestForm.transcriptions?.pinyin ?? "",
      pinyinNumeric: bestForm.transcriptions?.numeric ?? "",
      meanings,
      meaning: meanings[0] ?? "",
      meaningVi: "",
      pos: (raw.pos ?? []).map(code => ({ code, label: code })),
      radical: raw.radical ?? "",
      frequency: raw.frequency ?? 99999,
      classifiers: [...new Set(forms.flatMap(item => item.classifiers ?? []))],
      level: `new-${level}`,
      audioUrl: `/audio/new-${level}/${encodeURIComponent(raw.simplified)}.mp3`,
    });
  });
}

const commonEntries = [
  {
    id: "common-nihao",
    simplified: "你好",
    traditional: "你好",
    pinyin: "nǐ hǎo",
    pinyinNumeric: "ni3 hao3",
    meanings: ["hello", "hi", "how are you?"],
    meaning: "hello",
    meaningVi: "xin chào; chào bạn",
    pos: [{ code: "phrase", label: "cụm từ" }],
    radical: "",
    frequency: 1,
    classifiers: [],
    level: "new-1",
    audioUrl: "/audio/new-1/%E4%BD%A0%E5%A5%BD.mp3",
  },
];

for (const entry of commonEntries) {
  if (!result.some(word => word.simplified === entry.simplified)) result.push(entry);
}

writeFileSync(join(frontend, "public", "data", "search-index.json"), JSON.stringify(result), "utf8");
console.log(`Generated search-index.json with ${result.length} words`);
