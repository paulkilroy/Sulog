/* Add the approved Duolingo-gap words to the Frequency curriculum: append cards to
   cards.js (end, ids stable) + write added-words.js for frequency.js to slot into
   each unit's ① Words. Run once: node tools/add-words.mjs */
import fs from "fs";
// unit -> [waray, english, respelling]  (deck chosen per unit)
const DATA={
  u4: {deck:"ppl", words:[["kuya","older brother","KOO-yah"],["ate","older sister","AH-teh"],["tiya","aunt","TEE-yah"],["tiyo","uncle","TEE-yo"]]},
  u31:{deck:"meals", words:[["kape","coffee","kah-PEH"],["gatas","milk","GAH-tas"],["tinapay","bread","tee-NAH-pigh"],["sorbetes","ice cream","sor-BEH-tes"],["duga","juice","DOO-gah"],["kahel","orange","kah-HEL"],["pinya","pineapple","PEEN-yah"],["pakwan","watermelon","PAK-wan"]]},
  u21:{deck:"verbs", words:[["pitaka","wallet","pee-TAH-kah"],["relo","watch","REH-lo"],["bag","bag","bag"],["kalo","cap / hat","KAH-lo"]]},
  u24:{deck:"direk", words:[["hotel","hotel","ho-TEL"],["barangay","neighborhood","bah-rahng-GIGH"],["eskwelahan","school","es-kweh-LAH-han"]]},
  u5: {deck:"ppl", words:[["arte","art","AR-teh"],["musika","music","moo-SEE-kah"]]},
  u1: {deck:"greet", words:[["alayon","please","ah-LAH-yon"]]},
};
let cardsTxt=fs.readFileSync("src/courses/waray/cards.js","utf8");
const rows=[]; const byUnit={};
for(const u of Object.keys(DATA)){
  byUnit[u]=[];
  for(const [w,e,say] of DATA[u].words){
    if(new RegExp(`", "${w}"`).test(cardsTxt)){ console.log("skip existing:",w); continue; }
    rows.push(`  ["${DATA[u].deck}", "${w}", "${e}", "Duolingo gap · verify", "${say}"],`);
    byUnit[u].push(w);
  }
}
const marker="\n];"; const idx=cardsTxt.indexOf(marker);
cardsTxt=cardsTxt.slice(0,idx)+`\n\n  // ===== added from Duolingo gap list (common words we lacked) =====\n${rows.join("\n")}`+cardsTxt.slice(idx);
fs.writeFileSync("src/courses/waray/cards.js",cardsTxt);
fs.writeFileSync("src/courses/waray/added-words.js",
`/* Words added from the Duolingo gap list, per unit (also cards in cards.js).\n   frequency.js slots these into each unit's ① Words. */\nexport const ADDED_WORDS = ${JSON.stringify(byUnit)};\n`);
console.log(`added ${rows.length} cards into ${Object.keys(byUnit).filter(u=>byUnit[u].length).length} units`);
