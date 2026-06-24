/* Fold mined phrases into the curriculum: append cards to cards.js (end, id-safe)
   and write mined-phrases.js (MINED_BY_UNIT) for frequency.js to add ② Apply
   lessons. PC = attested both sides; CHED ≥70% = my draft English (verify).
   Run once: node tools/integrate-mined.mjs */
import fs from "fs";
const J = JSON.parse(fs.readFileSync("docs/phrase-mining-data.json","utf8"));
const SEEDtext = fs.readFileSync("src/courses/waray/cards.js","utf8");

// my English for the CHED sentences I'm folding in (keyed by the exact data waray)
const CHED_EN = {
  "Walo an ira anak.": "They have eight children.",
  "Waray pa pag- anak an amon ayam.": "Our dog hasn't had puppies yet.",
  "Babayi an nati han amon karabaw.": "Our carabao's calf is female.",
  "Kay ano waray ka uli kagab-i?": "Why didn't you go home last night?",
  "Gutom na an bata kay nagtitinuok.": "The child is hungry because he's crying.",
  "Ngan waray pa tanom ha kapatagan.": "And there were no plants on the plain yet.",
  "Dinhi la kamo kay malakat ako, ginsiring an iya asawa.": "'Just stay here, I'm leaving,' his wife said.",
  "Nailiw na an kasingkasing ko.": "My heart now longs.",
  "Gutom an umabot ha ira dara han pagkinarag hin pagkaon.": "Hunger came upon them, bringing a scramble for food.",
  "Malipay an bata han bag-o niya nga lapis ngan para.": "The child is happy with his new pencil and pen.",
  "Didto na ito hira ha bukid han Apoy pagkatatawo.": "They were already on Grandfather's mountain at birth.",
  "Malipayon hiya han hatag ha iya nga bukad.": "She was happy with the flower given to her.",
  "Kakaonon ko ini yana.": "I'll eat this now.",
  "Ano an karan-on dida?": "What food is there?",
  "Makuri maabot han mga bomber an sunog kay adto ha sulod.": "The firefighters had a hard time reaching the fire because it was inside.",
  "Waray pa ada umabot an iya tatay.": "His father has perhaps not arrived yet.",
  "Diri igo an iya napalit nga sapatos.": "The shoes she bought don't fit.",
  "Buhat na ikaw dida kay maalas-syete na.": "Get up now, it's already seven o'clock.",
  "Didto hiya bukid makaagi hin prutas, makakakaon.": "There on the mountain he could find fruit to eat.",
  "Ini amo an maglilipay ha aton mahatungod han aton buhat.": "This is what will make us glad about our work.",
  "Ha tanto han iya dalagan, hirayo na hiya hin duro.": "From all his running, he was already very far away.",
  "Waray hira ilob kay uraura kamabaskog an gutom ha tuna.": "They had no patience, for the famine in the land was severe.",
};
// words that are function/grammatical — don't anchor a sentence's unit to these
const FUNC = new Set(["ko","nakon","nimo","niya","naton","namon","niyo","nira","akon","imo","iya","aton","amon","iyo","ira","kita","kami","kamo","hira","ako","hiya","ka","ikaw","an","it","na","pa","ha","hin","han","nga","ngan"]);
const clean = s => s.replace(/\s*-\s+/g,"-").replace(/\s+/g," ").trim();
const deckOf = w => { const re=new RegExp(`\\["([a-z0-9]+)", "${w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}"`); const m=SEEDtext.match(re); return m?m[1]:"gram"; };

// gather records: PC (all) + CHED (those with a translation)
const recs=[]; // {waray, english, source, unit, unitName, anchorWord, deck}
const bySentence={};
const add=(r)=>{ const k=clean(r.waray); if(!bySentence[k]){ bySentence[k]={...r, waray:clean(r.waray), words:[r.word]}; recs.push(bySentence[k]); } else bySentence[k].words.push(r.word); };
J.pc.forEach(p=>add({waray:p.waray, english:p.english, source:"Peace Corps", word:p.word, unit:p.unit, unitName:p.unitName}));
J.ched.forEach(c=>{ const en=CHED_EN[c.waray]; if(en) add({waray:c.waray, english:en, source:"CHED · verify", word:c.word, unit:c.unit, unitName:c.unitName}); });

// assign each sentence to a content word's unit; collect cards + per-unit lists
const minedRows=[]; const byUnit={};
const wordUnit={}; [...J.pc,...J.ched].forEach(x=>wordUnit[x.word]={unit:x.unit, unitName:x.unitName});
for(const r of recs){
  const content = r.words.find(w=>!FUNC.has(w)) || r.words[0];
  const u = wordUnit[content]; if(!u) continue;
  const deck = deckOf(content);
  // skip if this exact waray already a card
  if(new RegExp(`", "${r.waray.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}"`).test(SEEDtext)) continue;
  minedRows.push(`  ["${deck}", "${r.waray.replace(/"/g,'\\"')}", "${r.english.replace(/"/g,'\\"')}", "${r.source}", ""],`);
  (byUnit[u.unit]=byUnit[u.unit]||{name:u.unitName, items:[]}).items.push(r.waray);
}

// 1) append cards to cards.js (before the SEED closing ];)
const marker = "\n];";
const idx = SEEDtext.indexOf(marker); // first ]; closes SEED
const newCards = `\n\n  // ===== mined phrase cards (Peace Corps OCR + CHED; appended → ids stable) =====\n${minedRows.join("\n")}`;
fs.writeFileSync("src/courses/waray/cards.js", SEEDtext.slice(0,idx)+newCards+SEEDtext.slice(idx));

// 2) write mined-phrases.js
const MINED={}; for(const u of Object.keys(byUnit)) MINED[u]=byUnit[u].items;
fs.writeFileSync("src/courses/waray/mined-phrases.js",
`/* Mined ② Apply phrases per unit (from tools/integrate-mined.mjs). The Waray\n   strings are also cards in cards.js. */\nexport const MINED_BY_UNIT = ${JSON.stringify(MINED,null,1)};\n`);

console.log(`folded ${minedRows.length} phrase cards into ${Object.keys(byUnit).length} units`);
console.log(Object.entries(byUnit).map(([u,o])=>`  ${u} ${o.name}: ${o.items.length}`).join("\n"));
