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

// deck Waray words (folded) for filtering — used to confirm a line is really Waray
const DECKF=new Set(SEED.map(r=>r[1]).flatMap(w=>w.split("/")).map(x=>x.trim()).flatMap(x=>x.split(/\s+/)).map(fold).filter(Boolean));
const isWarayLine=l=>{ const t=l.replace(/[*]/g,"").split(/\s+/).filter(Boolean); if(t.length<2||t.length>9) return false; return t.some(x=>DECKF.has(fold(x))); };
const EN1=new Set("the a an is are am to of and or in on at he she it you i we they his her my your our their this that these those what where who when why how do does did will not no yes".split(" "));
const enScore=l=>{const t=l.toLowerCase().replace(/[.,!?;:"']/g,"").split(/\s+/).filter(Boolean);return t.length?t.filter(w=>EN1.has(w)).length/t.length:0;};
// gloss map (folded waray -> english gloss words) to confirm an English line really
// translates a Waray line (kills OCR mispairs from the scanned 2-column / numbered layout)
const GLOSS={}; SEED.filter(r=>!/\s/.test(r[1])&&!r[1].includes("/")).forEach(r=>{const k=fold(r[1]); if(!GLOSS[k]) GLOSS[k]=(eng[r[1]]||"").toLowerCase().split(/[\/,(]/)[0].replace(/^to /,"").trim().split(/\s+/).filter(x=>x.length>2);});
const corresponds=(w,e)=>{ const el=" "+e.toLowerCase()+" "; return w.split(/\s+/).some(t=>{const g=GLOSS[fold(t)]; return g&&g.some(x=>el.includes(" "+x));}); };
let m;
// ---- source 1: Peace Corps — full-PDF OCR, paired Waray line → English line ----
const ocr=fs.readFileSync("docs/sources/peace-corps-full-ocr.txt","utf8").split("\n").map(s=>s.trim());
const pcPairs=[]; const seenPC=new Set();
for(let i=0;i<ocr.length-1;i++){
  const a=ocr[i], b=ocr[i+1];
  if(/PAGE|Lesson|Exercise|Vocabulary|Pronoun|Class|^Note/i.test(a)) continue;
  if(/^\s*\d/.test(a) || /^\s*\d/.test(b) || / - /.test(a) || a.includes(":")) continue; // skip numbered exercises + vocab-list lines (unreliable pairing)
  if(isWarayLine(a) && enScore(a)<0.2 && enScore(b)>=0.34 && b.split(/\s+/).length<=10 && corresponds(a,b)){
    const w=a.replace(/[*]/g,"").trim(), e=b.trim(); const k=fold(w);
    if(!seenPC.has(k)){ seenPC.add(k); pcPairs.push({w,e}); }
  }
}
// also the hand-transcribed .md "Waray (english)" pairs
const pcmd=(fs.readFileSync("docs/peace-corps-transcript.md","utf8")+fs.readFileSync("docs/peace-corps-extract.md","utf8")).replace(/\s+/g," ");
const reP=/([A-ZÁÉÍÓÚ][A-Za-z'’\- ]{2,40}?)\s*\(([a-z][^)]{2,50})\)/g;
while((m=reP.exec(pcmd))){ const w=m[1].trim().replace(/\s+/g," "); const e=m[2].trim();
  const n=w.split(/\s+/).length; if(n>=2&&n<=8 && !/[.:]/.test(w) && isWarayLine(w)){ const k=fold(w); if(!seenPC.has(k)){seenPC.add(k);pcPairs.push({w,e});} } }

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
