/* Generate recording prompts for Phrase Studio + the recording sheet + a
   reinforcement table. Each prompt is an English target sentence assembled ONLY
   from words already taught by that unit (i+1), with rotating objects/subjects/
   times for variety. Run: node tools/gen-prompts.mjs   (regenerate when content
   changes). Emits:
     src/courses/waray/recording-prompts.js
     docs/phrase-recording-sheet.md
     docs/phrase-reinforcement.md  */
import fs from "fs";
import { FREQUENCY } from "../src/courses/waray/frequency.js";
import { SEED } from "../src/courses/waray/cards.js";

const eng = {}; SEED.forEach(r => (eng[r[1]] = r[2]));
const fold = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/o/g,"u").replace(/e/g,"i").replace(/c/g,"k");
const toks = s => s.replace(/[.,!?;:"'“”]/g,"").split(/[\s/]+/).map(fold).filter(Boolean);
const isCov = (w,set)=>{const p=w.split("/").map(x=>x.trim()).filter(Boolean);if(w.includes("/")||!/\s/.test(w))return p.some(x=>{const t=toks(x);return t.length&&t.every(y=>set.has(y));});return toks(w).every(y=>set.has(y));};
const g0 = w => (eng[w]||w).split("/")[0].replace(/\(.*?\)/g,"").trim();
const gv = w => g0(w).replace(/^to\s+/,"").trim();

// ---- reverse map: English prompt token -> deck Waray word (for accurate word counting) ----
const SINGLE = SEED.map(r=>r[1]).filter(w=>!/\s/.test(w) && !w.includes("/")); // single-token cards
const SINGLE_SET = new Set(SINGLE);
const glossRev = {}; // english gloss head -> waray (first wins)
SEED.forEach(r=>{ if(/\s/.test(r[1])||r[1].includes("/")) return; const g=g0(r[1]).toLowerCase(); if(g && !glossRev[g]) glossRev[g]=r[1]; });
const MAN = { // function words + verbs the templates use, mapped to a representative deck word
  my:"ko",our:"naton",your:"nimo",their:"nira",his:"iya",her:"iya",mine:"akon",ours:"aton",theirs:"ira",yours:"imo",
  this:"ini",that:"iton",these:"ini",the:"an",here:"didi",there:"didto",now:"yana",later:"niyan",tomorrow:"buwas",yesterday:"kakulop",earlier:"kanina",tonight:"gab-i",
  i:"ako",he:"hiya",she:"hiya",we:"kami",they:"hira",you:"ikaw",
  and:"ngan",not:"diri",no:"waray",to:"ha",at:"ha","in":"ha",
  eat:"kaon",ate:"kaon",eating:"kaon",go:"lakat",went:"lakat",going:"lakat",buy:"palit",bought:"palit",buying:"palit",drink:"inom",drank:"inom",drinking:"inom",
  see:"kita",seen:"kita",cook:"luto",cooks:"luto",read:"basa",reads:"basa",wash:"hugas",washes:"hugas",fold:"lukot",folds:"lukot",pray:"ampo",worship:"simba",preaches:"wali",love:"gugma",want:"karuyag",wants:"karuyag",help:"bulig",forgive:"pasaylo",ride:"sakay",walk:"baktas",wait:"hulat",
  has:"may",have:"may",
  good:"maupay",big:"daku",small:"gutiay",nice:"mahusay",beautiful:"mahusay",delicious:"marasa",hungry:"gutom",hot:"mapaso",cold:"matugnaw",near:"harani",far:"harayo",cheap:"barato",tall:"hataas",kind:"buoton",
  one:"usa",two:"duha",three:"tulo",
};
const en2war = t => { const k=t.toLowerCase().replace(/[^a-z]/g,""); return MAN[k] || glossRev[k] || null; };
// the deck Waray words an English sentence implies (function + content words)
const reverseWords = s => { const out=new Set(); s.split(/\s+/).forEach(t=>{ const w=en2war(t); if(w && SINGLE_SET.has(w)) out.add(w); }); return out; };
// the deck single-words present in a real Waray phrase (folded match)
const phraseWords = ph => { const set=new Set(toks(ph)); return SINGLE.filter(w=>isCov(w,set)); };

// ---- cumulative known single-word vocab by unit (curriculum order) ----
const unitsInOrder = [];
let acc = new Set();
for (const ph of FREQUENCY) for (const u of ph.units) {
  const words = u.lessons.filter(l=>l.kind!=="apply").flatMap(l=>l.items||[]);
  words.forEach(w => w.split("/").map(x=>x.trim()).forEach(x=>acc.add(x)));
  unitsInOrder.push({ id:u.id, name:u.name, words, known:new Set(acc) });
}
const knownOf = id => unitsInOrder.find(u=>u.id===id).known;

// ---- filler pools (waray:en) — all real deck cards; filtered to known per unit ----
const POOL = {
  obj:  [["libro","book"],["lamesa","table"],["baso","glass"],["lapis","pencil"],["sapatos","shoes"],["bado","shirt"],["tubig","water"],["kwarta","money"],["saging","banana"],["isda","fish"],["ayam","dog"],["bukad","flower"],["kahoy","tree"]],
  place:[["balay","house"],["tindahan","store"],["simbahan","church"],["ospital","hospital"],["dagat","sea"],["bukid","mountain"],["kusina","kitchen"],["bangko","bank"]],
  food: [["isda","fish"],["manok","chicken"],["kan-on","rice"],["saging","banana"],["mangga","mango"],["utan","vegetables"],["sabaw","soup"],["prutas","fruit"]],
  drink:[["tubig","water"],["tsa","tea"]],
  time: [["yana","now"],["niyan","later"],["buwas","tomorrow"],["kanina","earlier"],["kakulop","yesterday"],["kagab-i","last night"]],
  adj:  [["daku","big"],["gutiay","small"],["mahusay","nice"],["maraut","bad"],["marasa","delicious"]],
};
const NAMES = ["Maria","Pedro","Ana","Jose","Lito","Rosa"];
// subjects: names (always) + known SINGULAR people, so "is/has/-s" agree in English
const PEOPLE = [["hiya","He"],["nanay","Mother"],["tatay","Father"],["bata","The child"],["lalaki","The man"],["babaye","The woman"]];

function picker(unitId, idx) {
  const known = knownOf(unitId);
  const filt = arr => arr.filter(([w]) => known.has(w));
  const used = []; // track waray fillers actually used
  const pick = (cat, off=0) => { const f=filt(POOL[cat]); if(!f.length) return null; const [w,e]=f[(idx+off)%f.length]; used.push(w); return e; };
  const name = (off=0) => NAMES[(idx+off)%NAMES.length];
  const subj = (off=0) => { const ppl=filt(PEOPLE); const all=[...NAMES.map(n=>[null,n]),...ppl]; const [w,e]=all[(idx+off)%all.length]; if(w)used.push(w); return e; };
  return { pick, name, subj, used, known };
}

// ---- per-unit prompt builders → return {en} and push fillers to ctx.used ----
const REL = /father|mother|child|sibling|spouse|wife|husband|cousin|grandparent|grandchild|sweetheart|boyfriend|girlfriend|friend|neighbor/;
const A = w => (/^[aeiou]/i.test(w)?"an ":"a ")+w;

const BUILD = {
  u3: (w,c)=>({kita:"We are friends.",kami:"We are students.",kamo:"You are all teachers.",hira:`They went to the ${c.pick("place")||"store"}.`}[w]||`Use “${w}”.`),
  u4: (w,c)=>{ const g=gv(w);
    if (REL.test(g0(w))) { const r=g0(w).replace(/^my\s+/,""); return [`This is my ${r}.`,`${c.name()} is my ${r}.`,`My ${r} is here.`,`My ${r} is kind.`][c._i%4]; }
    if (w==="miyembro") return `She is a church member.`;
    if (w==="tawo") return [`This person is kind.`,`That person is tall.`][c._i%2];
    return [`This is the ${g}.`,`${c.name()} is a ${g}.`,`That ${g} is tall.`,`The ${g} is here.`][c._i%4];
  },
  u5: (w,c)=>{ const g=gv(w); return [`${c.name()} is a ${g}.`,`My ${["father","mother","friend"][c._i%3]} is a ${g}.`,`That ${g} is kind.`,`She is a ${g}.`][c._i%4]; },
  u6: (w,c)=>{ const g=gv(w);
    if (["big","small","tall","short","fat","thin","beautiful","ugly","handsome","bad","hot"].includes(g)) { const o=c.pick("obj")||"house"; return [`The ${o} is ${g}.`,`${c.subj()} is ${g}.`,`That ${o} is ${g}.`][c._i%3]; }
    return [`The man is ${g}.`,`My mother is ${g}.`,`${c.name()} is ${g}.`,`The teacher is ${g}.`,`I am ${g}.`][c._i%5];
  },
  u7: (w,c)=>{ const g=gv(w); return [`My ${g} hurts.`,`${c.name()}'s ${g} is small.`,`The child's ${g} is big.`][c._i%3]; },
  u10:(w,c)=>{ const o=c.pick("obj")||"book"; const p={ko:"mine",naton:"ours",niyo:"yours (all of you)",nira:"theirs"}[w]||"the family's"; return [`This ${o} is ${p}.`,`That ${o} is ${p}.`][c._i%2]; },
  u11:(w,c)=>{ const o=c.pick("obj")||"house"; const p={akon:"mine",imo:"yours",iya:"his",aton:"ours",amon:"ours",iyo:"yours (all)",ira:"theirs"}[w]||"mine"; return [`This ${o} is ${p}.`,`That ${o} is ${p}.`][c._i%2]; },
  u15:(w,c)=>{ const s=c.subj(), t=c.pick("time");
    const V={makaon:["eat","fut"],nakaon:["eat","pres"],kinmaon:["eat","past"],malakat:["go","fut"],nalakat:["go","pres"],linmakat:["go","past"],mapalit:["buy","fut"],napalit:["buy","pres"],pinmalit:["buy","past"],mainom:["drink","fut"],nainom:["drink","pres"],inminom:["drink","past"]};
    const [verb,tense]=V[w]||["eat","pres"];
    if (verb==="eat")  { const f=c.pick("food")||"rice";  return tense==="fut"?`${s} will eat ${f}.`:tense==="pres"?`${s} is eating ${f}.`:`${s} ate ${f}${t?" "+t:""}.`; }
    if (verb==="go")   { const p=c.pick("place")||"store"; return tense==="fut"?`${s} will go to the ${p}.`:tense==="pres"?`${s} is going to the ${p}.`:`${s} went to the ${p}${t?" "+t:""}.`; }
    if (verb==="buy")  { const o=c.pick("obj")||"fish";   return tense==="fut"?`${s} will buy ${o}.`:tense==="pres"?`${s} is buying ${o}.`:`${s} bought ${o}${t?" "+t:""}.`; }
    const d=c.pick("drink")||"water"; return tense==="fut"?`${s} will drink ${d}.`:tense==="pres"?`${s} is drinking ${d}.`:`${s} drank ${d}${t?" "+t:""}.`;
  },
  u17:(w,c)=>{ const g=gv(w), s=c.subj();
    const obj = /wash \(clothes\)|fold/.test(g0(w))?"the clothes":/wash \(dishes\)/.test(g0(w))?"the dishes":/cook/.test(g)?(c.pick("food")||"rice"):/read|write/.test(g)?"the book":/give|bring|borrow/.test(g)?(c.pick("obj")||"money"):"";
    return obj?`${s} ${g.replace(/\s*\(.*?\)/,"")}s ${obj}.`:[`${s} likes to ${g}.`,`Please ${g}.`,`We will ${g} later.`][c._i%3];
  },
  u18:(w,c)=>({yana:"I will eat now.",niyan:"They will come later.",buwas:`${c.name()} will go to the store tomorrow.`,kanina:"I ate lunch earlier.",kakulop:"We worked yesterday.","kagab-i":"The child slept last night.",kulop:"It is afternoon now.",didi:`The ${c.pick("obj")||"book"} is here.`,dinhi:"Come here.",dida:`The ${c.pick("place")||"store"} is there.`,didto:"The church is over there.",adlaw:"Today is a good day.",semana:"This week is busy.",panahon:"There is no time."}[w]||`Say it for “${eng[w]}”.`),
  u19:(w,c)=>{ const g=gv(w); const months=/January|February|March|April|May|June|July|August|September|October|November|December/.test(g); return months?[`My birthday is in ${g}.`,`It is hot in ${g}.`,`We will travel in ${g}.`][c._i%3]:[`Today is ${g}.`,`Tomorrow is ${g}.`,`Yesterday was ${g}.`,`We will meet on ${g}.`][c._i%4]; },
  u16:(w,c)=>[`The work is hard.`,`I will go to work.`,`${c.name()} has work today.`][c._i%3],
  u20:(w,c)=>({mapaso:"It is hot today.",matugnaw:"It is cold now."}[w]||`Today it is ${gv(w)}.`),
  u30:(w,c)=>({biyahe:"The trip is long.",lumakat:"They left yesterday.","san-o":"When will you arrive?","kakan-o":"When did you arrive?",maabot:"I will arrive tomorrow."}[w]||`Say it for “${eng[w]}”.`),
  u34:(w,c)=>{ const o=c.pick("obj")||"shirt"; return [`The ${o} is ${gv(w)}.`,`${c.name()} has a ${gv(w)} ${o}.`,`That ${o} is ${gv(w)}.`][c._i%3]; },
  u21:(w,c)=>thing(w,c),
  u22:(w,c)=>({marasa:"The food is delicious.",gutom:"I am hungry."}[w]||[`${c.subj()} ate ${gv(w)}.`,`Have you eaten ${gv(w)}?`,`We will have ${gv(w)} ${c.pick("time")||"now"}.`][c._i%3]),
  u23:(w,c)=>({igbabad:"Marinate the chicken.",pakaladkara:"Boil the water.",masayon:"It is easy to cook.",madali:"It is quick.",makuri:"It is hard to cook."}[w]||[`Add the ${gv(w)}.`,`We need ${gv(w)}.`,`Do we have ${gv(w)}?`][c._i%3]),
  u24:(w,c)=>place(w,c),
  u25:(w,c)=>({palit:"I will buy it.",ginbibiling:"I am looking for it.",karuyag:`${c.name()} wants the fish.`,bulig:"Please help me.",kwarta:"I have money.",sinsilyo:"Do you have coins?",sukli:"Here is your change.",barato:"The fish is cheap.",baraydan:"How much is the bill?",bulad:"I will buy dried fish.",tinapa:"The smoked fish is good."}[w]||place(w,c)),
  u26:(w,c)=>({baktas:"We will walk to the store.",karsada:"The road is long.",bukid:"The mountain is high.",tulay:"The bridge is near."}[w]||[`${c.name()} will ride the ${gv(w)}.`,`The ${gv(w)} is fast.`,`We will take the ${gv(w)} to the store.`][c._i%3]),
  u27:(w,c)=>[`Where is my ${gv(w)}?`,`Here is my ${gv(w)}.`,`${c.name()} lost the ${gv(w)}.`][c._i%3],
  u28:(w,c)=>({mamasyada:"Let's go out tomorrow.",kumita:"I want to see it.",maupod:"Will you come along?",makaradlok:"It is scary.",huram:"May I borrow it?",pamasyada:"The outing is tomorrow."}[w]||[`We will go to the ${gv(w)}.`,`The ${gv(w)} is beautiful.`,`Have you seen the ${gv(w)}?`][c._i%3]),
  u31:(w,c)=>({marasa:"It is delicious.",gutom:"I am hungry.",pagkaon:"The food is ready."}[w]||[`${c.subj()} likes ${gv(w)}.`,`I will buy ${gv(w)} at the store.`,`The ${gv(w)} is delicious.`,`We ate ${gv(w)} ${c.pick("time")||"now"}.`][c._i%4]),
  u32:(w,c)=>/dog|carabao/.test(g0(w))?[`The ${gv(w)} is big.`,`${c.name()} has a ${gv(w)}.`][c._i%2]:[`I see a ${gv(w)}.`,`The ${gv(w)} is beautiful.`,`There are many ${gv(w)} here.`][c._i%3],
  u35:(w,c)=>({simba:"We worship God.",ampo:"I pray every night.",wali:"The pastor preaches.",gugma:"God is love.",Diyos:"I believe in God.",Ginoo:"The Lord is good.",espiritu:"The spirit is holy.",bendisyon:"This is a blessing.",kasingkasing:"My heart is glad."}[w]||`This is the ${gv(w)}.`),
  u36:(w,c)=>({simbahan:"We go to church.",pasaylo:"Please forgive me.",kinabuhi:"Life is good.",kaadlawan:"Today is my birthday.",langit:"Heaven is beautiful.",pastor:"He is a pastor.",misyonaryo:"She is a missionary.",Kristohanon:"I am a Christian.",Bibliya:"I read the Bible.",kros:"The cross is on the wall."}[w]||`This is the ${gv(w)}.`),
};
// thing frames deliberately rotate in grammar words already taught (my/our/their,
// this/that, have, two, is-it-a-question) so those high-frequency words get reinforced
function thing(w,c){ const g=gv(w); const a=c.pick("adj"); const p=c.pick("place",1); const poss=["my","our","their"][c._i%3];
  return [
    `This is the ${g}.`,
    `${poss==="my"?"My":poss==="our"?"Our":"Their"} ${g} is here.`,
    a?`Is the ${g} ${a}?`:`Where is the ${g}?`,
    `I have two ${g}s.`,
    p?`The ${g} is in the ${p}.`:`That is my ${g}.`,
  ][c._i%5]; }
function place(w,c){ const g=gv(w); return [`Where is the ${g}?`,`${c.name()} went to the ${g}.`,`Our ${g} is near.`,`I will go to the ${g} now.`][c._i%4]; }

// ---- generate ----
const SKIP_U=new Set(["u1","u33"]); const SKIP_W=new Set(["han","hin","ha","hi","ngan","it","an","na","pa","liwat","ba","ano","hain","diin","mapira","tagpira","hin-o","ini","iton","adto","Pwede","Ayaw","Waray","Diri","Oo","Adi","Anay","Sige","maupay","tabang","Salamat"]);
const data=[];
for (const u of unitsInOrder) {
  if (SKIP_U.has(u.id)) continue;
  const words = u.words.filter(w=>!/\s/.test(w) ? true : true).filter(w=>!SKIP_W.has(w));
  const set = new Set((FREQUENCY.flatMap(p=>p.units).find(x=>x.id===u.id).lessons.filter(l=>l.kind==="apply").flatMap(l=>l.items||[])).flatMap(toks));
  const unc = words.filter(w=>!isCov(w,set));
  const b = BUILD[u.id];
  unc.forEach((w,i)=>{
    const c = picker(u.id, i); c._i = i;
    const en = b ? b(w,c) : `Make a simple sentence with “${w}”.`;
    // skip items with no real builder result — multi-word entries that are already
    // phrases/expressions (e.g. "Ano it oras dida?") don't need a sentence built around them
    if (/^(Say it for|Make a simple sentence)/.test(en)) return;
    // complete Waray word set this prompt implies: target + reverse-mapped tokens
    const wordsUsed = [...new Set([w, ...reverseWords(en)])];
    data.push({ unit:u.id, unitName:u.name, word:w, gloss:eng[w]||"", prompt:en, words:wordsUsed });
  });
}

// recording-prompts.js
fs.writeFileSync("src/courses/waray/recording-prompts.js",
`/* Auto-generated by tools/gen-prompts.mjs. Each prompt is built only from words\n   taught by its unit (i+1); 'words' lists the deck words it uses (for reinforcement). */\nexport const RECORDING_PROMPTS = ${JSON.stringify(data)};\n`);

// recording sheet
let sheet = `# Phrase recording sheet — cover the uncovered words\n\n_${data.length} words. Each has an English target sentence built only from words already taught. **Say/record the Waray**; send back as \`Waray = English\`. If a prompt is odd, say a better short sentence with the word._\n`;
let cur="";
for (const d of data){ if(d.unitName!==cur){cur=d.unitName; sheet+=`\n### ${cur}\n`;} sheet+=`- **${d.word}** _(${d.gloss})_ → “${d.prompt}”  \n  Waray: ____________________\n`; }
fs.writeFileSync("docs/phrase-recording-sheet.md", sheet);

// ---- reinforcement table: keyed on each unit's NEW words ----
// Corpus of phrases (each = a Set of deck words it contains), in curriculum order,
// = existing ② Apply phrases (real Waray) + the recording prompts (reverse-mapped).
const corpus = []; // { uidx, words:Set }
const newWordsByUnit = []; // { id, name, words:[ new single-word vocab introduced here ] }
let seen = new Set();
unitsInOrder.forEach((u,uidx)=>{
  const unitObj = FREQUENCY.flatMap(p=>p.units).find(x=>x.id===u.id);
  // existing apply phrases for this unit
  (unitObj.lessons.filter(l=>l.kind==="apply").flatMap(l=>l.items||[])).forEach(ph=>corpus.push({uidx, words:new Set(phraseWords(ph))}));
  // recording prompts for this unit
  data.filter(d=>d.unit===u.id).forEach(d=>corpus.push({uidx, words:new Set(d.words)}));
  // new single-word vocab first introduced in this unit
  const fresh = u.words.filter(w=>!/\s/.test(w) && !w.includes("/")).filter(w=>!seen.has(w));
  fresh.forEach(w=>seen.add(w));
  newWordsByUnit.push({ id:u.id, name:u.name, uidx, words:fresh });
});
const countIn = (w, pred) => corpus.filter(c=>pred(c.uidx) && c.words.has(w)).length;

// ---- GOAL: target later-reuse per word, frequency-weighted ----
// Base by phase (frequency-first: P1 core words recur most; P4 themes least),
// bumped up if the word matches an early Duolingo Spanish concept.
const normEn = s => s.toLowerCase().replace(/\(.*?\)/g,"").replace(/^(to |the |a |an )/,"").replace(/[^a-z ]/g,"").trim();
const duoRank = {}; { let dr=0;
  for (const line of fs.readFileSync("docs/sources/duolingo-spanish-vocab.txt","utf8").split("\n")) {
    if (line.startsWith("#") || !line.trim()) continue;
    line.split(" | ").forEach(p=>{ const en=(p.split("=")[1]||"").trim(); if(en){ dr++; const n=normEn(en); if(n && !(n in duoRank)) duoRank[n]=dr; } });
  } }
const unitPhase = {}; FREQUENCY.forEach((p,pi)=>p.units.forEach(u=>unitPhase[u.id]=pi+1));
const PHASE_GOAL = {1:5, 2:3, 3:2, 4:1};
const goalOf = (w, uid) => {
  let g = PHASE_GOAL[unitPhase[uid]] || 1;
  String(eng[w]||"").split("/").forEach(s=>{ const r=duoRank[normEn(s)]; if(r){ const dg = r<=40?5 : r<=100?3 : 2; if(dg>g) g=dg; } });
  return g;
};

let reinf = `# Phrase reinforcement — by unit's new words (with goal)\n\n`;
reinf += `_Each new word gets a **goal** = how many *later* phrases should reuse it, weighted by frequency (Phase 1 core words → 5; Phase 4 themes → 1; bumped up if it's an early Duolingo concept). **Status**: ✓ = goal met · **+N** = needs N more reuses. The recombination pass targets the **+N** words._\n`;
let totNew=0, totCov=0, totMet=0, deficit=0;
for (const u of newWordsByUnit){
  if (!u.words.length) continue;
  reinf += `\n### ${u.name}  _(${u.words.length} new words)_\n\n| New word | English | In unit | Goal | Reused later | Status |\n|---|---|:--:|--:|--:|:--|\n`;
  const rows = u.words.map(w=>{
    const here = countIn(w, ux=>ux===u.uidx) > 0;
    const later = countIn(w, ux=>ux>u.uidx);
    const goal = goalOf(w, u.id);
    const need = Math.max(0, goal-later);
    totNew++; if(here)totCov++; if(need===0)totMet++; deficit+=need;
    return {w, here, later, goal, need};
  }).sort((a,b)=>b.need-a.need || b.goal-a.goal);
  rows.forEach(r=>reinf+=`| ${r.w} | ${eng[r.w]||""} | ${r.here?"✓":"✗"} | ${r.goal} | ${r.later} | ${r.need?("**+"+r.need+"**"):"✓"} |\n`);
}
reinf = reinf.replace("(with goal)\n", `(with goal)\n\n_${totNew} new words · ${totMet} meet their reuse goal · ${totNew-totMet} fall short by a total of **${deficit}** reuses (the recombination backlog)._\n`);
fs.writeFileSync("docs/phrase-reinforcement.md", reinf);

console.log(`prompts: ${data.length} · new words: ${totNew} · meet goal: ${totMet}/${totNew} · total deficit: ${deficit}`);
