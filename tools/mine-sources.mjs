/* Mine attested Waray sentences for the uncovered words from all 3 sources.
   Emits docs/phrase-mining.md (verification doc) + a summary. Run: node tools/mine-sources.mjs */
import fs from "fs";
import { RECORDING_PROMPTS } from "../src/courses/waray/recording-prompts.js";
import { SEED } from "../src/courses/waray/cards.js";
const eng={};SEED.forEach(r=>eng[r[1]]=r[2]);
const deNorm=s=>s.normalize("NFD").replace(/[̀-ͯ]/g,"");
const fold=s=>deNorm(s).toLowerCase().replace(/o/g,"u").replace(/e/g,"i").replace(/c/g,"k");
const ftoks=s=>s.replace(/[.,!?;:"'“”’()]/g,"").split(/[\s/]+/).map(fold).filter(Boolean);
const DECK=new Set(SEED.map(r=>r[1]).filter(w=>!/\s/.test(w)&&!w.includes("/")).map(fold));
const known=t=>DECK.has(t);

// ---- source 1: Peace Corps (both-sides attested) ----
const pc = (fs.readFileSync("docs/peace-corps-transcript.md","utf8")+"\n"+fs.readFileSync("docs/peace-corps-extract.md","utf8")).replace(/\n/g," ").replace(/\s+/g," ");
const pcPairs=[]; // {waray, english}
// pattern: "Waray words (english gloss)"
const reP=/([A-ZÁÉÍÓÚ][A-Za-z'’\- ]{2,40}?)\s*\(([a-z][^)]{2,50})\)/g; let m;
while((m=reP.exec(pc))){ const w=m[1].trim().replace(/\s+/g," "); const e=m[2].trim();
  const n=w.split(/\s+/).length; if(n>=2&&n<=8 && /^[A-Z]/.test(w) && !/[.:]/.test(w)) pcPairs.push({w,e}); }

// ---- source 2: CHED (Waray-only example sentences) ----
// join wrapped lines so sentences spanning a line break are captured whole
const ched=fs.readFileSync("docs/sources/waray-first-1000-words-2013.txt","utf8").replace(/\n/g," ").replace(/\s+/g," ");
const chedEx=new Set();
const reC=/‘\s*([A-ZÁÉÍÓÚÀÈÌÒÙ][^’‘]{4,110}?[.!?])/g;
while((m=reC.exec(ched))){ let s=m[1].trim().replace(/\s+/g," "); const n=s.split(/\s+/).length; if(n>=2&&n<=11) chedEx.add(s); }

// ---- source 3: Tramp/Zorc (Waray sentence + quoted English) ----
const tz=fs.readFileSync("docs/sources/tramp-zorc-waray-english-dictionary-1991.txt","utf8");
const tzPairs=[];
const reT=/‘([A-Za-zÁÉÍÓÚ][^’.]{4,70}[.?])’?\s*[""“]([^""”]{3,60})[""”]/g;
while((m=reT.exec(tz))){ const w=m[1].trim(), e=m[2].trim(); if(w.split(/\s+/).length<=9) tzPairs.push({w,e}); }

// index
const idx = arr => arr.map(o=>({...o, set:new Set(ftoks(o.w||o)), toks:ftoks(o.w||o)}));
const pcI=idx(pcPairs), tzI=idx(tzPairs), chedI=[...chedEx].map(e=>({w:e, set:new Set(ftoks(e)), toks:ftoks(e)}));
const scoreOf=o=>o.toks.filter(known).length/o.toks.length;

// rough word-by-word English gloss of a Waray sentence (a scaffold to correct, not a translation)
const FW={an:"the",it:"the","an mga":"the",ini:"this",iton:"that",adto:"that",nga:"",ha:"to",han:"of the",hin:"a",hi:"",si:"",ngan:"and",ako:"I",ka:"you",ikaw:"you",hiya:"he/she",hira:"they",kami:"we",kita:"we",kamo:"you",na:"already",pa:"still",la:"just",liwat:"also",waray:"no",diri:"not",may:"there-is",mayda:"have",kay:"because",kun:"if",ngahaw:"itself",ada:"maybe",ito:"that",didto:"there",dida:"there",didi:"here",dinhi:"here"};
const D1=SEED.filter(r=>!/\s/.test(r[1])&&!r[1].includes("/")); const dByFold={}; D1.forEach(r=>{const k=fold(r[1]); if(!dByFold[k]) dByFold[k]=(eng[r[1]]||"").split(/[\/,(]/)[0].replace(/^to /,"").trim();});
const glossTok=t=>{ const k=t.replace(/[.,!?;:"'“”’]/g,""); if(!k) return ""; const low=k.toLowerCase();
  if(FW[low]!==undefined) return FW[low]; const f=fold(k); if(dByFold[f]) return dByFold[f]; return "["+k+"]"; };
const draftEng=s=>s.split(/\s+/).map(glossTok).filter(Boolean).join(" ");

const words=[...new Set(RECORDING_PROMPTS.map(d=>d.word))].filter(w=>!/\s/.test(w)&&!w.includes("/"));
const findBest=(pool, fw)=>{ const c=pool.filter(o=>o.set.has(fw)); if(!c.length) return null;
  c.forEach(o=>o.s=scoreOf(o)); c.sort((a,b)=>b.s-a.s||a.toks.length-b.toks.length); return c[0]; };

let pcN=0,chedN=0,tzN=0,none=0; const rows={pc:[],ched:[],tz:[],none:[]};
for(const w of words){ const fw=fold(w);
  const p=findBest(pcI,fw);
  if(p){ pcN++; rows.pc.push([w,eng[w],p.w,p.e]); continue; }
  const t=findBest(tzI,fw);
  if(t){ tzN++; rows.tz.push([w,eng[w],t.w,t.e]); continue; }
  const ch=findBest(chedI,fw);
  if(ch && ch.s>=0.5){ chedN++; rows.ched.push([w,eng[w],ch.w,Math.round(ch.s*100),draftEng(ch.w)]); continue; }
  none++; rows.none.push([w,eng[w]]);
}
console.log(`uncovered words: ${words.length}`);
console.log(`  ✅ Peace Corps (Waray + English, turnkey): ${pcN}`);
console.log(`  ✅ Tramp/Zorc (Waray + English): ${tzN}`);
console.log(`  ✏️ CHED (Waray attested, needs English): ${chedN}`);
console.log(`  🎤 no match → Ella records: ${none}`);
console.log(`  => burden off Ella: ${pcN+tzN+chedN}/${words.length} (${Math.round(100*(pcN+tzN+chedN)/words.length)}%)`);

let md=`# Phrase mining — attested sentences for the uncovered words\n\n`;
md+=`_Mined from the 3 sources to take recording load off Ella. **✅ = Waray + English both attested** (use as-is, just sanity-check). **✏️ = Waray attested, English is my draft** (verify the English). **🎤 = no attested match** → Ella records these. Diacrítics shown as printed; normalize on import._\n\n`;
md+=`**${pcN+tzN} ready-to-use (both sides) · ${chedN} need an English check · ${none} still to record · ~${Math.round(100*(pcN+tzN+chedN)/words.length)}% off Ella's plate.**\n`;
md+=`\n## ✅ Peace Corps — Waray + English (turnkey, ${pcN})\n\n| Word | Waray sentence | English |\n|---|---|---|\n`;
rows.pc.forEach(([w,g,wa,e])=>md+=`| **${w}** _(${g})_ | ${wa} | ${e} |\n`);
if(tzN){ md+=`\n## ✅ Tramp/Zorc — Waray + English (${tzN})\n\n| Word | Waray sentence | English |\n|---|---|---|\n`;
  rows.tz.forEach(([w,g,wa,e])=>md+=`| **${w}** _(${g})_ | ${wa} | ${e} |\n`); }
md+=`\n## ✏️ CHED — Waray attested, English is a rough gloss to fix (${chedN})\n\n_The "rough gloss" is a word-by-word scaffold ([brackets] = word not in our deck) — correct it into real English._\n\n| Word | Waray sentence | Rough gloss → fix | %known |\n|---|---|---|--:|\n`;
rows.ched.forEach(([w,g,wa,k,dr])=>md+=`| **${w}** _(${g})_ | ${wa} | _${dr}_ | ${k}% |\n`);
md+=`\n## 🎤 No attested match — record these (${none})\n\n`;
md+=rows.none.map(([w,g])=>`- **${w}** _(${g})_`).join("\n")+"\n";
fs.writeFileSync("docs/phrase-mining.md", md);
console.log("\nwrote docs/phrase-mining.md");
