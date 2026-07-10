/* Audit the scan carving against the course: find sections mislabeled like the L4 / I-Class-Markers
   cases. Signals:
   A. a DB grammar/note/vocab block TITLE appears as an OCR line whose carved dest is an exercise span
   B. anchor-like headings that are OCR-garbled (lev<=2 of a canonical anchor) and did NOT anchor
   C. per-lesson: block types in the course vs section kinds found on its pages */
import pg from "/Users/paulkilroy/dev/Sulog/node_modules/pg/lib/index.js";
import fs from "fs";
const BOXES = "docs/sources/peace-corps/ocr-boxes";
const ocrRaw = fs.readFileSync("docs/sources/peace-corps/peace-corps-full-ocr.txt","utf8");
const lev=(a,b)=>{const d=Array.from({length:a.length+1},(_,i)=>[i,...Array(b.length).fill(0)]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length];};
const c = new pg.Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const q = async s => (await c.query(s)).rows;
const blocks = await q("select lesson_id, type, title from lesson_blocks where lesson_id like 'pc-%' and title is not null");
const paradigmWords = new Set((await q("select distinct d.waray from lesson_blocks lb join block_items bi on bi.block_id=lb.id join dictionary d on d.waray=bi.dict_waray where lb.lesson_id like 'pc-%' and lb.type='vocab' and lb.title is not null")).map(r=>r.waray.toLowerCase()));
await c.end();

// ---- same carve as the generator ----
const ANCHORS = [
  [/^\s*Lesson\s+\d+/i, "guide"],
  [/^\s*review\s*[:.]?\s*$|^\s*review\s+test/i, "gate"],
  [/^\s*examples?\b/i, "examples"],
  [/^\s*oral\s+exercises?/i, "oral"],
  [/^\s*written\s+exercises?/i, "written"],
  [/^\s*vocabulary\b/i, "vocab"],
  [/^\s*notes?\s*[:.]/i, "guide"],
  [/^\s*accent\s+marks/i, "guide"],
  [/^\s*(the\s+)?[ivx1l]{0,4}\s*[-–]?\s*class\s+(personal\s+|general\s+)?(pronouns?|markers?)\s*\.?\s*$/i, "guide"],
];
const isChartHead = t => /^\s*(singular|plural)\s*$/i.test(t) || /class\s+(personal\s+|general\s+)?(pronouns?|markers?)/i.test(t);
const wordsOf = t => (t||"").toLowerCase().split(/[^a-zà-ÿ']+/).filter(Boolean);

const normT=s=>(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();
const titleAnchorsByPage=new Map();
{ const lp={}; { let cur=null,curPage=1;
    for(const ln of ocrRaw.split("\n")){ const pm=ln.match(/^===PAGE (\d+)===/); if(pm)curPage=+pm[1];
      const m=ln.match(/^Lesson (\d+)/); if(m){cur=+m[1];(lp[cur]=lp[cur]||new Set()).add(curPage);} else if(cur&&pm&&curPage<=92) lp[cur].add(curPage); } }
  for(const b of blocks){ if(b.type!=="grammar"&&b.type!=="note"||!b.title) continue;
    const num=+(/pc-l(\d+)/.exec(b.lesson_id)||[])[1]; const tn=normT(b.title); if(tn.length<5) continue;
    for(const p of (lp[num]||[])) (titleAnchorsByPage.get(p)||titleAnchorsByPage.set(p,[]).get(p)).push({tn,plus:/\+/.test(b.title)}); } }
function isTitleAnchor(p,t){ const cand=titleAnchorsByPage.get(p); if(!cand) return false;
  const ln=normT(t); if(ln.length<5) return false;
  for(const {tn,plus} of cand){ if(ln===tn){ if(tn.length>=10||plus||/^[A-Z]/.test((t||"").trim())) return true; }
    else if(tn.length>=10&&Math.abs(ln.length-tn.length)<=3&&lev(ln,tn)<=2) return true; } return false; }
const pageLines = {};
{ let current="guide";
  for (let n=1;n<=92;n++){
    const f=`${BOXES}/ocr-p${String(n).padStart(2,"0")}.json`; if(!fs.existsSync(f)) continue;
    const j=JSON.parse(fs.readFileSync(f,"utf8"));
    const lines=(j.lines||[]).map(l=>({t:l.t,x:l.x,w:l.w,top:1-l.y-l.h,bottom:1-l.y})).sort((a,b)=>a.top-b.top);
    for(const l of lines){ const hit=ANCHORS.find(([re])=>re.test(l.t)); if(hit) current=hit[1]; else if(isTitleAnchor(n,l.t)) current="guide"; l.dest=current; }
    const chart=lines.filter(l=>{const w=wordsOf(l.t);return l.dest==="guide"&&w.length<=5&&(isChartHead(l.t)||(w.length<=3&&w.some(x=>paradigmWords.has(x))));});
    if(chart.length>=2){const top=Math.min(...chart.map(l=>l.top)),bottom=Math.max(...chart.map(l=>l.bottom));for(const l of lines)if(l.dest==="guide"&&l.top>=top-0.005&&l.bottom<=bottom+0.005)l.dest="paradigm";}
    pageLines[n]=lines;
  }
}
// lesson -> pages (same as generator)
const ocr = fs.readFileSync("docs/sources/peace-corps/peace-corps-full-ocr.txt","utf8");
const lessonPages={}; { let cur=null,curPage=1;
  for(const ln of ocr.split("\n")){
    const pm=ln.match(/^===PAGE (\d+)===/); if(pm)curPage=+pm[1];
    const m=ln.match(/^Lesson (\d+)/); if(m){cur=+m[1]; (lessonPages[cur]=lessonPages[cur]||new Set()).add(curPage);}
    else if(cur&&pm&&curPage<=92) lessonPages[cur].add(curPage);
  }
}

const norm = s => (s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9 ]+/g," ").replace(/\s+/g," ").trim();

console.log("=== A. course block TITLES carved into the wrong span ===");
const okDest = { grammar:["guide","paradigm"], note:["guide","paradigm"], vocab:["vocab","paradigm","guide"] };
for (const b of blocks){
  if(b.type==="drill") continue;
  const num=+(/pc-l(\d+)/.exec(b.lesson_id)||[])[1];
  const tn=norm(b.title); if(!tn||tn.length<6) continue;
  for (const p of (lessonPages[num]||[])){
    for (const l of (pageLines[p]||[])){
      const ln=norm(l.t);
      if(ln===tn || (ln.length>7 && lev(ln,tn)<=2)){
        if(!(okDest[b.type]||["guide"]).includes(l.dest))
          console.log(`  L${num} p.${p}: "${l.t}"  [${b.type} title] carved as ${l.dest.toUpperCase()}`);
      }
    }
  }
}
console.log("\n=== B. garbled anchor headings that did NOT anchor ===");
const CANON=["examples","oral exercises","written exercises","vocabulary","review"];
for(let p=1;p<=92;p++) for(const l of (pageLines[p]||[])){
  const ln=norm(l.t); if(ln.length<5||ln.length>22) continue;
  for(const cn of CANON){
    if(ln!==cn && Math.abs(ln.length-cn.length)<=2 && lev(ln,cn)<=2 && !ANCHORS.some(([re])=>re.test(l.t)))
      console.log(`  p.${p}: "${l.t}" ~ "${cn}" (lev ${lev(ln,cn)}) carved as ${l.dest}`);
  }
}
