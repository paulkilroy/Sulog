import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Volume2, Mic, Check, X, ArrowLeft, Waves, Sun, Flame, BookOpen,
  Plus, RotateCcw, ChevronRight, Star, Ear, Pencil, List, Home,
  Trophy, Square, Play, Sparkles, AlertCircle, Target, Layers,
  Cloud, Download, Upload, FolderOpen,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 *  Aplikasyon han Waray  —  "Sulog"  (the tide)
 *  A personal review app built from Paul's Preply lesson materials.
 *  Mastery rises like the tide on the Zumarraga Channel.
 * ------------------------------------------------------------------ */

// Build stamp, injected by build.sh via esbuild --define:__BUILD__ as "ISO|hash".
// Falls back to "dev" when bundled without the define (typeof on an undeclared
// name is safe). buildLabel() renders the timestamp in the viewer's local time.
const BUILD_STAMP = typeof __BUILD__ !== "undefined" ? __BUILD__ : "dev";
function buildLabel() {
  const [iso, hash] = String(BUILD_STAMP).split("|");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return BUILD_STAMP;
  return d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) + (hash ? " · " + hash : "");
}

/* ---------- seed vocabulary (from the WarayLessons sheet + teacher docx) ---------- */
/* a few obvious OCR typos in the sheet were corrected against the teacher's
   docx files: yama→yana(now), "mapaso him euro"→"mapaso hin duro",
   mahingin→mahangin, mapaSO→mapaso. Flagged in chat. */

const SEED = [
  // ---- Greetings & survival (from teacher dialogues + common usage) ----
  ["greet", "Maupay nga aga", "Good morning", "", "mah-OO-pigh ngah AH-gah"],
  ["greet", "Maupay nga kulop", "Good afternoon", "", "mah-OO-pigh ngah KOO-lop"],
  ["greet", "Maupay nga gab-i", "Good evening / Good night", "the - in gab-i is a glottal stop", "mah-OO-pigh ngah gahb-EE"],
  ["greet", "Kumusta ka?", "How are you?", "", "koo-moos-TAH kah"],
  ["greet", "Maupay man", "I'm good / fine (so far)", "", "mah-OO-pigh mahn"],
  ["greet", "Salamat", "Thank you", "", "sah-LAH-mat"],
  ["greet", "Damo nga salamat", "Thank you very much", "", "DAH-mo ngah sah-LAH-mat"],
  ["greet", "Oo", "Yes", "", "AW-aw"],
  ["greet", "Diri", "No / not", "used for present & future answers", "DEE-ree"],
  ["greet", "Waray", "None / nothing", "also 'no' for past-tense answers; and the language's name", "wah-RIGH"],
  ["greet", "Waray pa", "Not yet", "", "wah-RIGH pah"],
  ["greet", "Anay", "Wait / just a moment", "", "AH-nigh"],
  ["greet", "Pasensya na", "Sorry / excuse me", "", "pah-SEN-syah nah"],
  ["greet", "Sige", "Okay / go ahead", "", "SEE-geh"],
  ["greet", "Adi", "Here it is", "", "AH-dee"],
  ["greet", "Pwede", "Can / may (I)", "", "PWEH-deh"],
  ["greet", "Naintindihan ko", "I understand", "", "nah-een-tin-dee-HAHN ko"],
  ["greet", "Diri ako maaram", "I don't know", "", "DEE-ree ah-KAW mah-AH-ram"],
  ["greet", "Karuyag ko / Gusto ko", "I want / I like", "", "kah-ROO-yag ko"],

  // ---- Week 1 — foundations ----
  ["week1", "Nakikit-an mo?", "Can you see it?", "", "nah-kee-KEET-an mo"],
  ["week1", "Oo, nakikit-an ko", "Yes, I can see it", "", "AW-aw nah-kee-KEET-an ko"],
  ["week1", "Klaro?", "Is it clear?", "", "KLAH-ro"],
  ["week1", "Oo, klaro", "Yes, it's clear", "", "AW-aw KLAH-ro"],
  ["week1", "Diri klaro", "No, it's not clear", "", "DEE-ree KLAH-ro"],
  ["week1", "Naintindihan nimo?", "Do you understand?", "", "nah-een-tin-dee-HAHN NEE-mo"],
  ["week1", "Oo, naintindihan ko", "Yes, I understand", "", "AW-aw nah-een-tin-dee-HAHN ko"],
  ["week1", "Taga diin ka?", "Where are you from?", "", "TAH-gah dee-EEN kah"],
  ["week1", "Hain ka?", "Where are you?", "", "HAH-een kah"],
  ["week1", "ako", "I", "subject pronoun", "ah-KAW"],
  ["week1", "ikaw / ka", "you", "ka is the short form", "ee-KOW"],
  ["week1", "kita", "we (inclusive)", "includes the person you're talking to", "kee-TAH"],
  ["week1", "kami", "we (exclusive)", "excludes the listener", "kah-MEE"],
  ["week1", "hiya", "he / she", "no gender marking", "HEE-yah"],
  ["week1", "kamo", "you / y'all", "plural you", "kah-MAW"],
  ["week1", "hira", "they", "", "HEE-rah"],
  ["week1", "Kaon kita", "Let's eat", "", "KAH-on kee-TAH"],
  ["week1", "Kumaon kita", "We ate", "pangaon = food; kumaon = the act of eating", "koo-MAH-on kee-TAH"],
  ["week1", "Mahusay ka", "You are beautiful", "", "mah-hoo-SIGH kah"],
  ["week1", "Maraksot ka", "You are ugly", "", "mah-RAK-sot kah"],
  ["week1", "Ano imo gin-hihimo?", "What are you doing?", "", "AH-no EE-mo gin-hee-HEE-mo"],
  ["week1", "Ano imo gin-kakaon?", "What are you eating?", "", "AH-no EE-mo gin-kah-KAH-on"],
  ["week1", "tatay", "father", "", "TAH-tigh"],
  ["week1", "nanay", "mother", "", "NAH-nigh"],
  ["week1", "Amerikano", "American (male)", "", "ah-meh-ree-KAH-no"],
  ["week1", "turista", "tourist", "", "too-REES-tah"],
  ["week1", "babaye", "woman", "syllables: ba-ba-ye", "bah-BAH-yeh"],
  ["week1", "malipay", "happy", "", "mah-LEE-pigh"],
  ["week1", "buoton", "nice / kind / good", "also written bouton", "boo-OH-ton"],
  ["week1", "makusog", "strong", "", "mah-KOO-sog"],
  ["week1", "riko", "rich", "", "REE-ko"],
  ["week1", "lalaki", "man", "", "lah-LAH-kee"],
  ["week1", "asawa", "wife / spouse", "", "ah-SAH-wah"],
  ["week1", "mapaso", "hot", "", "mah-PAH-so"],
  ["week1", "bisita", "visitor", "", "bee-SEE-tah"],
  ["week1", "Pilipino", "Filipino (male)", "", "pee-lee-PEE-no"],
  ["week1", "gwapo", "handsome", "", "GWAH-po"],
  ["week1", "sangkay", "friend", "", "sahng-KIGH"],
  ["week1", "hataas", "tall / long", "", "hah-TAH-as"],
  ["week1", "matambok", "fat", "", "mah-TAM-bok"],
  ["week1", "estudyante", "student", "", "es-tood-YAHN-teh"],
  ["week1", "maestro / maestra", "teacher (m / f)", "", "mah-ES-tro"],
  ["week1", "Estudyante kami", "We (excl.) are students", "", "es-tood-YAHN-teh kah-MEE"],
  ["week1", "Pilipino hira", "They are Filipinos", "", "pee-lee-PEE-no HEE-rah"],
  ["week1", "Babaye ka", "You are a woman", "", "bah-BAH-yeh kah"],
  ["week1", "Amerikano ako", "I am American", "", "ah-meh-ree-KAH-no ah-KAW"],
  ["week1", "Makusog ka", "You are strong", "", "mah-KOO-sog kah"],
  ["week1", "Turista hiya", "She is a tourist", "", "too-REES-tah HEE-yah"],
  ["week1", "Maestra kami", "We (excl.) are teachers", "", "mah-ES-trah kah-MEE"],
  ["week1", "Makusog hiya", "He is strong", "", "mah-KOO-sog HEE-yah"],
  ["week1", "Bisita hira", "They are visitors", "", "bee-SEE-tah HEE-rah"],
  ["week1", "Nanay ako", "I am a mother", "", "NAH-nigh ah-KAW"],
  ["week1", "Hinay-hinay la", "Just slowly, please", "", "HEE-nigh HEE-nigh lah"],
  ["week1", "Pakpak anay", "Clap first", "", "PAK-pak AH-nigh"],
  ["week1", "Makarit ka", "You are excellent", "", "mah-KAH-rit kah"],
  ["week1", "kay", "because", "", "kigh"],

  // ---- Verbs, objects & time ----
  ["verbs", "Mag-aano ka?", "What are you going to do?", "", "mahg-AH-ah-no kah"],
  ["verbs", "baktas", "to walk", "magbaktas = to walk/go on foot", "BAK-tas"],
  ["verbs", "karsada", "road", "", "kar-SAH-dah"],
  ["verbs", "bukid", "mountain", "", "BOO-kid"],
  ["verbs", "laba", "to wash (clothes)", "", "LAH-bah"],
  ["verbs", "bado", "clothes", "", "BAH-do"],
  ["verbs", "panyo", "handkerchief", "", "PAHN-yo"],
  ["verbs", "mantel", "tablecloth", "", "man-TEL"],
  ["verbs", "biray", "curtain", "", "bee-RIGH"],
  ["verbs", "sapatos", "shoes", "", "sah-PAH-tos"],
  ["verbs", "taklap", "blanket", "", "TAK-lap"],
  ["verbs", "hugas", "to wash (dishes)", "", "HOO-gas"],
  ["verbs", "tinidor", "fork", "", "tee-nee-DOR"],
  ["verbs", "kutsara", "spoon", "", "koot-SAH-rah"],
  ["verbs", "pinggan", "plate", "", "PING-gan"],
  ["verbs", "baso", "glass", "", "BAH-so"],
  ["verbs", "sarakyan", "vehicle", "", "sah-RAK-yan"],
  ["verbs", "motor", "motorcycle", "", "mo-TOR"],
  ["verbs", "limpyu", "to clean", "", "LIM-pyoo"],
  ["verbs", "awto", "car / auto", "", "OW-to"],
  ["verbs", "kwarto", "room", "", "KWAR-to"],
  ["verbs", "banyo", "bathroom", "", "BAHN-yo"],
  ["verbs", "balay", "house", "", "bah-LIGH"],
  ["verbs", "kusina", "kitchen", "", "koo-SEE-nah"],
  ["verbs", "luto", "to cook", "", "LOO-to"],
  ["verbs", "isda", "fish", "", "ees-DAH"],
  ["verbs", "manok", "chicken", "", "mah-NOK"],
  ["verbs", "karne", "meat", "", "KAR-neh"],
  ["verbs", "utan", "vegetable", "", "OO-tan"],
  ["verbs", "saribo", "to water plants", "", "sah-REE-bo"],
  ["verbs", "tanom", "plant", "", "TAH-nom"],
  ["verbs", "lukot", "to fold (clothes)", "", "LOO-kot"],
  ["verbs", "tago", "to hide", "", "TAH-go"],
  ["verbs", "andam", "to get ready", "", "AN-dam"],
  ["verbs", "basa", "to read", "", "BAH-sah"],
  ["verbs", "sudlay", "to comb", "", "sood-LIGH"],
  ["verbs", "sayaw", "to dance", "", "sah-YOW"],
  ["verbs", "maneho", "to drive", "", "mah-NEH-ho"],
  ["verbs", "Mag- + verb", "future tense (actor focus)", "e.g. magbabaktas = will walk", "mahg"],
  ["verbs", "Nag- + verb", "present / past tense", "naglalaba = washing; naglaba = washed", "nahg"],
  ["verbs", "Pag- + verb", "command form", "paglaba = wash!", "pahg"],
  ["verbs", "yana", "now", "", "YAH-nah"],
  ["verbs", "niyan", "later", "", "nee-YAN"],
  ["verbs", "buwas", "tomorrow", "", "BOO-was"],
  ["verbs", "kakulop", "yesterday", "", "kah-KOO-lop"],
  ["verbs", "kanina han aga", "earlier this morning", "", "kah-NEE-nah hahn AH-gah"],
  ["verbs", "yana nga aga", "this morning (now)", "", "YAH-nah ngah AH-gah"],
  ["verbs", "kulop", "afternoon", "", "KOO-lop"],
  ["verbs", "yana nga gab-i", "tonight", "", "YAH-nah ngah gahb-EE"],
  ["verbs", "kagab-i", "last night", "", "kah-gahb-EE"],
  ["verbs", "kanina", "a little while ago", "", "kah-NEE-nah"],
  ["verbs", "didi", "here", "", "DEE-dee"],
  ["verbs", "dida", "there", "", "DEE-dah"],
  ["verbs", "Ano it oras dida?", "What time is it there?", "", "AH-no eet OH-ras DEE-dah"],
  ["verbs", "Alas singko didi", "It's 5 o'clock here", "Spanish-style clock times", "AH-las SEENG-ko DEE-dee"],
  ["verbs", "uran / mauran", "rain / rainy", "", "OO-ran"],
  ["verbs", "mapaso hin duro", "very hot", "", "mah-PAH-so heen DOO-ro"],
  ["verbs", "matugnaw", "cold", "", "mah-TOOG-now"],
  ["verbs", "sirak / masirak", "sun ray / sunny", "", "SEE-rak"],
  ["verbs", "dampog / madampog", "clouds / cloudy", "", "DAM-pog"],
  ["verbs", "hangin / mahangin", "wind / windy", "", "HAH-ngin"],
  ["verbs", "may bagyo", "there is a storm", "", "migh BAHG-yo"],
  ["verbs", "Kumusta it panahon?", "How is the weather?", "", "koo-moos-TAH eet pah-nah-HON"],

  // ---- Phrases — invitations (Sheet 3) ----
  ["invite", "imbitasyon", "invitation", "", "im-bee-tah-SYON"],
  ["invite", "may / mayda", "there is / I have", "", "migh / MIGH-dah"],
  ["invite", "gin-iimbita", "being invited", "", "gin-ee-im-BEE-tah"],
  ["invite", "May libre ka ba nga oras hit Sabado?", "Do you have free time on Saturday?", "", "migh LEE-breh kah bah ngah OH-ras heet sah-BAH-do"],
  ["invite", "Ano it mayda?", "What's going on?", "", "AH-no eet MIGH-dah"],
  ["invite", "Nag-arog ako", "I prepared food", "", "nag-AH-rog ah-KAW"],
  ["invite", "Mayda pangaon ha balay", "There is food at home", "", "MIGH-dah pah-NGAH-on hah bah-LIGH"],
  ["invite", "Ano nga oras?", "What time?", "", "AH-no ngah OH-ras"],
  ["invite", "Alas sais ha gab-i", "At 6 in the evening", "", "AH-las SAH-ees hah gahb-EE"],
  ["invite", "Poydi ko ba ig-upod hi Rey?", "Can I bring Rey along?", "", "POY-dee ko bah eeg-OO-pod hee RAY"],
  ["invite", "ig-upod", "to bring along", "", "eeg-OO-pod"],
  ["invite", "akon patod", "my cousin", "", "AH-kon PAH-tod"],
  ["invite", "makadto", "will go to", "", "mah-KAD-to"],
  ["invite", "Siyempre, poydi", "Of course, you can", "", "see-YEM-preh POY-dee"],
  ["invite", "Maghuhulat ako ha iyo", "I will wait for you all", "", "mag-hoo-HOO-lat ah-KAW hah EE-yo"],
  ["invite", "hulat", "to wait", "", "HOO-lat"],
  ["invite", "Sigurado, makadto kami", "Sure, we'll come", "", "see-goo-RAH-do mah-KAD-to kah-MEE"],
  ["invite", "Sige, magkita kita hit Sabado", "Okay, let's meet on Saturday", "", "SEE-geh mag-KEE-tah kee-TAH heet sah-BAH-do"],
  ["invite", "magkita", "to meet", "", "mag-KEE-tah"],

  // ---- appended: standalone adjectives (kept at the end so existing card ids,
  //      which are positional c{index}, don't shift and break saved progress) ----
  ["week1", "mahusay", "beautiful", "", "mah-hoo-SIGH"],
  ["week1", "maraksot", "ugly", "", "mah-RAK-sot"],
  ["week1", "makarit", "excellent", "", "mah-KAH-rit"],

  // ===== Out & About — Directions (from Pagpakiana…Direksiyon) =====
  ["direk", "bangko", "bank", "", "BANG-ko"],
  ["direk", "botika", "pharmacy", "", "bo-TEE-kah"],
  ["direk", "ospital", "hospital", "", "os-pee-TAL"],
  ["direk", "istasyon hit pulis", "police station", "", "ees-tah-SYON heet poo-LEES"],
  ["direk", "munisipyo", "town / city hall", "", "moo-nee-SEEP-yo"],
  ["direk", "paradahan", "terminal", "where vehicles wait", "pah-rah-DAH-han"],
  ["direk", "eskina", "corner", "", "es-KEE-nah"],
  ["direk", "atbang", "across / in front of", "", "AT-bang"],
  ["direk", "dinhi", "here", "like didi", "DEEN-hee"],
  ["direk", "harani", "near", "", "hah-RAH-nee"],
  ["direk", "harayo", "far", "", "hah-RAH-yo"],
  ["direk", "bus", "bus", "", "boos"],
  ["direk", "dyip", "jeepney", "", "jeep"],
  ["direk", "taxi", "taxi", "", "TAK-see"],
  ["direk", "pedicab", "pedicab", "bicycle with sidecar", "PEH-dee-kab"],
  ["direk", "traysikol", "tricycle", "motorbike with sidecar", "trigh-SEE-kol"],
  ["direk", "Pwede magpakiana?", "May I ask a question?", "", "PWEH-deh mag-pah-kee-AH-na"],
  ["direk", "Hain it bangko?", "Where is the bank?", "hain = where", "HAH-een eet BANG-ko"],
  ["direk", "Harayo ba tikang dinhi?", "Is it far from here?", "", "hah-RAH-yo bah TEE-kang DEEN-hee"],
  ["direk", "Waray sapayan", "You're welcome", "lit. no problem", "wah-RIGH sah-PAH-yan"],
  ["direk", "Harani la", "It's just near", "", "hah-RAH-nee lah"],
  ["direk", "Pwede baktason", "It can be walked", "", "PWEH-deh bak-TAH-son"],
  ["direk", "Ika-upat nga eskina tikang dinhi", "The 4th corner from here", "", "ee-kah-OO-pat ngah es-KEE-nah TEE-kang DEEN-hee"],
  ["direk", "Pagbus nala", "Just take the bus", "", "pag-BOOS nah-lah"],

  // ===== Out & About — Shopping (from Useful_Words_When_Buying_Things) =====
  ["shop", "tindahan", "store", "", "teen-DAH-han"],
  ["shop", "tindera", "vendor", "shopkeeper", "teen-DEH-rah"],
  ["shop", "kahera", "cashier", "", "kah-HEH-rah"],
  ["shop", "kwarta", "money", "", "KWAR-tah"],
  ["shop", "sukli", "change", "money returned", "sook-LEE"],
  ["shop", "sinsilyo", "coins", "", "seen-SEEL-yo"],
  ["shop", "barato", "cheap", "", "bah-RAH-to"],
  ["shop", "bulad", "dried fish", "", "BOO-lad"],
  ["shop", "tinapa", "smoked fish", "", "tee-NAH-pah"],
  ["shop", "palit", "to buy", "papaliton = will buy", "PAH-leet"],
  ["shop", "ginbibiling", "looking for", "from biling", "gin-bee-BEE-ling"],
  ["shop", "karuyag", "want / like", "also gusto", "kah-ROO-yag"],
  ["shop", "baraydan", "amount to pay", "", "bah-RIGH-dan"],
  ["shop", "bulig", "to help", "buligan = help someone", "BOO-leeg"],
  ["shop", "Ano ini?", "What is this?", "", "AH-no ee-NEE"],
  ["shop", "Tagpira ini?", "How much is this?", "", "tag-PEE-rah ee-NEE"],
  ["shop", "Hain tungod it kahera?", "Where is the cashier?", "hain tungod = where located", "HAH-een TOO-ngod eet kah-HEH-rah"],
  ["shop", "May tinapa kamo dinhi?", "Do you have smoked fish here?", "", "migh tee-NAH-pah kah-MAW DEEN-hee"],
  ["shop", "Ini it akon papaliton", "This is what I'll buy", "", "ee-NEE eet AH-kon pah-pah-LEE-ton"],
  ["shop", "Pwede mo ako buligan?", "Can you help me?", "", "PWEH-deh mo ah-KAW boo-LEE-gan"],
  ["shop", "Hain it mas barato?", "Which one is cheaper?", "", "HAH-een eet mahs bah-RAH-to"],
  ["shop", "Adi it imo sukli", "Here is your change", "", "AH-dee eet EE-mo sook-LEE"],
  ["shop", "Pira it akon baraydan?", "How much do I pay?", "", "PEE-rah eet AH-kon bah-RIGH-dan"],

  // ===== Out & About — At the airport (from Ha_Airport) =====
  ["airport", "eroplano", "airplane", "", "eh-ro-PLAH-no"],
  ["airport", "tiket", "ticket", "", "TEE-ket"],
  ["airport", "bagahe", "baggage", "", "bah-GAH-heh"],
  ["airport", "gate", "gate", "", "gayt"],
  ["airport", "kostums", "customs", "", "KOS-tooms"],
  ["airport", "pasaporte", "passport", "", "pah-sah-POR-teh"],
  ["airport", "pasahero", "passenger", "", "pah-sah-HEH-ro"],
  ["airport", "Pakitaa ako hit imo tiket", "Please show me your ticket", "pakitaa = let me see", "pah-kee-tah-AH ah-KAW heet EE-mo TEE-ket"],
  ["airport", "Pakitaa ako hit imo pasaporte", "Please show me your passport", "", "pah-kee-tah-AH ah-KAW heet EE-mo pah-sah-POR-teh"],
  ["airport", "Malupad it eroplano alas nuybe", "The plane leaves at 9", "malupad = will fly", "mah-LOO-pad eet eh-ro-PLAH-no AH-las NOOY-beh"],
  ["airport", "Deritso ha gate numero dos", "Straight to gate number 2", "", "deh-REET-so hah gayt NOO-meh-ro dos"],
  ["airport", "Enjoy hit imo biyahe", "Enjoy your trip", "", "en-JOY heet EE-mo bee-YAH-heh"],

  // ===== Out & About — A day trip (from PPERFECT_pamasyada_Kita) =====
  ["daytrip", "pamasyada", "outing / stroll", "sightseeing", "pah-mas-YAH-dah"],
  ["daytrip", "tulay", "bridge", "", "too-LIGH"],
  ["daytrip", "lugar", "place", "", "loo-GAR"],
  ["daytrip", "isla", "island", "", "EES-lah"],
  ["daytrip", "museo", "museum", "", "moo-SEH-o"],
  ["daytrip", "pumpboat", "pump boat", "motorized outrigger", "POMP-bot"],
  ["daytrip", "makaradlok", "scary", "", "mah-kah-RAD-lok"],
  ["daytrip", "mamasyada", "to go out / stroll", "", "mah-mas-YAH-dah"],
  ["daytrip", "kumita", "to see / visit", "", "koo-MEE-tah"],
  ["daytrip", "maupod", "to come along", "", "mah-OO-pod"],
  ["daytrip", "huram", "to borrow", "", "HOO-ram"],
  ["daytrip", "Pamasyada kita", "Let's go out", "", "pah-mas-YAH-dah kee-TAH"],
  ["daytrip", "Mamamasyada ako buwas", "I'll go out tomorrow", "", "mah-mah-mas-YAH-dah ah-KAW BOO-was"],
  ["daytrip", "Karuyag ko kumita", "I want to see it", "", "kah-ROO-yag ko koo-MEE-tah"],
  ["daytrip", "Maupod ka buwas?", "Will you come along tomorrow?", "", "mah-OO-pod kah BOO-was"],
  ["daytrip", "Karuyag ko kumita hit San Juanico", "I want to see San Juanico", "", "kah-ROO-yag ko koo-MEE-tah heet san-hwah-NEE-ko"],
  ["daytrip", "Pwede kita magburubaktas", "We can walk around there", "", "PWEH-deh kee-TAH mag-boo-roo-BAK-tas"],
  ["daytrip", "Pagkita kita buwas", "Let's meet tomorrow", "", "pag-KEE-tah kee-TAH BOO-was"],
  ["daytrip", "Mahusay ngadto", "It's beautiful there", "", "mah-hoo-SIGH NGAD-to"],

  // ===== Daily Life — Meals & eating (from PPERFECT_pamasyada_Kita) =====
  ["meals", "pamahaw", "breakfast", "", "pah-MAH-how"],
  ["meals", "paniudto", "lunch", "", "pah-nee-OOD-to"],
  ["meals", "pangiklop", "dinner", "", "pah-NEEK-lop"],
  ["meals", "isnak", "snack", "", "EES-nak"],
  ["meals", "kan-on", "cooked rice", "", "KAN-on"],
  ["meals", "pagkaon", "food", "", "pag-KAH-on"],
  ["meals", "marasa", "delicious", "", "mah-RAH-sah"],
  ["meals", "gutom", "hungry", "", "GOO-tom"],
  ["meals", "Namahaw ka na?", "Have you had breakfast?", "", "nah-MAH-how kah nah"],
  ["meals", "Naniudto ka na?", "Have you had lunch?", "", "nah-nee-OOD-to kah nah"],
  ["meals", "Nangiklop ka na?", "Have you had dinner?", "", "nah-NEEK-lop kah nah"],
  ["meals", "Pamahaw kita", "Let's have breakfast", "", "pah-MAH-how kee-TAH"],
  ["meals", "Ano it paniudtuhon?", "What's for lunch?", "", "AH-no eet pah-nee-ood-TOO-hon"],
  ["meals", "May pagkaon didi", "There's food here", "", "migh pag-KAH-on DEE-dee"],
  ["meals", "Kaon anay", "Eat first", "", "KAH-on AH-nigh"],

  // ===== Daily Life — Cooking (from …Pagluto_hin_Adobo) =====
  ["cook", "lasona", "garlic", "", "lah-SO-nah"],
  ["cook", "sibuyas", "onion", "", "see-BOO-yas"],
  ["cook", "suoy", "vinegar", "", "SOO-oy"],
  ["cook", "toyo", "soy sauce", "", "TOH-yo"],
  ["cook", "tubig", "water", "", "TOO-beeg"],
  ["cook", "pamyenta", "pepper", "", "pam-YEN-tah"],
  ["cook", "asukar", "sugar", "", "ah-SOO-kar"],
  ["cook", "lutuon", "to cook (it)", "from luto", "loo-too-ON"],
  ["cook", "igbabad", "to marinate", "", "eeg-BAH-bad"],
  ["cook", "pakaladkara", "to boil (it)", "", "pah-kah-lad-KAH-rah"],
  ["cook", "panakot", "ingredients / spices", "", "pah-NAH-kot"],
  ["cook", "madali", "easy / quick", "", "mah-dah-LEE"],
  ["cook", "masayon", "easy / simple", "", "mah-SAH-yon"],
  ["cook", "makuri", "hard / difficult", "", "mah-KOO-ree"],
  ["cook", "Ano ini nga kaluto?", "What dish is this?", "", "AH-no ee-NEE ngah kah-LOO-to"],
  ["cook", "Adobo nga manok", "Chicken adobo", "", "ah-DO-bo ngah mah-NOK"],
  ["cook", "Makuri ba ini lutuon?", "Is this hard to cook?", "", "mah-KOO-ree bah ee-NEE loo-too-ON"],
  ["cook", "Madali la", "It's easy", "", "mah-dah-LEE lah"],
  ["cook", "Tutdui gad ako", "Please teach me", "", "toot-DOO-ee gad ah-KAW"],
  ["cook", "Ano it mga panakot?", "What are the ingredients?", "mga = manga (plural)", "AH-no eet mah-NGAH pah-NAH-kot"],

  // ===== Daily Life — When & travel (from PPERFECT_pamasyada_Kita) =====
  ["whentrav", "biyahe", "trip / travel", "", "bee-YAH-heh"],
  ["whentrav", "semana", "week", "", "seh-MAH-nah"],
  ["whentrav", "adlaw", "day", "", "AD-low"],
  ["whentrav", "maabot", "will arrive", "", "mah-AH-bot"],
  ["whentrav", "lumakat", "left / departed", "", "loo-MAH-kat"],
  ["whentrav", "san-o", "when", "", "SAN-o"],
  ["whentrav", "kakan-o", "when (past)", "", "kah-KAN-o"],
  ["whentrav", "Mabiyahe ako ha Pilipinas", "I'll travel to the Philippines", "", "mah-bee-YAH-heh ah-KAW hah pee-lee-PEE-nas"],
  ["whentrav", "Ano ka nga adlaw maabot?", "What day will you arrive?", "", "AH-no kah ngah AD-low mah-AH-bot"],
  ["whentrav", "Kakan-o ka umabot?", "When did you arrive?", "", "kah-KAN-o kah oo-MAH-bot"],
  ["whentrav", "Hit maabot nga duha ka semana", "In the coming two weeks", "duha = two", "heet mah-AH-bot ngah DOO-hah kah seh-MAH-nah"],

  // ===== Basics grammar — Describing sentences (from …Adobo doc) =====
  ["gram", "bata", "child", "", "BAH-tah"],
  ["gram", "uyab", "girlfriend / boyfriend", "", "OO-yab"],
  ["gram", "mabaho", "smelly", "", "mah-BAH-ho"],
  ["gram", "an", "the (completed / past)", "marks the subject", "ahn"],
  ["gram", "it", "the (now / general)", "marks the subject", "eet"],
  ["gram", "Gwapo it bata", "The child is handsome", "it = the (now)", "GWAH-po eet BAH-tah"],
  ["gram", "Gwapo an bata", "The child was handsome", "an = the (past)", "GWAH-po ahn BAH-tah"],
  ["gram", "Hataas it akon uyab", "My girlfriend is tall", "", "hah-TAH-as eet AH-kon OO-yab"],
  ["gram", "Marasa it adobo", "The adobo is tasty", "", "mah-RAH-sah eet ah-DO-bo"],
  ["gram", "Mabaho it jeep", "The jeepney is smelly", "", "mah-BAH-ho eet jeep"],

  // ===== Basics grammar — Verbs in action (Mag/Nag, from …Adobo doc) =====
  ["gram", "Magluluto it bata", "The child will cook", "future", "mag-loo-LOO-to eet BAH-tah"],
  ["gram", "Nagluluto it bata", "The child is cooking", "present", "nag-loo-LOO-to eet BAH-tah"],
  ["gram", "Nagluto an bata", "The child cooked", "past", "nag-LOO-to ahn BAH-tah"],

  // ===== Numbers, Days & Colors (from Wikivoyage Waray phrasebook) =====
  ["num", "usa", "one", "", "oo-SAH"],
  ["num", "duha", "two", "", "doo-HAH"],
  ["num", "tulo", "three", "", "too-LO"],
  ["num", "upat", "four", "", "oo-PAT"],
  ["num", "lima", "five", "", "lee-MAH"],
  ["num", "unom", "six", "", "oo-NOM"],
  ["num", "pito", "seven", "", "pee-TO"],
  ["num", "walo", "eight", "", "wah-LO"],
  ["num", "siyam", "nine", "", "see-YAM"],
  ["num", "napulo", "ten", "", "nah-poo-LO"],
  ["num", "karuhaan", "twenty", "", "kah-roo-HAH-an"],
  ["num", "usa kagatos", "one hundred", "", "oo-SAH kah-GAH-tos"],

  ["cal", "Lunes", "Monday", "", "LOO-nes"],
  ["cal", "Martes", "Tuesday", "", "MAR-tes"],
  ["cal", "Miyerkoles", "Wednesday", "", "mee-YER-ko-les"],
  ["cal", "Huwebes", "Thursday", "", "hoo-WEH-bes"],
  ["cal", "Biyernes", "Friday", "", "bee-YER-nes"],
  ["cal", "Sabado", "Saturday", "", "SAH-bah-do"],
  ["cal", "Dominggo", "Sunday", "", "do-MEENG-go"],
  ["cal", "Enero", "January", "", "eh-NEH-ro"],
  ["cal", "Pebrero", "February", "", "peb-REH-ro"],
  ["cal", "Marso", "March", "", "MAR-so"],
  ["cal", "Abril", "April", "", "ahb-REEL"],
  ["cal", "Mayo", "May", "", "MAH-yo"],
  ["cal", "Hunyo", "June", "", "HOON-yo"],
  ["cal", "Hulyo", "July", "", "HOOL-yo"],
  ["cal", "Agosto", "August", "", "ah-GOS-to"],
  ["cal", "Setyembre", "September", "", "set-YEM-breh"],
  ["cal", "Oktubre", "October", "", "ok-TOO-breh"],
  ["cal", "Nobyembre", "November", "", "nob-YEM-breh"],
  ["cal", "Disyembre", "December", "", "dis-YEM-breh"],

  ["color", "itom", "black", "", "EE-tom"],
  ["color", "busag", "white", "", "BOO-sag"],
  ["color", "pula", "red", "", "POO-lah"],
  ["color", "asul", "blue", "", "ah-SOOL"],
  ["color", "darag", "yellow", "", "DAH-rag"],
  ["color", "berde", "green", "", "BER-deh"],

  ["essent", "Waray ako makabaro", "I don't understand", "", "wah-RIGH ah-KAW mah-kah-BAH-ro"],
  ["essent", "Hain iton kasilyas?", "Where is the toilet?", "", "HAH-een EE-ton kah-SEEL-yas"],
  ["essent", "Buligi daw ako", "Please help me", "", "boo-LEE-gee dow ah-KAW"],
  ["essent", "Pasaylo-a ako", "Excuse me / sorry", "", "pah-sigh-LO-ah ah-KAW"],
  ["essent", "Sige, sunod na la", "Goodbye (see you next time)", "", "SEE-geh SOO-nod nah lah"],

  // ===== Building Blocks — possessives II-class (Peace Corps L4) =====
  ["poss", "nakon", "my", "short form: ko", "NAH-kon"],
  ["poss", "ko", "my (short)", "", "ko"],
  ["poss", "nimo", "your", "short form: mo", "NEE-mo"],
  ["poss", "niya", "his / her", "", "nee-YAH"],
  ["poss", "naton", "our (incl)", "", "NAH-ton"],
  ["poss", "namon", "our (excl)", "", "NAH-mon"],
  ["poss", "niyo", "your (pl)", "", "NEE-yo"],
  ["poss", "nira", "their", "", "NEE-rah"],
  ["poss", "libro nakon", "my book", "", "LEE-bro NAH-kon"],
  ["poss", "lapis nimo", "your pencil", "", "LAH-pees NEE-mo"],
  ["poss", "uyab niya", "his / her sweetheart", "", "OO-yab nee-YAH"],
  ["poss", "balay namon", "our house", "", "bah-LIGH NAH-mon"],
  // ===== Building Blocks — possessives III-class (Peace Corps L8) =====
  ["poss", "akon", "mine / my", "", "AH-kon"],
  ["poss", "imo", "yours / your", "", "EE-mo"],
  ["poss", "iya", "his / hers", "", "ee-YAH"],
  ["poss", "aton", "ours (incl)", "", "AH-ton"],
  ["poss", "amon", "ours (excl)", "", "AH-mon"],
  ["poss", "iyo", "yours (pl)", "", "EE-yo"],
  ["poss", "ira", "theirs", "", "EE-rah"],
  ["poss", "Akon ini", "This is mine", "", "AH-kon ee-NEE"],
  ["poss", "Akon ini nga balay", "This house is mine", "", "AH-kon ee-NEE ngah bah-LIGH"],
  ["poss", "ha akon", "to / for me", "", "hah AH-kon"],
  ["poss", "ha imo", "to / for you", "", "hah EE-mo"],
  ["poss", "ha iya", "to / for him / her", "", "hah ee-YAH"],

  // ===== Building Blocks — demonstratives (Peace Corps L3) =====
  ["demo", "ini", "this (near)", "", "ee-NEE"],
  ["demo", "iton", "that (near you)", "", "ee-TON"],
  ["demo", "adto", "that (over there)", "", "AD-to"],
  ["demo", "kahoy", "tree", "", "KAH-hoy"],
  ["demo", "libro", "book", "", "LEE-bro"],
  ["demo", "ini nga babaye", "this woman", "", "ee-NEE ngah bah-BAH-yeh"],
  ["demo", "iton nga lalake", "that man", "", "ee-TON ngah lah-LAH-keh"],
  ["demo", "adto nga bata", "that child over there", "", "AD-to ngah BAH-tah"],
  ["demo", "Tubig ini", "This is water", "", "TOO-beeg ee-NEE"],
  ["demo", "Kahoy adto", "That's a tree over there", "", "KAH-hoy AD-to"],
  ["demo", "Mga libro ini", "These are books", "", "mah-NGAH LEE-bro ee-NEE"],

  // ===== Building Blocks — markers (Peace Corps L2 / L6) =====
  ["mark", "hi", "the (before a name)", "name marker", "hee"],
  ["mark", "hin", "a / some (object)", "object marker", "heen"],
  ["mark", "han", "of / the (past object)", "", "hahn"],
  ["mark", "ha", "to / at / in", "", "hah"],
  ["mark", "ngan", "and", "", "ngahn"],
  ["mark", "saging", "banana", "", "SAH-geeng"],
  ["mark", "Ako hi Peter", "I am Peter", "", "ah-KAW hee PEE-ter"],
  ["mark", "Hira Perla ngan Tessie", "They are Perla and Tessie", "", "HEE-rah PER-lah ngahn TES-see"],
  ["mark", "Mapalit ako hin saging", "I'll buy a banana", "", "mah-PAH-leet ah-KAW heen SAH-geeng"],
  ["mark", "Makadto ako ha balay", "I'll go to the house", "", "mah-KAD-to ah-KAW hah bah-LIGH"],

  // ===== Building Blocks — question words (Peace Corps L10-12 / L28) =====
  ["qword", "hin-o", "who", "", "heen-O"],
  ["qword", "ano", "what", "", "AH-no"],
  ["qword", "hain", "where", "", "HAH-een"],
  ["qword", "diin", "where (from / which)", "", "dee-EEN"],
  ["qword", "kay ano", "why", "", "kigh AH-no"],
  ["qword", "mapira", "how many", "", "mah-PEE-rah"],
  ["qword", "tagpira", "how much", "", "tag-PEE-rah"],
  ["qword", "ba", "makes a yes/no question", "particle", "bah"],
  ["qword", "Hin-o hiya?", "Who is she?", "", "heen-O hee-YAH"],
  ["qword", "Isda ba ini?", "Is this fish?", "", "ees-DAH bah ee-NEE"],
  ["qword", "Kay ano?", "Why?", "", "kigh AH-no"],
  ["qword", "Mapira?", "How many?", "", "mah-PEE-rah"],

  // ===== Building Blocks — particles & negation (Peace Corps L16 / L20) =====
  ["ptcl", "na", "already", "", "nah"],
  ["ptcl", "pa", "still / yet", "", "pah"],
  ["ptcl", "liwat", "also / too", "", "LEE-wat"],
  ["ptcl", "hin duro", "very / a lot", "", "heen DOO-ro"],
  ["ptcl", "Marasa hin duro", "Very delicious", "", "mah-RAH-sah heen DOO-ro"],
  ["ptcl", "Namahaw na ako", "I've already had breakfast", "", "nah-MAH-how nah ah-KAW"],
  ["ptcl", "Diri pa", "Not yet / still not", "", "DEE-ree pah"],
  ["ptcl", "Makusog liwat", "Strong too", "", "mah-KOO-sog LEE-wat"],

  // ===== Building Blocks — ma- verb tenses (Peace Corps L5 conjugation) =====
  ["gram", "makaon", "will eat", "future: ma-", "mah-KAH-on"],
  ["gram", "nakaon", "is eating", "present: na-", "nah-KAH-on"],
  ["gram", "kinmaon", "ate", "past: -inm-", "kin-MAH-on"],
  ["gram", "malakat", "will go", "future: ma-", "mah-LAH-kat"],
  ["gram", "nalakat", "is going", "present: na-", "nah-LAH-kat"],
  ["gram", "linmakat", "went", "past: -inm-", "lin-MAH-kat"],
  ["gram", "mapalit", "will buy", "future: ma-", "mah-PAH-leet"],
  ["gram", "napalit", "is buying", "present: na-", "nah-PAH-leet"],
  ["gram", "pinmalit", "bought", "past: -inm-", "pin-MAH-leet"],
  ["gram", "mainom", "will drink", "future: ma-", "mah-EE-nom"],
  ["gram", "nainom", "is drinking", "present: na-", "nah-EE-nom"],
  ["gram", "inminom", "drank", "past: -inm-", "een-MEE-nom"],

  // ===== Building Blocks — modals (Peace Corps L22) =====
  ["modal", "kinahanglan", "need to / must", "", "kee-nah-HANG-lan"],
  ["modal", "mahimo", "can / able to", "same as pwede", "mah-HEE-mo"],
  ["modal", "Ayaw", "don't (command)", "", "AH-yaw"],
  ["modal", "trabaho", "work", "magtrabaho = to work", "trah-BAH-ho"],
  ["modal", "Kinahanglan ako magtrabaho", "I need to work", "", "kee-nah-HANG-lan ah-KAW mag-trah-BAH-ho"],
  ["modal", "Pwede ka ba magdara?", "Can you bring it?", "", "PWEH-deh kah bah mag-DAH-rah"],
  ["modal", "Mahimo ako maupod", "I can come along", "", "mah-HEE-mo ah-KAW mah-OO-pod"],
  ["modal", "Ayaw pagkaon", "Don't eat", "", "AH-yaw pag-KAH-on"],

  // ===== Full curriculum: new vocab (course + Tramp/Zorc dictionary verified) =====
  // -- people & family --
  ["ppl", "anak", "child", "", "ah-NAK"],
  ["ppl", "apoy", "grandparent", "", "ah-POY"],
  ["ppl", "apo", "grandchild", "", "ah-PO"],
  ["ppl", "bugto", "sibling", "", "BOOG-to"],
  ["ppl", "tawo", "person", "", "TAH-wo"],
  ["ppl", "miyembro", "member", "", "mee-YEM-bro"],
  ["ppl", "ulitawo", "young man", "", "oo-lee-TAH-wo"],
  ["ppl", "daragita", "young woman", "", "dah-rah-GEE-tah"],
  ["ppl", "lagas", "old person", "", "LAH-gas"],
  ["ppl", "kaharani", "neighbor", "", "kah-hah-RAH-nee"],
  // -- jobs & roles --
  ["ppl", "nars", "nurse", "", "nars"],
  ["ppl", "panday", "carpenter", "", "PAN-digh"],
  ["ppl", "pastor", "pastor", "", "PAS-tor"],
  ["ppl", "misyonaryo", "missionary", "", "mees-yo-NAR-yo"],
  ["ppl", "abugado", "lawyer", "", "ah-boo-GAH-do"],
  ["ppl", "mangingisda", "fisherman", "", "mah-ngee-NGEES-dah"],
  ["ppl", "mag-uroma", "farmer", "", "mag-oo-ROH-mah"],
  ["ppl", "direktor", "director", "", "dee-rek-TOR"],
  ["ppl", "kapitan", "captain", "", "kah-pee-TAN"],
  ["ppl", "mayor", "mayor / boss", "", "MAH-yor"],
  ["ppl", "konsehal", "councilman", "", "kon-SEH-hal"],
  ["ppl", "negosyante", "businessman", "", "neh-gos-YAN-teh"],
  ["ppl", "sekretarya", "secretary", "", "sek-reh-TAR-yah"],
  ["ppl", "hardinero", "gardener", "", "har-dee-NEH-ro"],
  ["ppl", "tag-iya", "owner", "", "tag-ee-YAH"],
  ["ppl", "ninong", "godfather", "", "NEE-nong"],
  ["ppl", "pasyente", "patient", "", "pas-YEN-teh"],
  // -- the body --
  ["ppl", "lawas", "body", "", "LAH-was"],
  ["ppl", "nawong", "face", "", "nah-WONG"],
  ["ppl", "mata", "eye", "", "mah-TAH"],
  ["ppl", "ulo", "head", "", "OO-lo"],
  ["ppl", "kasingkasing", "heart", "", "kah-seeng-KAH-seeng"],
  // -- describing (adjectives) --
  ["week1", "daku", "big", "", "dah-KOO"],
  ["week1", "gutiay", "small", "", "goo-TEE-igh"],
  ["week1", "habubo", "short", "", "hah-boo-BO"],
  ["week1", "magasa", "thin", "", "mah-GAH-sah"],
  ["week1", "hubya", "lazy", "", "HOOB-yah"],
  ["week1", "kapoy", "tired", "", "kah-POY"],
  ["week1", "maraut", "bad", "", "mah-RAH-oot"],
  ["week1", "grabe", "serious", "", "GRAH-beh"],
  ["week1", "matidong", "righteous", "", "mah-tee-DONG"],
  ["week1", "maalsom", "sour", "", "mah-AL-som"],
  ["week1", "matam-is", "sweet", "", "mah-TAM-ees"],
  ["week1", "matab-ang", "tasteless", "", "mah-tab-ANG"],
  ["week1", "daan", "old (things)", "", "dah-AN"],
  ["week1", "bag-o", "new", "", "BAG-o"],
  // -- verbs --
  ["verbs", "hatag", "to give", "", "HAH-tag"],
  ["verbs", "bayad", "to pay", "", "BAH-yad"],
  ["verbs", "hulam", "to borrow", "", "HOO-lam"],
  ["verbs", "lingkod", "to sit", "", "leeng-KOD"],
  ["verbs", "tindog", "to stand", "", "TEEN-dog"],
  ["verbs", "sulod", "to enter", "", "soo-LOD"],
  ["verbs", "buhat", "to do / make", "", "BOO-hat"],
  ["verbs", "saka", "to climb", "", "SAH-kah"],
  ["verbs", "lakso", "to jump", "", "LAK-so"],
  ["verbs", "dalagan", "to run", "", "dah-LAH-gan"],
  ["verbs", "uli", "to go home", "", "oo-LEE"],
  ["verbs", "abot", "to arrive", "", "ah-BOT"],
  ["verbs", "pili", "to choose", "", "PEE-lee"],
  ["verbs", "surat", "to write", "", "SOO-rat"],
  ["verbs", "siring", "to speak / say", "", "SEE-ring"],
  ["verbs", "ampo", "to pray", "", "AM-po"],
  ["verbs", "simba", "to worship", "", "SEEM-bah"],
  ["verbs", "tanum", "to plant", "", "TAH-noom"],
  ["verbs", "luhod", "to kneel", "", "loo-HOD"],
  ["verbs", "hangyo", "to ask a favor", "", "hang-YO"],
  ["verbs", "tukar", "to play music", "", "TOO-kar"],
  ["verbs", "kanta", "to sing", "", "KAN-tah"],
  ["verbs", "dara", "to bring", "", "DAH-rah"],
  ["verbs", "labay", "to pass by", "", "lah-BIGH"],
  // -- home & things --
  ["verbs", "lamesa", "table", "", "lah-MEH-sah"],
  ["verbs", "lingkuran", "chair", "", "leeng-KOO-ran"],
  ["verbs", "katre", "bed", "", "KAT-reh"],
  ["verbs", "kudal", "fence", "", "koo-DAL"],
  ["verbs", "sala", "living room", "also: sin", "SAH-lah"],
  ["verbs", "tsinelas", "slippers", "", "tsee-NEH-las"],
  ["verbs", "saruwal", "pants", "", "sah-roo-WAL"],
  ["verbs", "syaket", "jacket", "", "SYAH-ket"],
  ["verbs", "medyas", "socks", "", "MED-yas"],
  ["verbs", "papel", "paper", "", "pah-PEL"],
  ["verbs", "lapis", "pencil", "", "LAH-pees"],
  ["verbs", "mulayan", "toy", "", "moo-LAH-yan"],
  ["verbs", "telebisyon", "television", "", "teh-leh-BEES-yon"],
  ["verbs", "sista", "guitar", "", "SEES-tah"],
  ["verbs", "mensahe", "message", "", "men-SAH-heh"],
  ["verbs", "tambal", "medicine", "", "TAM-bal"],
  // -- food --
  ["meals", "mangga", "mango", "", "MANG-gah"],
  ["meals", "nangka", "jackfruit", "", "NANG-kah"],
  ["meals", "kamatis", "tomato", "", "kah-MAH-tees"],
  ["meals", "mais", "corn", "", "mah-EES"],
  ["meals", "tsa", "tea", "", "tsah"],
  ["meals", "sabaw", "soup", "", "SAH-bow"],
  ["meals", "keyk", "cake", "", "keyk"],
  ["meals", "prutas", "fruit", "", "PROO-tas"],
  // -- nature & animals --
  ["nature", "dagat", "sea", "", "dah-GAT"],
  ["nature", "bukad", "flower", "", "boo-KAD"],
  ["nature", "tuna", "land / earth", "", "TOO-nah"],
  ["nature", "langit", "sky / heaven", "", "LAH-ngeet"],
  ["nature", "ayam", "dog", "also: ido", "AH-yam"],
  ["nature", "karabaw", "carabao", "", "kah-rah-BOW"],
  // -- time --
  ["verbs", "panahon", "time / weather", "", "pah-nah-HON"],
  ["verbs", "didto", "there (far)", "", "DEED-to"],
  ["greet", "Maupay nga udto", "Good noon", "", "mah-OO-pigh ngah OOD-to"],
  // -- faith & church --
  ["faith", "Diyos", "God", "", "dee-YOS"],
  ["faith", "Ginoo", "Lord", "", "gee-NO-o"],
  ["faith", "Jesu Kristo", "Jesus Christ", "", "HEH-soo KREES-to"],
  ["faith", "espiritu", "spirit", "", "es-pee-ree-TOO"],
  ["faith", "gugma", "love", "", "GOOG-mah"],
  ["faith", "bendisyon", "blessing", "", "ben-DEES-yon"],
  ["faith", "iglesia", "church", "", "eeg-LEH-syah"],
  ["faith", "Kristohanon", "Christian", "", "krees-to-HAH-non"],
  ["faith", "Bibliya", "Bible", "", "beeb-LEE-yah"],
  ["faith", "kros", "cross", "", "kros"],
  ["faith", "kinabuhi", "life", "", "kee-nah-BOO-hee"],
  ["faith", "kaadlawan", "birthday", "", "kah-ad-LAH-wan"],
  ["faith", "pasaylo", "to forgive", "", "pah-SIGH-lo"],
  ["faith", "wali", "to preach", "", "WAH-lee"],
  ["faith", "sala nga buhat", "sin", "lit. wrong deed", "SAH-lah ngah BOO-hat"],
];

const DECKS = {
  greet: { name: "Greetings & Survival", short: "Greetings", hint: "The phrases you reach for every day" },
  week1: { name: "Week 1 — Foundations", short: "Week 1", hint: "Pronouns and equational sentences" },
  verbs: { name: "Verbs, Objects & Time", short: "Verbs & Time", hint: "Mag / Nag / Pag affixes and when things happen" },
  invite: { name: "Phrases — Invitations", short: "Invitations", hint: "Asking someone over" },
  direk: { name: "Directions", short: "Directions", hint: "Finding your way around" },
  shop: { name: "Shopping", short: "Shopping", hint: "At the market" },
  airport: { name: "At the airport", short: "Airport", hint: "Travel & check-in" },
  daytrip: { name: "A day trip", short: "Day trip", hint: "Sightseeing & outings" },
  meals: { name: "Meals & eating", short: "Meals", hint: "Breakfast to dinner" },
  cook: { name: "Cooking", short: "Cooking", hint: "In the kitchen" },
  whentrav: { name: "When & travel", short: "When", hint: "Time spans & arriving" },
  gram: { name: "Grammar", short: "Grammar", hint: "Sentence patterns" },
  num: { name: "Numbers", short: "Numbers", hint: "Counting" },
  cal: { name: "Days & months", short: "Calendar", hint: "The week and the year" },
  color: { name: "Colors", short: "Colors", hint: "Basic colors" },
  essent: { name: "Handy phrases", short: "Handy", hint: "Useful everyday lines" },
  poss: { name: "Possessives", short: "Possess.", hint: "my / your / mine / yours" },
  demo: { name: "Demonstratives", short: "This/That", hint: "this, that, over there" },
  mark: { name: "Markers", short: "Markers", hint: "hi / hin / han / ha / ngan" },
  qword: { name: "Question words", short: "Questions", hint: "who, what, where, why" },
  ptcl: { name: "Particles", short: "Particles", hint: "already, still, also, very, not" },
  modal: { name: "Can & must", short: "Modals", hint: "can, need to, don't" },
  ppl: { name: "People & jobs", short: "People", hint: "family, roles, the body" },
  faith: { name: "Faith & church", short: "Faith", hint: "God, worship, belief" },
  nature: { name: "Nature", short: "Nature", hint: "trees, sea, animals" },
};

/* ---------------- curriculum (scaffolded lesson path) ----------------
   Units → lessons, ordered so each lesson builds on earlier ones. Lessons list
   their items by Waray text (resolved to existing cards at runtime; unknown
   entries are skipped). Each lesson is cleared in 4 escalating parts. */
const PASS_PCT = 0.8; // score needed to pass (clear) a lesson part
const LESSON_PARTS = [
  { dir: "wte", mode: "mc", label: "Recognize", hint: "Waray → English" },
  { dir: "etw", mode: "mc", label: "Reverse", hint: "English → Waray" },
  { dir: "wte", mode: "type", label: "Recall", hint: "Type the English" },
  { dir: "etw", mode: "type", label: "Produce", hint: "Type the Waray — no hints" },
];

// Top tier = sections; each section holds units; each unit holds lessons.
const CURRICULUM = [
  { id: "s1", name: "Survival Kit", hint: "Say something on day one", units: [
  { id: "u1", name: "Greetings & courtesy", hint: "Hellos, thanks, manners", lessons: [
    { id: "u1l1", title: "Hellos & thanks", items: ["Maupay nga aga", "Maupay nga udto", "Maupay nga kulop", "Maupay nga gab-i", "Kumusta ka?", "Maupay man", "Salamat", "Damo nga salamat", "Pasensya na", "Sige"] },
    { id: "u1l2", title: "Yes, no & getting by", items: ["Oo", "Diri", "Waray", "Waray pa", "Anay", "Adi", "Pwede", "Hinay-hinay la", "Pakpak anay", "Sige, sunod na la"] },
  ] },
  { id: "u2", name: "Survival phrases", hint: "When you're stuck", lessons: [
    { id: "u2l1", title: "When you're stuck", items: ["Waray ako makabaro", "Naintindihan ko", "Diri ako maaram", "Buligi daw ako", "Pasaylo-a ako", "Hain iton kasilyas?", "Waray sapayan", "Karuyag ko / Gusto ko", "Nakikit-an mo?", "Klaro?"] },
  ] },
  ] },
  { id: "s2", name: "People & Describing", hint: "Who, and what they're like", units: [
  { id: "u3", name: "Pronouns", hint: "I, you, he/she, we, they", lessons: [
    { id: "u3l1", title: "The pronouns", items: ["ako", "ikaw / ka", "hiya", "kita", "kami", "kamo", "hira", "Amerikano ako", "Babaye ka", "Makusog hiya"] },
  ] },
  { id: "u4", name: "Family & people", hint: "Family and the people around you", lessons: [
    { id: "u4l1", title: "Family", items: ["tatay", "nanay", "anak", "apoy", "apo", "asawa", "bugto", "akon patod", "uyab", "sangkay"] },
    { id: "u4l2", title: "People around you", items: ["lalaki", "babaye", "bata", "ulitawo", "daragita", "lagas", "kaharani", "bisita", "tawo", "miyembro"] },
  ] },
  { id: "u5", name: "Jobs & roles", hint: "What people do", lessons: [
    { id: "u5l1", title: "Work & roles", items: ["estudyante", "maestro / maestra", "turista", "nars", "panday", "pastor", "misyonaryo", "abugado", "mangingisda", "mag-uroma"] },
    { id: "u5l2", title: "More roles", items: ["direktor", "kapitan", "mayor", "konsehal", "negosyante", "sekretarya", "hardinero", "tag-iya", "ninong", "pasyente"] },
  ] },
  { id: "u6", name: "Describing", hint: "Words to describe people", lessons: [
    { id: "u6l1", title: "Looks", items: ["mahusay", "maraksot", "gwapo", "hataas", "habubo", "matambok", "magasa", "makusog", "daku", "gutiay"] },
    { id: "u6l2", title: "Qualities", items: ["malipay", "buoton", "riko", "makarit", "hubya", "kapoy", "maraut", "grabe", "matidong", "mapaso"] },
  ] },
  { id: "u7", name: "The body", hint: "Body words", lessons: [
    { id: "u7l1", title: "The body", items: ["lawas", "nawong", "mata", "ulo", "kasingkasing"] },
  ] },
  ] },
  { id: "s3", name: "Building Blocks", hint: "The grammar glue", units: [
  { id: "u8", name: "Markers", hint: "hi / hin / han / ha / ngan", lessons: [
    { id: "u8l1", title: "The little markers", items: ["hi", "hin", "han", "ha", "ngan", "saging"] },
    { id: "u8l2", title: "Markers in sentences", items: ["Ako hi Peter", "Hira Perla ngan Tessie", "Mapalit ako hin saging", "Makadto ako ha balay"] },
  ] },
  { id: "u9", name: "This & that", hint: "Demonstratives + nga", lessons: [
    { id: "u9l1", title: "This, that, over there", items: ["ini", "iton", "adto", "kahoy", "libro"] },
    { id: "u9l2", title: "This / that + noun", items: ["ini nga babaye", "iton nga lalake", "adto nga bata", "Tubig ini", "Kahoy adto", "Mga libro ini"] },
  ] },
  { id: "u10", name: "My, your, our", hint: "Possessives (nakon/ko, nimo/mo…)", lessons: [
    { id: "u10l1", title: "Possessive forms", items: ["nakon", "ko", "nimo", "niya", "naton", "namon", "niyo", "nira"] },
    { id: "u10l2", title: "Whose is it?", items: ["libro nakon", "lapis nimo", "uyab niya", "balay namon"] },
  ] },
  { id: "u11", name: "Mine & yours", hint: "Possessives (akon/imo/iya…) and ha +", lessons: [
    { id: "u11l1", title: "Mine, yours, theirs", items: ["akon", "imo", "iya", "aton", "amon", "iyo", "ira"] },
    { id: "u11l2", title: "It's mine / to me", items: ["Akon ini", "Akon ini nga balay", "ha akon", "ha imo", "ha iya"] },
  ] },
  { id: "u12", name: "Saying “X is Y”", hint: "Equational sentences + an / it", lessons: [
    { id: "u12l1", title: "I am / you are", items: ["Amerikano ako", "Nanay ako", "Babaye ka", "Makusog ka", "Mahusay ka", "Maraksot ka", "Makarit ka", "Turista hiya", "Estudyante kami", "Pilipino hira"] },
    { id: "u12l2", title: "The little words (an / it)", items: ["it", "an", "bata", "uyab", "mabaho"] },
    { id: "u12l3", title: "The ___ is ___", items: ["Gwapo it bata", "Gwapo an bata", "Hataas it akon uyab", "Marasa it adobo", "Mabaho it jeep"] },
  ] },
  { id: "u13", name: "Asking", hint: "Question words + ba", lessons: [
    { id: "u13l1", title: "Question words", items: ["hin-o", "ano", "hain", "diin", "kay ano", "mapira", "tagpira", "ba"] },
    { id: "u13l2", title: "Asking questions", items: ["Hin-o hiya?", "Isda ba ini?", "Kay ano?", "Mapira?", "Ano ini?", "Tagpira ini?"] },
    { id: "u13l3", title: "See & understand", items: ["Nakikit-an mo?", "Oo, nakikit-an ko", "Klaro?", "Oo, klaro", "Diri klaro", "Naintindihan nimo?", "Oo, naintindihan ko", "Taga diin ka?", "Hain ka?", "Ano imo gin-hihimo?"] },
  ] },
  { id: "u14", name: "Little words", hint: "na, pa, liwat, hin duro & negation", lessons: [
    { id: "u14l1", title: "Particles & negation", items: ["na", "pa", "liwat", "hin duro", "Waray", "Diri"] },
    { id: "u14l2", title: "Using the little words", items: ["Marasa hin duro", "Namahaw na ako", "Diri pa", "Makusog liwat", "Waray pa"] },
  ] },
  { id: "u15", name: "Verb tenses", hint: "will / now / did (ma- / na- / -inm-)", lessons: [
    { id: "u15l1", title: "Eat & go", items: ["makaon", "nakaon", "kinmaon", "malakat", "nalakat", "linmakat"] },
    { id: "u15l2", title: "Buy & drink", items: ["mapalit", "napalit", "pinmalit", "mainom", "nainom", "inminom"] },
    { id: "u15l3", title: "The affixes", items: ["Mag- + verb", "Nag- + verb", "Pag- + verb", "Mag-aano ka?", "Kaon kita", "Kumaon kita"] },
  ] },
  { id: "u16", name: "Can, must, don't", hint: "kinahanglan, pwede / mahimo, Ayaw", lessons: [
    { id: "u16l1", title: "Can, must, don't", items: ["kinahanglan", "mahimo", "Ayaw", "Pwede", "trabaho"] },
    { id: "u16l2", title: "Using them", items: ["Kinahanglan ako magtrabaho", "Pwede ka ba magdara?", "Mahimo ako maupod", "Ayaw pagkaon"] },
  ] },
  ] },
  { id: "s4", name: "Everyday Life", hint: "Doing things day to day", units: [
  { id: "u17", name: "Action verbs", hint: "Things you do", lessons: [
    { id: "u17l1", title: "Around the house", items: ["laba", "hugas", "luto", "limpyu", "lukot", "basa", "sudlay", "sayaw", "maneho", "tago"] },
    { id: "u17l2", title: "Common verbs", items: ["hatag", "lingkod", "tindog", "hulat", "dara", "andam", "hangyo", "labay", "hulam", "bayad"] },
    { id: "u17l3", title: "More verbs", items: ["saka", "lakso", "dalagan", "uli", "sulod", "buhat", "surat", "siring", "pili", "abot"] },
  ] },
  { id: "u18", name: "Time & when", hint: "Now, later, parts of the day", lessons: [
    { id: "u18l1", title: "When", items: ["yana", "niyan", "buwas", "kanina", "kakulop", "kagab-i", "kanina han aga", "kulop", "yana nga aga", "yana nga gab-i"] },
    { id: "u18l2", title: "Here, there & time", items: ["didi", "dida", "dinhi", "didto", "Ano it oras dida?", "Alas singko didi", "Ano nga oras?", "adlaw", "semana", "panahon"] },
  ] },
  { id: "u19", name: "Days & months", hint: "The week and the year", lessons: [
    { id: "u19l1", title: "Days of the week", items: ["Lunes", "Martes", "Miyerkoles", "Huwebes", "Biyernes", "Sabado", "Dominggo"] },
    { id: "u19l2", title: "Months", items: ["Enero", "Pebrero", "Marso", "Abril", "Mayo", "Hunyo", "Hulyo", "Agosto", "Setyembre", "Oktubre", "Nobyembre", "Disyembre"] },
  ] },
  { id: "u20", name: "Weather", hint: "Talking about the day", lessons: [
    { id: "u20l1", title: "Weather", items: ["uran / mauran", "sirak / masirak", "dampog / madampog", "hangin / mahangin", "mapaso", "matugnaw", "may bagyo", "mapaso hin duro", "Kumusta it panahon?"] },
  ] },
  { id: "u21", name: "Home & things", hint: "Nouns for the world around you", lessons: [
    { id: "u21l1", title: "Rooms & furniture", items: ["balay", "kusina", "banyo", "kwarto", "sala", "lamesa", "lingkuran", "katre", "kudal", "telebisyon"] },
    { id: "u21l2", title: "Clothes", items: ["bado", "sapatos", "tsinelas", "saruwal", "panyo", "mantel", "biray", "taklap", "syaket", "medyas"] },
    { id: "u21l3", title: "Things", items: ["tinidor", "kutsara", "pinggan", "baso", "papel", "libro", "lapis", "mulayan", "sista", "tubig"] },
  ] },
  { id: "u22", name: "Meals & eating", hint: "Breakfast to dinner", lessons: [
    { id: "u22l1", title: "Meals", items: ["pamahaw", "paniudto", "pangiklop", "isnak", "kan-on", "pagkaon", "marasa", "gutom"] },
    { id: "u22l2", title: "Eating phrases", items: ["Namahaw ka na?", "Naniudto ka na?", "Nangiklop ka na?", "Waray pa", "Pamahaw kita", "Ano it paniudtuhon?", "May pagkaon didi", "Kaon anay"] },
  ] },
  { id: "u23", name: "Cooking", hint: "In the kitchen", lessons: [
    { id: "u23l1", title: "Ingredients", items: ["lasona", "sibuyas", "suoy", "toyo", "tubig", "pamyenta", "asukar"] },
    { id: "u23l2", title: "Cooking words", items: ["lutuon", "igbabad", "pakaladkara", "panakot", "madali", "masayon", "makuri"] },
    { id: "u23l3", title: "Making adobo", items: ["Ano ini nga kaluto?", "Adobo nga manok", "Makuri ba ini lutuon?", "Madali la", "Tutdui gad ako", "Ano it mga panakot?"] },
  ] },
  ] },
  { id: "s5", name: "Out & About", hint: "Getting around and running errands", units: [
  { id: "u24", name: "Directions", hint: "Finding your way around", lessons: [
    { id: "u24l1", title: "Places", items: ["bangko", "botika", "ospital", "istasyon hit pulis", "munisipyo", "paradahan", "eskina", "atbang"] },
    { id: "u24l2", title: "Getting there", items: ["dinhi", "harani", "harayo", "bus", "dyip", "taxi", "pedicab", "traysikol"] },
    { id: "u24l3", title: "Asking & answers", items: ["Pwede magpakiana?", "Hain it bangko?", "Harayo ba tikang dinhi?", "Waray sapayan", "Harani la", "Pwede baktason", "Ika-upat nga eskina tikang dinhi", "Pagbus nala"] },
  ] },
  { id: "u25", name: "Shopping", hint: "At the market", lessons: [
    { id: "u25l1", title: "At the market", items: ["tindahan", "tindera", "kahera", "kwarta", "sukli", "sinsilyo", "barato", "bulad", "tinapa"] },
    { id: "u25l2", title: "Buying words", items: ["palit", "ginbibiling", "karuyag", "baraydan", "bulig"] },
    { id: "u25l3", title: "Asking & paying", items: ["Ano ini?", "Tagpira ini?", "Hain tungod it kahera?", "May tinapa kamo dinhi?", "Ini it akon papaliton", "Pwede mo ako buligan?", "Hain it mas barato?", "Adi it imo sukli", "Pira it akon baraydan?"] },
  ] },
  { id: "u26", name: "Transport", hint: "Ways to get around", lessons: [
    { id: "u26l1", title: "Vehicles & roads", items: ["sarakyan", "motor", "awto", "pumpboat", "baktas", "karsada", "bukid", "tulay"] },
  ] },
  { id: "u27", name: "At the airport", hint: "Travel & check-in", lessons: [
    { id: "u27l1", title: "Airport words", items: ["eroplano", "tiket", "bagahe", "gate", "kostums", "pasaporte", "pasahero"] },
    { id: "u27l2", title: "At the counter", items: ["Pakitaa ako hit imo tiket", "Pakitaa ako hit imo pasaporte", "Malupad it eroplano alas nuybe", "Deritso ha gate numero dos", "Enjoy hit imo biyahe"] },
  ] },
  { id: "u28", name: "A day trip", hint: "San Juanico & Sto. Niño", lessons: [
    { id: "u28l1", title: "Places & going out", items: ["pamasyada", "tulay", "lugar", "isla", "museo", "pumpboat", "makaradlok", "mamasyada", "kumita", "maupod", "huram"] },
    { id: "u28l2", title: "Making the plan", items: ["Pamasyada kita", "Mamamasyada ako buwas", "Karuyag ko kumita", "Maupod ka buwas?", "Karuyag ko kumita hit San Juanico", "Pwede kita magburubaktas", "Pagkita kita buwas", "Mahusay ngadto"] },
  ] },
  { id: "u29", name: "Invitations", hint: "Asking someone over", lessons: [
    { id: "u29l1", title: "What's going on?", items: ["imbitasyon", "may / mayda", "gin-iimbita", "Ano it mayda?", "May libre ka ba nga oras hit Sabado?", "Ano nga oras?", "Alas sais ha gab-i", "Nag-arog ako", "Mayda pangaon ha balay", "makadto"] },
    { id: "u29l2", title: "Bring someone & meet", items: ["Poydi ko ba ig-upod hi Rey?", "ig-upod", "Siyempre, poydi", "Maghuhulat ako ha iyo", "Sigurado, makadto kami", "Sige, magkita kita hit Sabado", "magkita"] },
  ] },
  { id: "u30", name: "When & travel", hint: "Time spans and arriving", lessons: [
    { id: "u30l1", title: "Time & travel", items: ["biyahe", "semana", "adlaw", "maabot", "lumakat", "san-o", "kakan-o"] },
    { id: "u30l2", title: "Saying when", items: ["Mabiyahe ako ha Pilipinas", "Ano ka nga adlaw maabot?", "Kakan-o ka umabot?", "Hit maabot nga duha ka semana"] },
  ] },
  ] },
  { id: "s6", name: "The World", hint: "Food, nature, colors, numbers", units: [
  { id: "u31", name: "Food", hint: "On the table", lessons: [
    { id: "u31l1", title: "At the table", items: ["isda", "manok", "karne", "utan", "kan-on", "pagkaon", "saging", "mangga", "prutas", "tubig"] },
    { id: "u31l2", title: "More food", items: ["nangka", "kamatis", "mais", "tsa", "sabaw", "keyk", "marasa", "gutom"] },
  ] },
  { id: "u32", name: "Nature & animals", hint: "The outdoors", lessons: [
    { id: "u32l1", title: "Nature & animals", items: ["kahoy", "dagat", "isla", "bukid", "bukad", "tuna", "langit", "ayam", "karabaw", "tanom"] },
  ] },
  { id: "u33", name: "Numbers", hint: "Counting 1–100", lessons: [
    { id: "u33l1", title: "Numbers 1–100", items: ["usa", "duha", "tulo", "upat", "lima", "unom", "pito", "walo", "siyam", "napulo", "karuhaan", "usa kagatos"] },
  ] },
  { id: "u34", name: "Colors", hint: "Basic colors", lessons: [
    { id: "u34l1", title: "Colors", items: ["itom", "busag", "pula", "asul", "darag", "berde"] },
  ] },
  ] },
  { id: "s7", name: "Faith & Church", hint: "God, worship, belief", units: [
  { id: "u35", name: "God & worship", hint: "Faith words", lessons: [
    { id: "u35l1", title: "God & worship", items: ["Diyos", "Ginoo", "Jesu Kristo", "espiritu", "simba", "ampo", "wali", "bendisyon", "gugma", "kasingkasing"] },
  ] },
  { id: "u36", name: "Church & belief", hint: "Church life", lessons: [
    { id: "u36l1", title: "Church & belief", items: ["iglesia", "pastor", "misyonaryo", "Kristohanon", "Bibliya", "kros", "kinabuhi", "langit", "pasaylo", "kaadlawan"] },
  ] },
  ] },
];
// flat, ordered list of every lesson (with its unit + section) for unlock / "next"
const LESSON_FLOW = CURRICULUM.flatMap((s) =>
  s.units.flatMap((u) => u.lessons.map((l) => ({ ...l, unit: u, section: s })))
);
// resolve a lesson's item words to real card objects (skip any that don't exist)
function lessonCards(cards, lesson) {
  const byWaray = {};
  cards.forEach((c) => { byWaray[c.waray] = c; });
  return (lesson.items || []).map((w) => byWaray[w]).filter(Boolean);
}
// every (unique) card in a section, across its units' lessons
function sectionCards(cards, section) {
  const seen = new Set(), out = [];
  section.units.forEach((u) => u.lessons.forEach((l) => lessonCards(cards, l).forEach((c) => {
    if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
  })));
  return out;
}
// parts completed (0–4) for a lesson; a lesson is "done" at 4
const lessonDone = (lessons, id) => (lessons[id] || 0) >= LESSON_PARTS.length;
// a lesson is unlocked if it's the first or the previous lesson is done
function lessonUnlocked(lessons, id) {
  const idx = LESSON_FLOW.findIndex((l) => l.id === id);
  if (idx <= 0) return true;
  return lessonDone(lessons, LESSON_FLOW[idx - 1].id);
}
// the first not-yet-finished unlocked lesson (what "Continue" jumps to)
function nextLesson(lessons) {
  return LESSON_FLOW.find((l) => !lessonDone(lessons, l.id)) || LESSON_FLOW[LESSON_FLOW.length - 1];
}

// Cards that Paul's old tracker logged as "Forgotten" — start these a notch lower
const FORGOTTEN = new Set([
  "buoton", "riko", "kita", "makusog", "asawa", "Naintindihan nimo?",
  "Mahusay ka", "sangkay", "ako", "nanay", "matambok", "hataas",
  "babaye", "lalaki", "hira", "mapaso", "Nakikit-an mo?", "Maraksot ka",
  "Ano imo gin-kakaon?", "kamo", "bisita", "Oo, nakikit-an ko",
]);

function buildCards() {
  return SEED.map((r, i) => {
    const [deck, waray, english, subtext, say] = r;
    return {
      id: `c${i}`,
      deck, waray, english,
      subtext: subtext || "",
      say: say || "",
      forgotten: FORGOTTEN.has(waray),
    };
  });
}

/* ---------------- spaced repetition (Leitner) ---------------- */
const BOX_DAYS = [0, 1, 2, 4, 9, 18]; // interval after reaching each box
const MS_DAY = 86400000;
const now = () => Date.now();
const today = () => new Date().toISOString().slice(0, 10);
// current day-streak from the per-day activity map (date -> review count).
// Counts back from today; if today isn't done yet, the streak still stands
// (grace) and we count from yesterday. Uncapped, and consistent with what the
// 14-day strip shows.
const currentStreak = (days) => {
  const map = days || {};
  const d = new Date();
  const key = (x) => x.toISOString().slice(0, 10);
  if (!map[key(d)]) d.setDate(d.getDate() - 1); // not studied yet today
  let n = 0;
  while (map[key(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
};

function freshStat(forgotten) {
  return {
    box: forgotten ? 0 : 0, seen: 0, right: 0, wrong: 0,
    streak: 0, last: 0, due: 0, hasAudio: false, pinned: false,
  };
}
function isDue(st) { return !st || st.seen === 0 || now() >= (st.due || 0); }
function masteryPct(st) { return st ? Math.min(1, st.box / 5) : 0; }
// "needs work" = you pinned it, or you've missed it at least once — the stuff to
// redrill. Ranked elsewhere by how often it's been missed, so a word you keep
// struggling with stays here even if you happened to get it right last time.
function needsWorkCard(st) {
  if (!st) return false;
  if (st.pinned) return true;
  return (st.wrong || 0) > 0;
}
// accuracy 0–1 (used to break ties when ranking struggle); unseen = perfect
function accuracy(st) { return st && st.seen ? st.right / st.seen : 1; }

function applyResult(st, correct) {
  const s = { ...st };
  s.seen += 1;
  s.last = now();
  if (correct) {
    s.right += 1;
    s.streak += 1;
    s.box = Math.min(5, s.box + 1);
  } else {
    s.wrong += 1;
    s.streak = 0;
    s.box = 0;
  }
  s.due = now() + BOX_DAYS[s.box] * MS_DAY;
  return s;
}

/* ---------------- text matching ---------------- */
function norm(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[.,!?;:"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
function alts(s) {
  return s.split("/").map((x) => norm(x)).filter(Boolean);
}
function lev(a, b) {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(
        d[i - 1][j] + 1, d[i][j - 1] + 1,
        d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return d[m][n];
}
// fold Waray spelling equivalences: o=u and e=i are the same sound, so accept
// either when grading a Waray answer
const warayFold = (s) => s.replace(/o/g, "u").replace(/e/g, "i");
function checkAnswer(input, target, waray) {
  let got = norm(input);
  if (!got) return false;
  const targets = alts(target);
  if (waray) got = warayFold(got);
  for (let t of targets) {
    if (waray) t = warayFold(t);
    if (got === t) return true;
    const tol = t.length <= 4 ? 0 : t.length <= 8 ? 1 : 2;
    if (lev(got, t) <= tol) return true;
  }
  return false;
}
// When a typed/picked answer is wrong, see if it's actually a known word so we can
// say what the learner *did* say. dir "etw" => they gave Waray (look it up);
// "wte" => they gave English (find the Waray it maps to). Returns "X = Y" or null.
const _stripLead = (s) => s.replace(/^(to |a |an |the )/, ""); // ignore "to walk" vs "walk"
function explainGiven(cards, given, answer, dir) {
  const g = norm(given);
  if (!g || g === norm(answer)) return null;
  if (dir === "etw") {
    // they typed Waray — find the word and show its meaning
    const c = cards.find((x) => norm(x.waray) === g) || cards.find((x) => warayFold(norm(x.waray)) === warayFold(g));
    return c ? `${c.waray} = ${c.english}` : null;
  }
  // they typed English — find which Waray word it means (ignoring leading to/a/the)
  const gs = _stripLead(g);
  const c = cards.find((x) => alts(x.english).some((a) => a === g || _stripLead(a) === gs));
  return c ? `“${given.trim()}” = ${c.waray}` : null;
}

/* ---------------- persistent storage wrapper ---------------- */
const mem = {};
const store = {
  async get(k) {
    try { const v = localStorage.getItem(k); if (v !== null) return v; } catch (e) {}
    return k in mem ? mem[k] : null;
  },
  async set(k, v) {
    mem[k] = v;
    try { localStorage.setItem(k, v); } catch (e) {/* quota — sync still holds the canonical copy */}
  },
};

/* ---------------- GitHub Gist cloud sync ----------------
   Uses a personal access token (scope: gist) the user pastes in. GitHub's API
   sends permissive CORS headers, so this can run from the browser directly.
   One secret gist holds a single JSON file with progress + streak + recordings. */
const GIST_FILE = "sulog-progress.json";
const GIST_DESC = "Sulog — Waray review progress (autosync)";

async function gistApi(token, path, method, body) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res;
  try {
    res = await fetch("https://api.github.com" + path, {
      method: method || "GET",
      signal: ctrl.signal,
      headers: {
        Authorization: "Bearer " + token,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (e) {
    if (e.name === "AbortError") throw new Error("GitHub didn't respond in time. Check your connection.");
    throw new Error("Couldn't reach GitHub from here — this frame may be blocking the request. The hosted version won't have this limit.");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    if (res.status === 401) throw new Error("GitHub rejected the token (401). Check it has the 'gist' scope.");
    if (res.status === 403) throw new Error("GitHub says forbidden (403) — rate limit or missing scope.");
    if (res.status === 404) throw new Error("That gist wasn't found (404).");
    const t = await res.text().catch(() => "");
    throw new Error("GitHub error " + res.status + (t ? ": " + t.slice(0, 100) : ""));
  }
  if (res.status === 204) return null;
  return res.json();
}

async function gistReadContent(token, gistId) {
  const g = await gistApi(token, "/gists/" + gistId);
  const f = g.files && g.files[GIST_FILE];
  if (!f) return null;
  if (f.truncated && f.raw_url) {
    // file too big for the inline payload — fetch the raw blob
    const r = await fetch(f.raw_url);
    if (!r.ok) throw new Error("Couldn't fetch the full backup blob (" + r.status + ").");
    return r.text();
  }
  return f.content;
}

// merge two progress maps, keeping whichever record was touched most recently
function mergeProg(local, cloud) {
  const out = { ...(local || {}) };
  for (const id in (cloud || {})) {
    const l = local && local[id];
    const c = cloud[id];
    if (!l || (c && (c.last || 0) >= (l.last || 0))) out[id] = c;
  }
  return out;
}
function mergeStreak(l, c) {
  if (!c) return l || { count: 0, last: "", days: {} };
  if (!l) return c;
  const days = { ...(l.days || {}), ...(c.days || {}) };
  const base = (c.last || "") >= (l.last || "") ? c : l;
  return { ...base, days, count: Math.max(l.count || 0, c.count || 0) };
}

/* ---------------- speech ----------------
   The browser almost never ships a Waray voice. Best case is a Filipino /
   Tagalog voice: Tagalog spelling maps to sound almost exactly like Waray
   (a=ah, i=ee, u=oo, ng = velar nasal, and it even has "nga"), so such a voice
   reads the RAW Waray text accurately and naturally. If none is available we
   fall back to an English voice reading the phonetic *respelling* — a rough
   approximation. Either way we speak one fluid utterance per phrase (words
   comma-joined for a light pause); no per-syllable chopping, which sounded
   robotic. The voice is chosen automatically (prefer Filipino) but the user can
   override it from the Sounds screen, stored as settings.voiceURI. */
let _voices = [];
let _autoVoice = null; // best automatic pick (highest voiceRank)
let _voiceURI = null;  // user-chosen voice (settings.voiceURI), set by App

// How well a voice's language approximates Waray. Waray is Austronesian:
// Filipino/Tagalog is closest; Indonesian and Malay share the same 5-vowel,
// phonetic-Latin spelling (a=ah, i=ee, u=oo, ng = velar nasal), so they read
// raw Waray far better than an English voice. Higher rank = better.
function voiceRank(v) {
  const s = ((v.lang || "") + " " + (v.name || "")).toLowerCase();
  if (/(^|[^a-z])fil|(^|[^a-z])tl[-_]|tagalog|pilipino|filipino/.test(s)) return 3;
  if (/(^|[^a-z])id[-_]|indonesia/.test(s)) return 2;
  if (/(^|[^a-z])ms[-_]|malay|melayu/.test(s)) return 2;
  return 0;
}
function loadVoices() {
  try {
    _voices = window.speechSynthesis.getVoices() || [];
    _autoVoice = _voices
      .filter((v) => voiceRank(v) > 0)
      .sort((a, b) => voiceRank(b) - voiceRank(a))[0] || null;
  } catch (e) {}
}
if (typeof window !== "undefined" && window.speechSynthesis) {
  loadVoices();
  try { window.speechSynthesis.onvoiceschanged = loadVoices; } catch (e) {}
}

// the voice to use: the user's pick if set & available, else the best auto-pick
function chosenVoice() {
  if (_voiceURI) {
    const v = _voices.find((x) => x.voiceURI === _voiceURI);
    if (v) return v;
  }
  return _autoVoice;
}

// English respelling -> readable text for an English voice: strip the syllable
// hyphens (join), lowercase, word-initial "ng" -> "n", comma-join the words.
function respellForTTS(say) {
  return say
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/-/g, "").toLowerCase().replace(/^ng/, "n"))
    .join(", ");
}

function speak(arg, rate = 0.78) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    if (!_voices.length) loadVoices();

    const card = typeof arg === "string" ? { waray: arg, say: "" } : (arg || {});
    const voice = chosenVoice();
    const lang = voice ? voice.lang : "en-US";
    const english = /^en/i.test(lang);
    const rawWaray = (card.waray || "").split(/\s+/).filter(Boolean).join(", ");

    // A non-English (Filipino/Tagalog) voice reads the raw Waray accurately; an
    // English voice does better on the respelling. Either way: one utterance.
    const text = english ? (card.say ? respellForTTS(card.say) : rawWaray) : rawWaray;

    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.lang = lang;
    if (voice) u.voice = voice;
    synth.speak(u);
  } catch (e) {}
}

/* =================================================================== */

export default function App() {
  const cards = useRef(buildCards()).current;
  const [view, setView] = useState("home");
  const [prog, setProg] = useState({});
  const [audio, setAudio] = useState({});   // id -> base64 dataURL
  const [streak, setStreak] = useState({ count: 0, last: "", days: {} });
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState(null);
  const [lessons, setLessons] = useState({}); // lessonId -> parts completed (0–4)
  const [lessonId, setLessonId] = useState(null); // lesson open in LessonView
  const [learnTarget, setLearnTarget] = useState(null); // lesson id to scroll to in LearnView
  const [learnSection, setLearnSection] = useState(null); // which section LearnView shows
  const [settings, setSettings] = useState({ rate: 0.95, adaptive: false, voiceURI: "" });
  const [history, setHistory] = useState([]); // full attempt log {ts, waray, prompt, answer, given, correct, dir, mode}

  // keep the module-level chosen voice that speak() reads in sync with settings
  useEffect(() => {
    _voiceURI = settings.voiceURI || null;
  }, [settings.voiceURI]);

  // load on mount
  useEffect(() => {
    (async () => {
      const p = await store.get("waray:prog");
      const s = await store.get("waray:streak");
      const aIdx = await store.get("waray:audioIndex");
      const cfg = await store.get("waray:settings");
      const les = await store.get("waray:lessons");
      const hist = await store.get("waray:history");
      if (p) setProg(JSON.parse(p));
      if (s) setStreak(JSON.parse(s));
      if (les) setLessons(JSON.parse(les));
      if (hist) setHistory(JSON.parse(hist));
      if (cfg) setSettings((prev) => ({ ...prev, ...JSON.parse(cfg) }));
      if (aIdx) {
        const ids = JSON.parse(aIdx);
        const a = {};
        for (const id of ids) {
          const d = await store.get("waray:audio:" + id);
          if (d) a[id] = d;
        }
        setAudio(a);
      }
      setLoaded(true);
    })();
  }, []);

  const saveProg = useCallback((np) => { setProg(np); store.set("waray:prog", JSON.stringify(np)); }, []);
  const saveStreak = useCallback((ns) => { setStreak(ns); store.set("waray:streak", JSON.stringify(ns)); }, []);
  const saveSettings = useCallback((ns) => { setSettings(ns); store.set("waray:settings", JSON.stringify(ns)); }, []);
  // append one attempt to the full history log (capped so storage stays bounded)
  const logAttempt = useCallback((e) => {
    setHistory((prev) => {
      const ns = [...prev, e];
      if (ns.length > 6000) ns.splice(0, ns.length - 6000);
      store.set("waray:history", JSON.stringify(ns));
      return ns;
    });
  }, []);
  // mark a lesson part complete (parts unlock in order, so keep the max reached)
  const completeLessonPart = useCallback((id, partIdx) => {
    setLessons((prev) => {
      const ns = { ...prev, [id]: Math.max(prev[id] || 0, partIdx + 1) };
      store.set("waray:lessons", JSON.stringify(ns));
      return ns;
    });
  }, []);
  // open a lesson part: build a session over its cards in that part's dir+mode
  const startLessonPart = useCallback((lesson, partIdx) => {
    const part = LESSON_PARTS[partIdx];
    const ids = lessonCards(cards, lesson).map((c) => c.id);
    setSession({ deckKeys: Object.keys(DECKS), dir: part.dir, mode: part.mode, limit: ids.length, only: ids, lesson: { id: lesson.id, part: partIdx } });
    setView("session");
  }, [cards]);

  const bumpStreak = useCallback(() => {
    setStreak((prev) => {
      const t = today();
      if (prev.last === t) {
        const ns = { ...prev, days: { ...prev.days, [t]: (prev.days[t] || 0) + 1 } };
        store.set("waray:streak", JSON.stringify(ns)); return ns;
      }
      const y = new Date(Date.now() - MS_DAY).toISOString().slice(0, 10);
      const count = prev.last === y ? prev.count + 1 : 1;
      const ns = { count, last: t, days: { ...prev.days, [t]: (prev.days[t] || 0) + 1 } };
      store.set("waray:streak", JSON.stringify(ns)); return ns;
    });
  }, []);

  const recordCard = useCallback((id, correct) => {
    setProg((prev) => {
      const card = cards.find((c) => c.id === id);
      const st = prev[id] || freshStat(card?.forgotten);
      const np = { ...prev, [id]: { ...applyResult(st, correct), hasAudio: !!audio[id] } };
      store.set("waray:prog", JSON.stringify(np));
      return np;
    });
  }, [audio, cards]);

  const saveAudio = useCallback(async (id, dataURL) => {
    setAudio((prev) => ({ ...prev, [id]: dataURL }));
    await store.set("waray:audio:" + id, dataURL);
    const idx = await store.get("waray:audioIndex");
    const ids = idx ? JSON.parse(idx) : [];
    if (!ids.includes(id)) { ids.push(id); await store.set("waray:audioIndex", JSON.stringify(ids)); }
    setProg((prev) => {
      const st = prev[id] || freshStat(cards.find((c) => c.id === id)?.forgotten);
      const np = { ...prev, [id]: { ...st, hasAudio: true } };
      store.set("waray:prog", JSON.stringify(np));
      return np;
    });
  }, [cards]);

  const togglePin = useCallback((id) => {
    setProg((prev) => {
      const st = prev[id] || freshStat(cards.find((c) => c.id === id)?.forgotten);
      const np = { ...prev, [id]: { ...st, pinned: !st.pinned } };
      store.set("waray:prog", JSON.stringify(np));
      return np;
    });
  }, [cards]);

  const playCard = useCallback((card) => {
    const a = audio[card.id];
    if (a) { try { new Audio(a).play(); return; } catch (e) {} }
    let rate = settings.rate;
    if (settings.adaptive) {
      // gradually speed up as a card is mastered: box 0 -> base, box 5 -> +0.35
      const box = prog[card.id]?.box || 0;
      rate = Math.min(1.25, (settings.rate - 0.1) + (box / 5) * 0.45);
    }
    speak(card, rate);
  }, [audio, settings, prog]);

  // ---- backup: export everything to a portable JSON object ----
  const exportData = useCallback((includeAudio) => {
    return {
      app: "sulog-waray",
      v: 1,
      exportedAt: new Date().toISOString(),
      prog,
      streak,
      history,
      audio: includeAudio ? audio : {},
    };
  }, [prog, streak, audio, history]);

  // ---- backup: load a JSON object back in ----
  const importData = useCallback(async (data, mode) => {
    if (!data || data.app !== "sulog-waray") throw new Error("That doesn't look like a Sulog backup file.");
    // progress + streak: replace
    if (data.prog) { setProg(data.prog); await store.set("waray:prog", JSON.stringify(data.prog)); }
    if (data.streak) { setStreak(data.streak); await store.set("waray:streak", JSON.stringify(data.streak)); }
    if (data.history) { setHistory(data.history); await store.set("waray:history", JSON.stringify(data.history)); }
    // recordings: merge so we never lose voice you already saved
    const incoming = data.audio || {};
    if (Object.keys(incoming).length) {
      const merged = mode === "replace" ? { ...incoming } : { ...audio, ...incoming };
      setAudio(merged);
      for (const id of Object.keys(incoming)) {
        await store.set("waray:audio:" + id, incoming[id]);
      }
      await store.set("waray:audioIndex", JSON.stringify(Object.keys(merged)));
    }
    return true;
  }, [audio]);

  /* ---------------- cloud sync state & ops ---------------- */
  const stateRef = useRef({});
  stateRef.current = { prog, streak, audio, settings, history };
  const [syncState, setSyncState] = useState({ status: "idle", at: "", error: "" });
  const pushTimer = useRef(null);
  const didInitialPull = useRef(false);

  // merge a cloud snapshot into local (local wins on audio so fresh recordings survive)
  const applyCloud = useCallback(async (cloud) => {
    if (!cloud || cloud.app !== "sulog-waray") throw new Error("The gist didn't contain Sulog data.");
    const cur = stateRef.current;
    const np = mergeProg(cur.prog, cloud.prog || {});
    const ns = mergeStreak(cur.streak, cloud.streak || {});
    setProg(np); await store.set("waray:prog", JSON.stringify(np));
    setStreak(ns); await store.set("waray:streak", JSON.stringify(ns));
    // history: union local + cloud by timestamp, keep chronological, cap
    const seenTs = new Set();
    const mh = [...(cur.history || []), ...(cloud.history || [])]
      .filter((e) => { const k = e.ts + "|" + e.waray + "|" + e.given; if (seenTs.has(k)) return false; seenTs.add(k); return true; })
      .sort((a, b) => a.ts - b.ts);
    if (mh.length > 6000) mh.splice(0, mh.length - 6000);
    setHistory(mh); await store.set("waray:history", JSON.stringify(mh));
    const cloudAudio = cloud.audio || {};
    if (Object.keys(cloudAudio).length) {
      const merged = { ...cloudAudio, ...cur.audio }; // local wins
      setAudio(merged);
      for (const id in cloudAudio) if (!cur.audio[id]) await store.set("waray:audio:" + id, cloudAudio[id]);
      await store.set("waray:audioIndex", JSON.stringify(Object.keys(merged)));
    }
  }, []);

  const syncPull = useCallback(async () => {
    const s = stateRef.current.settings.sync;
    if (!s?.token || !s?.gistId) return;
    setSyncState({ status: "syncing", at: "", error: "" });
    try {
      const txt = await gistReadContent(s.token, s.gistId);
      if (txt) await applyCloud(JSON.parse(txt));
      setSyncState({ status: "ok", at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), error: "" });
    } catch (e) {
      setSyncState({ status: "error", at: "", error: e.message });
    }
  }, [applyCloud]);

  const syncPush = useCallback(async () => {
    const cur = stateRef.current;
    const s = cur.settings.sync;
    if (!s?.token || !s?.gistId) return;
    setSyncState((p) => ({ ...p, status: "syncing", error: "" }));
    try {
      const payload = JSON.stringify({
        app: "sulog-waray", v: 1, exportedAt: new Date().toISOString(),
        prog: cur.prog, streak: cur.streak, audio: cur.audio, history: cur.history,
      });
      await gistApi(s.token, "/gists/" + s.gistId, "PATCH", { files: { [GIST_FILE]: { content: payload } } });
      setSyncState({ status: "ok", at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), error: "" });
    } catch (e) {
      setSyncState({ status: "error", at: "", error: e.message });
    }
  }, []);

  // connect: validate token, find an existing Sulog gist or create one, then pull
  const connectGist = useCallback(async (token) => {
    token = (token || "").trim();
    if (!token) throw new Error("Paste a token first.");
    setSyncState({ status: "syncing", at: "", error: "" });
    try {
      const list = await gistApi(token, "/gists?per_page=100");
      let gid = null;
      for (const g of list || []) if (g.files && g.files[GIST_FILE]) { gid = g.id; break; }
      if (!gid) {
        const cur = stateRef.current;
        const payload = JSON.stringify({
          app: "sulog-waray", v: 1, exportedAt: new Date().toISOString(),
          prog: cur.prog, streak: cur.streak, audio: cur.audio,
        });
        const created = await gistApi(token, "/gists", "POST", {
          description: GIST_DESC, public: false, files: { [GIST_FILE]: { content: payload } },
        });
        gid = created.id;
      }
      const ns = { ...stateRef.current.settings, sync: { provider: "gist", token, gistId: gid, enabled: true } };
      saveSettings(ns);
      // pull whatever is in the cloud now (covers the "found existing" case)
      const txt = await gistReadContent(token, gid);
      if (txt) await applyCloud(JSON.parse(txt));
      setSyncState({ status: "ok", at: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), error: "" });
      return gid;
    } catch (e) {
      setSyncState({ status: "error", at: "", error: e.message });
      throw e;
    }
  }, [applyCloud, saveSettings]);

  const disconnectGist = useCallback(() => {
    const ns = { ...stateRef.current.settings, sync: { provider: "gist", token: "", gistId: "", enabled: false } };
    saveSettings(ns);
    setSyncState({ status: "idle", at: "", error: "" });
  }, [saveSettings]);

  // pull once when the app opens (if already connected)
  useEffect(() => {
    if (loaded && !didInitialPull.current && settings.sync?.enabled && settings.sync?.gistId) {
      didInitialPull.current = true;
      syncPull();
    }
  }, [loaded, settings.sync, syncPull]);

  // auto-push on changes (debounced)
  useEffect(() => {
    if (!loaded) return;
    if (!settings.sync?.enabled || !settings.sync?.gistId) return;
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => syncPush(), 2500);
    return () => { if (pushTimer.current) clearTimeout(pushTimer.current); };
  }, [prog, streak, audio, history, loaded, settings.sync, syncPush]);

  if (!loaded) {
    return (
      <div className="ws-root ws-load">
        <Styles />
        <Waves size={40} />
        <p>Loading your tide…</p>
      </div>
    );
  }

  const ctx = {
    cards, prog, audio, streak, view, setView, session, setSession,
    recordCard, saveAudio, togglePin, playCard, bumpStreak, saveProg,
    exportData, importData, settings, saveSettings,
    syncState, connectGist, disconnectGist, syncPull, syncPush,
    lessons, lessonId, setLessonId, completeLessonPart, startLessonPart,
    learnTarget, setLearnTarget, learnSection, setLearnSection,
    history, logAttempt,
  };

  return (
    <div className="ws-root">
      <Styles />
      {view === "home" && <HomeView ctx={ctx} />}
      {view === "learn" && <LearnView ctx={ctx} />}
      {view === "lesson" && <LessonView ctx={ctx} />}
      {view === "setup" && <SetupView ctx={ctx} />}
      {view === "session" && <SessionView key={JSON.stringify(session)} ctx={ctx} />}
      {view === "needswork" && <NeedsWorkView ctx={ctx} />}
      {view === "history" && <HistoryView ctx={ctx} />}
      {view === "browse" && <BrowseView ctx={ctx} />}
      {view === "pronounce" && <PronounceView ctx={ctx} />}
      {view === "backup" && <BackupView ctx={ctx} />}
    </div>
  );
}

/* ============================ HOME ============================ */
function HomeView({ ctx }) {
  const { cards, prog, streak, setView, setSession, audio, lessons, setLearnTarget, setLearnSection } = ctx;
  const curLesson = nextLesson(lessons);
  // open a section's own page; optionally scroll to a lesson within it
  const openSection = (sid, lessonId = null) => { setLearnSection(sid); setLearnTarget(lessonId); setView("learn"); };
  const total = cards.length;
  let mastered = 0, learning = 0, fresh = 0, sumPct = 0, due = 0;
  cards.forEach((c) => {
    const st = prog[c.id];
    sumPct += masteryPct(st);
    if (!st || st.seen === 0) fresh++;
    else if (st.box >= 4) mastered++;
    else learning++;
    if (isDue(st)) due++;
  });
  const overall = total ? sumPct / total : 0;
  const needsWork = cards.filter((c) => needsWorkCard(prog[c.id])).length;
  const voiced = Object.keys(audio).length;
  const streakDays = currentStreak(streak.days);

  const startReview = (deckKeys, dir, mode) => {
    setSession({ deckKeys, dir, mode, limit: 15 });
    setView("session");
  };

  return (
    <div className="ws-page">
      <header className="ws-head">
        <div>
          <div className="ws-eyebrow">Aplikasyon han Waray</div>
          <h1 className="ws-title">Sulog</h1>
          <div className="ws-sub">Your lessons, between lessons · Daram, Samar</div>
        </div>
        <div className="ws-head-btns">
          <button className="ws-icon-btn" onClick={() => setView("backup")} title="Backup & sync">
            <Cloud size={20} />
          </button>
          <button className="ws-icon-btn" onClick={() => setView("pronounce")} title="Pronunciation guide">
            <Ear size={20} />
          </button>
        </div>
      </header>

      <TideHero pct={overall} mastered={mastered} total={total} />

      <div className="ws-streakrow">
        <div className="ws-chip ws-chip-flame">
          <Flame size={16} />
          <b>{streakDays}</b><span>day{streakDays === 1 ? "" : "s"}</span>
        </div>
        <div className="ws-chip">
          <Target size={15} /><b>{due}</b><span>due now</span>
        </div>
        <div className="ws-chip">
          <Mic size={15} /><b>{voiced}</b><span>in your voice</span>
        </div>
      </div>

      <DayTracker streak={streak} />

      <div className="ws-cta-grid">
        <button className="ws-cta ws-cta-primary" onClick={() => openSection(curLesson.section.id, curLesson.id)}>
          <div className="ws-cta-ic"><BookOpen size={20} /></div>
          <div>
            <div className="ws-cta-t">Continue learning</div>
            <div className="ws-cta-d">{curLesson.section.name} · {curLesson.unit.name}</div>
            <div className="ws-cta-sub">{curLesson.title}</div>
          </div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
        <button className="ws-cta" onClick={() => startReview(Object.keys(DECKS), "wte", "mc")}>
          <div className="ws-cta-ic ws-ic-tide"><Sparkles size={18} /></div>
          <div>
            <div className="ws-cta-t">Quick mix{due ? ` · ${due} due` : ""}</div>
            <div className="ws-cta-d">Waray → English, multiple choice</div>
          </div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
        <button className="ws-cta" onClick={() => setView("needswork")}>
          <div className="ws-cta-ic ws-ic-coral"><AlertCircle size={18} /></div>
          <div>
            <div className="ws-cta-t">Needs work {needsWork ? <span className="ws-badge">{needsWork}</span> : null}</div>
            <div className="ws-cta-d">The words & phrases you keep missing</div>
          </div>
          <ChevronRight size={18} className="ws-cta-arrow" />
        </button>
      </div>

      <SectionLabel icon={<Layers size={14} />} text="Units" />
      <div className="ws-units">
        {CURRICULUM.map((s) => {
          const sc = sectionCards(cards, s);
          let f = 0, l = 0, m = 0;
          sc.forEach((c) => {
            const st = prog[c.id];
            if (!st || st.seen === 0) f++;
            else if (st.box >= 4) m++;
            else l++;
          });
          const lessonsDone = s.units.flatMap((u) => u.lessons).filter((l2) => lessonDone(lessons, l2.id)).length;
          const lessonsTot = s.units.flatMap((u) => u.lessons).length;
          return (
            <button key={s.id} className="ws-unit-tile" onClick={() => openSection(s.id)}>
              <div className="ws-unit-tile-top">
                <span className="ws-unit-tile-name">{s.name}</span>
                <span className="ws-unit-tile-meta">{lessonsDone}/{lessonsTot} lessons<ChevronRight size={15} /></span>
              </div>
              <div className="ws-unit-tile-sub">tap to review or re-learn</div>
              <Distribution fresh={f} learning={l} mastered={m} />
              <ConstellationGrid cards={sc} prog={prog} />
            </button>
          );
        })}
      </div>

      <div className="ws-build">build {buildLabel()}</div>

      <div className="ws-bottombar">
        <button className="ws-bb active"><Home size={18} /><span>Home</span></button>
        <button className="ws-bb" onClick={() => openSection(curLesson.section.id, curLesson.id)}><BookOpen size={18} /><span>Learn</span></button>
        <button className="ws-bb" onClick={() => setView("history")}><Trophy size={18} /><span>History</span></button>
        <button className="ws-bb" onClick={() => setView("browse")}><List size={18} /><span>All cards</span></button>
        <button className="ws-bb" onClick={() => setView("pronounce")}><Ear size={18} /><span>Sounds</span></button>
      </div>
    </div>
  );
}

function TideHero({ pct, mastered, total }) {
  const fill = 100 - Math.round(pct * 100);
  return (
    <div className="ws-tide">
      <svg viewBox="0 0 400 200" className="ws-tide-svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0a2e34" />
            <stop offset="100%" stopColor="#0e4951" />
          </linearGradient>
          <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#16a3ab" />
            <stop offset="100%" stopColor="#0c6b73" />
          </linearGradient>
        </defs>
        <rect width="400" height="200" fill="url(#sky)" />
        <circle cx="320" cy="52" r="26" fill="#f4a53a" opacity="0.95" />
        <circle cx="320" cy="52" r="40" fill="#f4a53a" opacity="0.18" />
        <g style={{ transform: `translateY(${fill}%)`, transition: "transform 1.1s cubic-bezier(.2,.8,.2,1)" }}>
          <path className="ws-wave1" d="M0,30 C60,12 120,48 200,30 C280,12 340,48 400,30 L400,200 L0,200 Z" fill="url(#sea)" opacity="0.92" />
          <path className="ws-wave2" d="M0,40 C80,22 140,58 200,40 C260,22 340,58 400,40 L400,200 L0,200 Z" fill="#0c6b73" opacity="0.55" />
        </g>
      </svg>
      <div className="ws-tide-overlay">
        <div className="ws-tide-pct">{Math.round(pct * 100)}<span>%</span></div>
        <div className="ws-tide-label">mastered · {mastered}/{total} cards</div>
      </div>
    </div>
  );
}

/* A strip of the last 14 days: a filled cell per day (intensity = how many
   reviews that day) plus the current day-streak, both from streak.days. */
function DayTracker({ streak }) {
  const N = 14;
  const map = streak.days || {};
  const W = ["S", "M", "T", "W", "T", "F", "S"];
  const base = new Date();
  const days = [];
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ key, count: map[key] || 0, dow: d.getDay(), isToday: i === 0 });
  }
  const level = (c) => (c === 0 ? 0 : c <= 2 ? 1 : c <= 5 ? 2 : 3);
  const run = currentStreak(map);

  return (
    <div className="ws-tracker">
      <div className="ws-tracker-head">
        <span className="ws-tracker-title">Last 14 days</span>
        <span className="ws-tracker-streak"><Flame size={13} /> {run}-day streak</span>
      </div>
      <div className="ws-tracker-grid">
        {days.map((d) => (
          <div key={d.key} className={`ws-day ${d.isToday ? "today" : ""}`}
            title={`${d.key} · ${d.count} review${d.count === 1 ? "" : "s"}`}>
            <div className={`ws-day-cell lv${level(d.count)}`} />
            <span className="ws-day-lbl">{W[d.dow]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Distribution({ fresh, learning, mastered }) {
  const tot = fresh + learning + mastered || 1;
  return (
    <div className="ws-dist">
      <div className="ws-dist-bar">
        <div style={{ width: `${(mastered / tot) * 100}%` }} className="ws-seg ws-seg-m" />
        <div style={{ width: `${(learning / tot) * 100}%` }} className="ws-seg ws-seg-l" />
        <div style={{ width: `${(fresh / tot) * 100}%` }} className="ws-seg ws-seg-f" />
      </div>
      <div className="ws-dist-legend">
        <span><i className="ws-dot ws-dot-m" />Mastered {mastered}</span>
        <span><i className="ws-dot ws-dot-l" />Learning {learning}</span>
        <span><i className="ws-dot ws-dot-f" />New {fresh}</span>
      </div>
    </div>
  );
}

function ConstellationGrid({ cards, prog }) {
  return (
    <div className="ws-constel">
      {cards.map((c) => {
        const p = masteryPct(prog[c.id]);
        const st = prog[c.id];
        let cls = "ws-cell-f";
        if (st && st.seen > 0) cls = p >= 0.8 ? "ws-cell-m" : p >= 0.4 ? "ws-cell-l3" : "ws-cell-l1";
        return <div key={c.id} className={`ws-cell ${cls}`} title={`${c.waray} — ${c.english}`} />;
      })}
    </div>
  );
}

/* ============================ SETUP ============================ */
function SetupView({ ctx }) {
  const { cards, prog, setView, setSession } = ctx;
  const [decks, setDecks] = useState(Object.keys(DECKS));
  const [dir, setDir] = useState("wte");
  const [mode, setMode] = useState("mc");

  const toggle = (k) => setDecks((d) => d.includes(k) ? d.filter((x) => x !== k) : [...d, k]);
  const pool = cards.filter((c) => decks.includes(c.deck));
  const dueN = pool.filter((c) => isDue(prog[c.id])).length;

  const MODES = [
    { k: "mc", icon: <Layers size={18} />, t: "Multiple choice", d: "Tap the right answer — easiest" },
    { k: "type", icon: <Pencil size={18} />, t: "Type it", d: "Write the answer from memory" },
    { k: "flash", icon: <RotateCcw size={18} />, t: "Flashcard", d: "Flip and grade yourself" },
    { k: "listen", icon: <Ear size={18} />, t: "Listen & answer", d: "Hear it, then pick the meaning" },
    { k: "speak", icon: <Mic size={18} />, t: "Speak it", d: "Say it aloud, compare to your voice" },
  ];

  return (
    <div className="ws-page">
      <TopBar title="Set up your review" onBack={() => setView("home")} />

      <SectionLabel text="Decks" />
      <div className="ws-pick-grid">
        {Object.keys(DECKS).map((k) => (
          <button key={k} className={`ws-pick ${decks.includes(k) ? "on" : ""}`} onClick={() => toggle(k)}>
            <span className="ws-pick-check">{decks.includes(k) ? <Check size={14} /> : null}</span>
            <span className="ws-pick-name">{DECKS[k].short}</span>
            <span className="ws-pick-n">{cards.filter((c) => c.deck === k).length}</span>
          </button>
        ))}
      </div>

      <SectionLabel text="Direction" />
      <div className="ws-seg-toggle">
        <button className={dir === "wte" ? "on" : ""} onClick={() => setDir("wte")}>
          Waray → English <em>easier</em>
        </button>
        <button className={dir === "etw" ? "on" : ""} onClick={() => setDir("etw")}>
          English → Waray <em>harder</em>
        </button>
      </div>

      <SectionLabel text="Mode" />
      <div className="ws-mode-list">
        {MODES.map((m) => (
          <button key={m.k} className={`ws-mode ${mode === m.k ? "on" : ""}`} onClick={() => setMode(m.k)}>
            <span className="ws-mode-ic">{m.icon}</span>
            <span className="ws-mode-txt"><b>{m.t}</b><i>{m.d}</i></span>
            <span className="ws-mode-radio">{mode === m.k ? <span className="ws-radio-on" /> : null}</span>
          </button>
        ))}
      </div>

      <div className="ws-setup-foot">
        <div className="ws-setup-meta">{pool.length} cards · {dueN} due now</div>
        <button
          className="ws-start"
          disabled={!decks.length}
          onClick={() => { setSession({ deckKeys: decks, dir, mode, limit: 15 }); setView("session"); }}
        >
          Start <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ============================ SESSION ============================ */
function buildQueue(cards, prog, deckKeys, limit, only) {
  const pool = only
    ? cards.filter((c) => only.includes(c.id))
    : cards.filter((c) => deckKeys.includes(c.deck));
  const dueCards = pool.filter((c) => isDue(prog[c.id]));
  const rest = pool.filter((c) => !isDue(prog[c.id]))
    .sort((a, b) => (prog[a.id]?.last || 0) - (prog[b.id]?.last || 0));
  const ordered = [...shuffle(dueCards), ...rest].slice(0, limit);
  return shuffle(ordered);
}
function shuffle(a) {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[x[i], x[j]] = [x[j], x[i]]; }
  return x;
}

function SessionView({ ctx }) {
  const { cards, prog, session, setView, recordCard, bumpStreak, completeLessonPart, logAttempt } = ctx;
  const queue = useRef(buildQueue(cards, prog, session.deckKeys, session.limit, session.only)).current;
  const [i, setI] = useState(0);
  const [tally, setTally] = useState({ right: 0, wrong: 0 });
  const [results, setResults] = useState([]); // {id, prompt, answer, given, correct}
  const [done, setDone] = useState(queue.length === 0);

  const card = queue[i];

  const finish = (passed) => {
    setDone(true);
    if (passed && session.lesson) completeLessonPart(session.lesson.id, session.lesson.part);
  };
  const onResult = (correct, given) => {
    recordCard(card.id, correct);
    bumpStreak();
    const prompt = session.dir === "wte" ? card.waray : card.english;
    const answer = session.dir === "wte" ? card.english : card.waray;
    logAttempt({ ts: Date.now(), waray: card.waray, prompt, answer, given: given || "", correct, dir: session.dir, mode: session.mode });
    setTally((t) => ({ right: t.right + (correct ? 1 : 0), wrong: t.wrong + (correct ? 0 : 1) }));
    setResults((r) => [...r, { id: card.id, prompt, answer, given: given || "", correct }]);
    if (i + 1 >= queue.length) {
      const right = tally.right + (correct ? 1 : 0);
      finish(queue.length > 0 && right / queue.length >= PASS_PCT);
    } else setI(i + 1);
  };

  if (done) return <SessionDone ctx={ctx} tally={tally} total={queue.length} results={results} />;
  if (!card) return <SessionDone ctx={ctx} tally={tally} total={0} results={results} />;

  const distractors = pickDistractors(cards, card, session.dir);

  return (
    <div className="ws-page ws-session">
      <div className="ws-session-top">
        <button className="ws-icon-btn" onClick={() => setView("home")}><X size={20} /></button>
        <div className="ws-progress-track">
          <div className="ws-progress-fill" style={{ width: `${(i / queue.length) * 100}%` }} />
        </div>
        <div className="ws-session-count">{i + 1}/{queue.length}</div>
      </div>

      <CardReview
        key={card.id}
        card={card} dir={session.dir} mode={session.mode}
        distractors={distractors} ctx={ctx} onResult={onResult}
      />
    </div>
  );
}

function pickDistractors(cards, card, dir) {
  const field = dir === "wte" ? "english" : "waray";
  const same = cards.filter((c) => c.deck === card.deck && c.id !== card.id);
  const pool = same.length >= 3 ? same : cards.filter((c) => c.id !== card.id);
  return shuffle(pool).slice(0, 3).map((c) => c[field]);
}

function CardReview({ card, dir, mode, distractors, ctx, onResult }) {
  const { playCard, saveAudio, audio } = ctx;
  const promptField = dir === "wte" ? "waray" : "english";
  const answerField = dir === "wte" ? "english" : "waray";
  const prompt = card[promptField];
  const answer = card[answerField];
  const promptIsWaray = promptField === "waray";

  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [judged, setJudged] = useState(null); // 'right'|'wrong'|null
  const [picked, setPicked] = useState(null);

  const options = useRef(shuffle([answer, ...distractors])).current;

  // auto-play for listen mode
  useEffect(() => {
    if (mode === "listen") setTimeout(() => playCard(card), 250);
  }, []);

  const judge = (correct) => { setJudged(correct ? "right" : "wrong"); };

  /* ---- MULTIPLE CHOICE ---- */
  if (mode === "mc" || mode === "listen") {
    const listening = mode === "listen";
    return (
      <div className="ws-card">
        <div className="ws-card-tag">{DECKS[card.deck].short} · {listening ? "Listen" : dir === "wte" ? "Waray → English" : "English → Waray"}</div>
        {listening ? (
          <button className="ws-listen-big" onClick={() => playCard(card)}>
            <Volume2 size={30} /><span>Tap to hear</span>
            {audio[card.id] && <em>your voice</em>}
          </button>
        ) : (
          <PromptBlock text={prompt} isWaray={promptIsWaray} say={promptIsWaray ? card.say : ""}
            onPlay={() => playCard(card)} />
        )}

        <div className="ws-options">
          {options.map((o, k) => {
            let cls = "";
            if (picked !== null) {
              if (o === answer) cls = "correct";
              else if (o === options[picked]) cls = "incorrect";
            }
            return (
              <button key={k} className={`ws-opt ${cls}`} disabled={picked !== null}
                onClick={() => { setPicked(k); judge(o === answer); }}>
                {o}
              </button>
            );
          })}
        </div>

        {judged && <Verdict card={card} ctx={ctx} answer={answer} correct={judged === "right"}
          given={picked !== null ? options[picked] : ""} dir={dir}
          showWaray onResult={(corr) => onResult(corr, picked !== null ? options[picked] : "")} />}
      </div>
    );
  }

  /* ---- TYPE IT ---- */
  if (mode === "type") {
    return (
      <div className="ws-card">
        <div className="ws-card-tag">{DECKS[card.deck].short} · Type the {dir === "wte" ? "English" : "Waray"}</div>
        <PromptBlock text={prompt} isWaray={promptIsWaray} say={promptIsWaray ? card.say : ""}
          onPlay={() => playCard(card)} />
        {!judged ? (
          <>
            <input className="ws-input" autoFocus value={typed} placeholder="Type your answer…"
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && typed.trim()) judge(checkAnswer(typed, answer, dir === "etw")); }} />
            <button className="ws-check" disabled={!typed.trim()} onClick={() => judge(checkAnswer(typed, answer, dir === "etw"))}>
              Check
            </button>
          </>
        ) : (
          <>
            <div className={`ws-yourans ${judged}`}>{typed || "—"}</div>
            <Verdict card={card} ctx={ctx} answer={answer} correct={judged === "right"}
              given={typed} dir={dir}
              showWaray={dir === "etw"} onResult={(corr) => onResult(corr, typed)} allowOverride />
          </>
        )}
      </div>
    );
  }

  /* ---- FLASHCARD ---- */
  if (mode === "flash") {
    return (
      <div className="ws-card">
        <div className="ws-card-tag">{DECKS[card.deck].short} · Flashcard</div>
        <PromptBlock text={prompt} isWaray={promptIsWaray} say={promptIsWaray ? card.say : ""}
          onPlay={() => playCard(card)} />
        {!revealed ? (
          <button className="ws-reveal" onClick={() => setRevealed(true)}>Show answer</button>
        ) : (
          <>
            <div className="ws-answer-reveal">
              <span className="ws-answer-text">{answer}</span>
              {answerField === "waray" && <button className="ws-mini-play" onClick={() => playCard(card)}><Volume2 size={16} /></button>}
            </div>
            {card.subtext && <div className="ws-subtext">{card.subtext}</div>}
            <SelfGrade onResult={onResult} />
          </>
        )}
      </div>
    );
  }

  /* ---- SPEAK IT ---- */
  if (mode === "speak") {
    return (
      <SpeakCard card={card} dir={dir} prompt={prompt} answer={answer}
        promptIsWaray={promptIsWaray} ctx={ctx} onResult={onResult} />
    );
  }
  return null;
}

function PromptBlock({ text, isWaray, say, onPlay }) {
  return (
    <div className="ws-prompt">
      <div className={isWaray ? "ws-prompt-waray" : "ws-prompt-eng"}>{text}</div>
      {isWaray && say && <div className="ws-say">/ {say} /</div>}
      {isWaray && (
        <button className="ws-mini-play" onClick={onPlay}><Volume2 size={16} /> hear it</button>
      )}
    </div>
  );
}

function Verdict({ card, ctx, answer, correct, showWaray, onResult, allowOverride, given, dir }) {
  const { playCard, cards } = ctx;
  // Enter advances — same as clicking Continue. Ignore the keypress that opened
  // this verdict (e.g. the Enter that submitted a typed answer) so one Enter =
  // one step and you don't skip the result screen.
  const shownAt = useRef(Date.now());
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Enter" && !e.repeat && Date.now() - shownAt.current > 250) {
        e.preventDefault();
        onResult(correct);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [correct, onResult]);
  const youSaid = !correct ? explainGiven(cards, given, answer, dir) : null;
  return (
    <div className={`ws-verdict ${correct ? "ok" : "no"}`}>
      <div className="ws-verdict-head">
        {correct ? <><Check size={18} /> Tama! (correct)</> : <><X size={18} /> Not quite</>}
      </div>
      {!correct && (
        <div className="ws-verdict-answer">
          <span>{answer}</span>
          {showWaray && <button className="ws-mini-play" onClick={() => playCard(card)}><Volume2 size={15} /></button>}
        </div>
      )}
      {youSaid && <div className="ws-verdict-yousaid">you said: {youSaid}</div>}
      {card.subtext && <div className="ws-subtext">{card.subtext}</div>}
      <div className="ws-verdict-actions">
        {allowOverride && (
          <button className="ws-ghost-btn" onClick={() => onResult(!correct)}>
            {correct ? "Mark wrong" : "I was right"}
          </button>
        )}
        <button className="ws-next-btn" onClick={() => onResult(correct)}>
          Continue <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function SelfGrade({ onResult }) {
  return (
    <div className="ws-selfgrade">
      <button className="ws-sg ws-sg-no" onClick={() => onResult(false)}><X size={18} />Missed it</button>
      <button className="ws-sg ws-sg-ok" onClick={() => onResult(true)}><Check size={18} />Got it</button>
    </div>
  );
}

/* ---------- speak mode with recording ---------- */
function SpeakCard({ card, dir, prompt, answer, promptIsWaray, ctx, onResult }) {
  const { playCard, saveAudio, audio } = ctx;
  const wantWaray = dir === "etw"; // produce Waray
  const target = wantWaray ? answer : prompt;
  const [rec, setRec] = useState(false);
  const [blobURL, setBlobURL] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [err, setErr] = useState("");
  const mr = useRef(null);
  const chunks = useRef([]);
  const dataURLRef = useRef(null);

  const start = async () => {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const m = new MediaRecorder(stream);
      chunks.current = [];
      m.ondataavailable = (e) => chunks.current.push(e.data);
      m.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setBlobURL(url);
        const fr = new FileReader();
        fr.onload = () => { dataURLRef.current = fr.result; };
        fr.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.current = m;
      m.start();
      setRec(true);
    } catch (e) {
      setErr("Mic isn't available here. You can still say it aloud and self-grade.");
    }
  };
  const stop = () => { try { mr.current && mr.current.stop(); } catch (e) {} setRec(false); };

  const saveAsVoice = () => {
    const dataURL = dataURLRef.current;
    if (dataURL) saveAudio(card.id, dataURL);
  };

  return (
    <div className="ws-card">
      <div className="ws-card-tag">{DECKS[card.deck].short} · Speak it</div>
      <div className="ws-speak-prompt">
        <div className="ws-speak-instr">Say this in Waray:</div>
        <div className="ws-prompt-eng">{wantWaray ? prompt : answer}</div>
      </div>

      <div className="ws-speak-controls">
        {!rec ? (
          <button className="ws-rec-btn" onClick={start}><Mic size={22} /> Record yourself</button>
        ) : (
          <button className="ws-rec-btn recording" onClick={stop}><Square size={18} /> Stop</button>
        )}
        {blobURL && (
          <div className="ws-rec-playback">
            <button className="ws-mini-play" onClick={() => new Audio(blobURL).play()}><Play size={15} /> your take</button>
            <button className="ws-mini-play" onClick={saveAsVoice}><Star size={14} /> save as this card's voice</button>
          </div>
        )}
      </div>
      {err && <div className="ws-mic-err">{err}</div>}

      {!revealed ? (
        <button className="ws-reveal" onClick={() => { setRevealed(true); playCard(card); }}>
          Reveal & compare
        </button>
      ) : (
        <>
          <div className="ws-answer-reveal">
            <span className="ws-answer-text">{target}</span>
            <button className="ws-mini-play" onClick={() => playCard(card)}>
              <Volume2 size={16} />{audio[card.id] ? " your saved voice" : " reference"}
            </button>
          </div>
          {card.say && <div className="ws-say">/ {card.say} /</div>}
          <SelfGrade onResult={onResult} />
        </>
      )}
    </div>
  );
}

function SessionDone({ ctx, tally, total, results = [] }) {
  const { setView, setSession, session, cards } = ctx;
  const acc = total ? Math.round((tally.right / total) * 100) : 0;
  const inLesson = !!session?.lesson;
  const passed = acc >= PASS_PCT * 100;
  const missed = results.filter((r) => !r.correct);
  const allIds = results.map((r) => r.id);
  const missedIds = missed.map((r) => r.id);

  const rerun = (ids) => { setSession({ ...session, only: ids, limit: ids.length, nonce: Date.now() }); setView("session"); };

  return (
    <div className="ws-page ws-done">
      <div className="ws-done-card">
        <div className={`ws-done-ring ${inLesson && !passed ? "fail" : ""}`} style={{ "--p": acc }}>
          <span>{acc}<i>%</i></span>
        </div>
        <h2>{inLesson ? (passed ? "Pasado!" : "Liwat anay") : "Human na!"}</h2>
        {inLesson && (
          <div className={`ws-passpill ${passed ? "ok" : "no"}`}>
            {passed ? <><Check size={14} /> Passed · part cleared</> : <><X size={14} /> Not passed — score {PASS_PCT * 100}% to clear it</>}
          </div>
        )}
        <p className="ws-done-sub">{total === 0 ? "Nothing was due — come back later." : `${tally.right} right · ${tally.wrong} to revisit`}</p>

        {missed.length > 0 && (
          <div className="ws-missed">
            <div className="ws-missed-label">Missed ({missed.length})</div>
            {missed.map((r, k) => {
              const said = explainGiven(cards, r.given, r.answer, session.dir);
              return (
                <div key={k} className="ws-missed-row">
                  <div className="ws-missed-prompt">{r.prompt}</div>
                  <div className="ws-missed-ans">
                    <span className="ws-missed-yours">{r.given || "—"}</span>
                    <ArrowLeft size={12} className="ws-missed-arr" />
                    <span className="ws-missed-correct">{r.answer}</span>
                  </div>
                  {said && <div className="ws-missed-said">you said: {said}</div>}
                </div>
              );
            })}
          </div>
        )}

        <div className="ws-done-actions">
          {results.length > 0 && (
            <>
              {missedIds.length > 0 && <button className="ws-start" onClick={() => rerun(missedIds)}><RotateCcw size={17} /> Review missed</button>}
              <button className={missedIds.length > 0 ? "ws-ghost-btn" : "ws-start"} onClick={() => rerun(allIds)}><RotateCcw size={17} /> Review all</button>
            </>
          )}
          {inLesson ? (
            <button className="ws-ghost-btn" onClick={() => setView("lesson")}>Back to lesson</button>
          ) : (
            <button className="ws-ghost-btn" onClick={() => setView("home")}><Home size={16} /> Home</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ LEARN PATH ============================ */
function LearnView({ ctx }) {
  const { cards, lessons, setView, setLessonId, setLearnSection, learnTarget, learnSection } = ctx;
  const cur = nextLesson(lessons);
  const s = CURRICULUM.find((x) => x.id === learnSection) || cur.section;
  // scroll to the lesson the user came in on (else the current lesson, if here)
  useEffect(() => {
    const id = learnTarget || cur.id;
    const t = setTimeout(() => {
      const el = document.getElementById("ln-" + id);
      if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 60);
    return () => clearTimeout(t);
  }, []);
  const all = s.units.flatMap((u) => u.lessons);
  const sDone = all.filter((l) => lessonDone(lessons, l.id)).length;
  return (
    <div className="ws-page">
      <TopBar title={s.name} onBack={() => setView("home")} />
      <div className="ws-learn">
        <div className="ws-section">
          <div className="ws-section-head">
            <div className="ws-section-hint">{s.hint}</div>
            <div className="ws-section-prog">{sDone}/{all.length}</div>
          </div>
          {s.units.map((u) => {
            const uDone = u.lessons.filter((l) => lessonDone(lessons, l.id)).length;
            return (
              <div key={u.id} id={"ln-" + u.id} className="ws-unit">
                <div className="ws-unit-head">
                  <div>
                    <div className="ws-unit-name">{u.name}</div>
                    <div className="ws-unit-hint">{u.hint}</div>
                  </div>
                  <div className="ws-unit-prog">{uDone}/{u.lessons.length}</div>
                </div>
                <div className="ws-lessons">
                  {u.lessons.map((l) => {
                    const done = lessons[l.id] || 0;
                    const unlocked = lessonUnlocked(lessons, l.id);
                    const complete = lessonDone(lessons, l.id);
                    const isCur = l.id === cur.id;
                    const n = lessonCards(cards, l).length;
                    return (
                      <button key={l.id} id={"ln-" + l.id} className={`ws-lnode ${unlocked ? "" : "locked"} ${complete ? "done" : ""} ${isCur ? "cur" : ""}`}
                        disabled={!unlocked}
                        onClick={() => { setLessonId(l.id); setLearnSection(s.id); setView("lesson"); }}>
                        <div className="ws-lnode-ring" style={{ "--p": (done / LESSON_PARTS.length) * 100 }}>
                          {complete ? <Check size={16} /> : <span>{done}/{LESSON_PARTS.length}</span>}
                        </div>
                        <div className="ws-lnode-body">
                          <div className="ws-lnode-title">{l.title}</div>
                          <div className="ws-lnode-sub">
                            {complete ? "Complete · tap to review" : unlocked ? (isCur ? "Continue" : "Start") : "Locked"} · {n} item{n === 1 ? "" : "s"}
                          </div>
                        </div>
                        {unlocked && <ChevronRight size={16} className="ws-lnode-arr" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LessonView({ ctx }) {
  const { cards, lessons, lessonId, setView, setLearnSection, startLessonPart, playCard } = ctx;
  const lesson = LESSON_FLOW.find((l) => l.id === lessonId) || nextLesson(lessons);
  const items = lessonCards(cards, lesson);
  const done = lessons[lesson.id] || 0;
  return (
    <div className="ws-page">
      <TopBar title={lesson.unit.name} onBack={() => { setLearnSection(lesson.section.id); setView("learn"); }} />
      <h2 className="ws-lesson-title">{lesson.title}</h2>

      <SectionLabel text="Words & phrases" />
      <div className="ws-lwords">
        {items.map((c) => (
          <button key={c.id} className="ws-lword" onClick={() => playCard(c)}>
            <div>
              <div className="ws-lword-w">{c.waray}</div>
              {c.say && <div className="ws-lword-say">/ {c.say} /</div>}
            </div>
            <div className="ws-lword-e">{c.english}</div>
          </button>
        ))}
      </div>

      <SectionLabel text="Clear all 4 to finish" />
      <div className="ws-parts">
        {LESSON_PARTS.map((p, k) => {
          const completed = done > k;
          const available = done >= k && items.length > 0;
          return (
            <button key={k} className={`ws-part ${completed ? "done" : ""} ${done === k ? "cur" : ""}`}
              disabled={!available} onClick={() => startLessonPart(lesson, k)}>
              <div className="ws-part-num">{completed ? <Check size={15} /> : k + 1}</div>
              <div className="ws-part-body">
                <div className="ws-part-label">{p.label}</div>
                <div className="ws-part-hint">{p.hint}</div>
              </div>
              <span className="ws-part-cta">{completed ? "Review" : done === k ? "Start" : ""}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================ HISTORY ============================ */
function HistoryView({ ctx }) {
  const { history, setView, cards } = ctx;
  const days = {};
  for (const e of history) {
    const d = new Date(e.ts).toISOString().slice(0, 10);
    (days[d] = days[d] || []).push(e);
  }
  const dayKeys = Object.keys(days).sort().reverse();
  const totalRight = history.filter((e) => e.correct).length;
  const overallAcc = history.length ? Math.round((totalRight / history.length) * 100) : 0;
  return (
    <div className="ws-page">
      <TopBar title="History" onBack={() => setView("home")} />
      {history.length === 0 ? (
        <div className="ws-empty">
          <Trophy size={28} />
          <p>No attempts yet. Every answer — right and wrong — collects here by day so you can track your progress and revisit what you missed.</p>
        </div>
      ) : (
        <>
          <div className="ws-hist-overall">{history.length} answers · {overallAcc}% correct</div>
          {dayKeys.map((d) => {
            const es = days[d];
            const right = es.filter((e) => e.correct).length;
            const acc = Math.round((right / es.length) * 100);
            const misses = es.filter((e) => !e.correct);
            const label = new Date(d + "T00:00").toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
            return (
              <div key={d} className="ws-hist-day">
                <div className="ws-hist-dayhead">
                  <span className="ws-hist-date">{label}</span>
                  <span className="ws-hist-acc">{right}/{es.length} · {acc}%</span>
                </div>
                {misses.map((e, k) => {
                  const said = explainGiven(cards, e.given, e.answer, e.dir);
                  return (
                    <div key={k} className="ws-hist-miss">
                      <span className="ws-hist-prompt">{e.prompt}</span>
                      <span className="ws-hist-yours">{e.given || "—"}</span>
                      <ArrowLeft size={11} className="ws-missed-arr" />
                      <span className="ws-hist-correct">{e.answer}</span>
                      {said && <span className="ws-hist-said">({said})</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

/* ============================ NEEDS WORK ============================ */
function NeedsWorkView({ ctx }) {
  const { cards, prog, setView, setSession, playCard, togglePin } = ctx;
  // rank by how much you struggle: most-missed first, then lowest accuracy
  const items = cards.filter((c) => needsWorkCard(prog[c.id]))
    .sort((a, b) => {
      const sa = prog[a.id], sb = prog[b.id];
      const byWrong = (sb?.wrong || 0) - (sa?.wrong || 0);
      return byWrong || accuracy(sa) - accuracy(sb);
    });
  const drill = items.slice(0, 20); // redrill the worst ~20 in one go

  return (
    <div className="ws-page">
      <TopBar title="Needs work" onBack={() => setView("home")} />
      {items.length === 0 ? (
        <div className="ws-empty">
          <Sparkles size={28} />
          <p>Nothing to redrill yet. Anything you miss — or pin with the star — collects here, worst first, so you can hammer the hard ones.</p>
        </div>
      ) : (
        <>
          <button className="ws-start ws-full" onClick={() => {
            setSession({ deckKeys: Object.keys(DECKS), dir: "wte", mode: "mc", limit: drill.length, only: drill.map((c) => c.id) });
            setView("session");
          }}>
            <Play size={18} /> Drill {drill.length === items.length ? `these ${items.length}` : `top ${drill.length}`}
          </button>
          <div className="ws-nw-list">
            {items.map((c) => {
              const st = prog[c.id];
              return (
                <div key={c.id} className="ws-nw">
                  <button className="ws-mini-play sq" onClick={() => playCard(c)}><Volume2 size={16} /></button>
                  <div className="ws-nw-body">
                    <div className="ws-nw-waray">{c.waray}</div>
                    <div className="ws-nw-eng">{c.english}</div>
                  </div>
                  <div className="ws-nw-meta">
                    <span className="ws-nw-miss" title="times missed">×{st?.wrong || 0}</span>
                    <button className={`ws-pin ${st?.pinned ? "on" : ""}`} onClick={() => togglePin(c.id)}>
                      <Star size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ============================ BROWSE ============================ */
function BrowseView({ ctx }) {
  const { cards, prog, setView, playCard, saveAudio, audio, togglePin } = ctx;
  const [deck, setDeck] = useState("all");
  const [q, setQ] = useState("");
  const list = cards.filter((c) =>
    (deck === "all" || c.deck === deck) &&
    (!q || (c.waray + c.english).toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="ws-page">
      <TopBar title="All cards" onBack={() => setView("home")} />
      <input className="ws-search" placeholder="Search Waray or English…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="ws-filter-row">
        <button className={deck === "all" ? "on" : ""} onClick={() => setDeck("all")}>All</button>
        {Object.keys(DECKS).map((k) => (
          <button key={k} className={deck === k ? "on" : ""} onClick={() => setDeck(k)}>{DECKS[k].short}</button>
        ))}
      </div>
      <div className="ws-browse-list">
        {list.map((c) => (
          <BrowseRow key={c.id} card={c} st={prog[c.id]} ctx={ctx} />
        ))}
      </div>
    </div>
  );
}

function BrowseRow({ card, st, ctx }) {
  const { playCard, saveAudio, audio, togglePin } = ctx;
  const [rec, setRec] = useState(false);
  const mr = useRef(null); const chunks = useRef([]);
  const p = masteryPct(st);

  const recordVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const m = new MediaRecorder(stream);
      chunks.current = [];
      m.ondataavailable = (e) => chunks.current.push(e.data);
      m.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const fr = new FileReader();
        fr.onload = () => saveAudio(card.id, fr.result);
        fr.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.current = m; m.start(); setRec(true);
    } catch (e) { alert("Mic isn't available in this view."); }
  };
  const stop = () => { try { mr.current.stop(); } catch (e) {} setRec(false); };

  return (
    <div className="ws-brow">
      <div className="ws-brow-dot" style={{ background: masteryColor(p, st) }} />
      <div className="ws-brow-body">
        <div className="ws-brow-waray">{card.waray}{audio[card.id] && <span className="ws-voiced">●</span>}</div>
        <div className="ws-brow-eng">{card.english}</div>
        {card.say && <div className="ws-brow-say">/ {card.say} /</div>}
      </div>
      <div className="ws-brow-actions">
        <button className="ws-mini-play sq" onClick={() => playCard(card)}><Volume2 size={15} /></button>
        {!rec ? (
          <button className="ws-mini-play sq" onClick={recordVoice} title="Record your pronunciation"><Mic size={15} /></button>
        ) : (
          <button className="ws-mini-play sq rec" onClick={stop}><Square size={13} /></button>
        )}
        <button className={`ws-pin ${st?.pinned ? "on" : ""}`} onClick={() => togglePin(card.id)}><Star size={14} /></button>
      </div>
    </div>
  );
}

function masteryColor(p, st) {
  if (!st || st.seen === 0) return "#cdbfa6";
  if (p >= 0.8) return "#4fb286";
  if (p >= 0.4) return "#3fa9b0";
  return "#e2604a";
}

/* ============================ BACKUP & SYNC ============================ */
function BackupView({ ctx }) {
  const { setView, exportData, importData, prog, audio, settings, syncState, connectGist, disconnectGist, syncPull, syncPush } = ctx;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {kind:'ok'|'err', text}
  const [token, setToken] = useState("");
  const [connecting, setConnecting] = useState(false);
  const fileRef = useRef(null);

  const sync = settings.sync || {};
  const connected = sync.enabled && sync.gistId;

  const doConnect = async () => {
    setConnecting(true);
    try { await connectGist(token); setToken(""); }
    catch (e) { /* error shown via syncState */ }
    finally { setConnecting(false); }
  };

  const cardsWithProgress = Object.values(prog).filter((s) => s && s.seen > 0).length;
  const recordings = Object.keys(audio).length;

  const download = (includeAudio) => {
    try {
      const data = exportData(includeAudio);
      const json = JSON.stringify(data);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const stamp = new Date().toISOString().slice(0, 10);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sulog-backup-${stamp}${includeAudio ? "-with-voice" : ""}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      const kb = Math.max(1, Math.round(json.length / 1024));
      setMsg({ kind: "ok", text: `Saved sulog-backup-${stamp}.json (${kb} KB). Drop it in your Drive folder to keep it in the cloud.` });
    } catch (e) {
      setMsg({ kind: "err", text: "Couldn't create the file here. Try from your own browser tab." });
    }
  };

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data, "merge");
      const n = data.prog ? Object.keys(data.prog).length : 0;
      const r = data.audio ? Object.keys(data.audio).length : 0;
      setMsg({ kind: "ok", text: `Restored ${n} cards${r ? ` and ${r} recordings` : ""}. Your progress is back.` });
    } catch (err) {
      setMsg({ kind: "err", text: err.message || "That file couldn't be read." });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="ws-page">
      <TopBar title="Backup & sync" onBack={() => setView("home")} />

      <div className="ws-pron-intro">
        Your progress lives in this browser only. Export it to a file to keep a backup,
        move it to another device, or park it in the cloud. Save that file to your
        Google Drive and it's safe and reachable anywhere.
      </div>

      <div className="ws-backup-stat">
        <div><b>{cardsWithProgress}</b><span>cards in progress</span></div>
        <div><b>{recordings}</b><span>voice recordings</span></div>
      </div>

      <SectionLabel icon={<Download size={14} />} text="Export" />
      <button className="ws-backup-row" onClick={() => download(false)}>
        <div className="ws-backup-ic"><Download size={18} /></div>
        <div className="ws-backup-txt">
          <b>Progress only</b>
          <i>Small file — mastery, streak, what needs work</i>
        </div>
        <ChevronRight size={18} className="ws-cta-arrow" />
      </button>
      <button className="ws-backup-row" onClick={() => download(true)}>
        <div className="ws-backup-ic ws-ic-tide"><Mic size={18} /></div>
        <div className="ws-backup-txt">
          <b>Everything, incl. your voice</b>
          <i>Larger file — also bundles your recordings</i>
        </div>
        <ChevronRight size={18} className="ws-cta-arrow" />
      </button>

      <SectionLabel icon={<Upload size={14} />} text="Restore" />
      <button className="ws-backup-row" onClick={() => fileRef.current?.click()} disabled={busy}>
        <div className="ws-backup-ic ws-ic-coral"><Upload size={18} /></div>
        <div className="ws-backup-txt">
          <b>{busy ? "Restoring…" : "Import a backup file"}</b>
          <i>Merges in — your current recordings are kept</i>
        </div>
        <ChevronRight size={18} className="ws-cta-arrow" />
      </button>
      <input ref={fileRef} type="file" accept="application/json,.json" onChange={onPick} style={{ display: "none" }} />

      {msg && (
        <div className={`ws-backup-msg ${msg.kind}`}>
          {msg.kind === "ok" ? <Check size={16} /> : <AlertCircle size={16} />}
          <span>{msg.text}</span>
        </div>
      )}

      <SectionLabel icon={<Cloud size={14} />} text="Auto-sync — GitHub Gist" />
      <div className="ws-gist">
        {!connected && (
          <div className="ws-drive-note" style={{ marginBottom: 12 }}>
            Sync across devices automatically with a private GitHub gist — no hosting, no file shuffling.
            Paste a token with the <b>gist</b> scope and Sulog will pull on open and save as you go.
          </div>
        )}

        {!connected && (
          <input
            className="ws-search" type="password" placeholder="GitHub token (ghp_…)"
            value={token} onChange={(e) => setToken(e.target.value)} style={{ marginBottom: 10 }}
          />
        )}

        {/* the connect/disconnect toggle */}
        <button
          className={`ws-start ws-full ${connected ? "ws-connected" : ""}`}
          disabled={connecting || (!connected && !token.trim())}
          onClick={connected ? disconnectGist : doConnect}
        >
          {connecting
            ? <><Cloud size={18} /> Connecting…</>
            : connected
              ? <><Check size={18} /> Connected — tap to disconnect</>
              : <><Cloud size={18} /> Connect &amp; sync</>}
        </button>

        {/* status line — visible whether connected or not */}
        {(connected || syncState.status === "syncing" || syncState.status === "error") && (
          <div className={`ws-sync-status ${syncState.status}`} style={{ marginTop: 10, marginBottom: 0 }}>
            <span className="ws-sync-dot" />
            <span>
              {syncState.status === "syncing" ? "Syncing…"
                : syncState.status === "error" ? "Couldn't sync"
                : syncState.at ? `Synced ${syncState.at}` : "Connected"}
            </span>
            {connected && sync.gistId && <code>{sync.gistId.slice(0, 8)}</code>}
          </div>
        )}
        {syncState.status === "error" && (
          <div className="ws-backup-msg err" style={{ marginTop: 8 }}>
            <AlertCircle size={16} /><span>{syncState.error}</span>
          </div>
        )}

        {connected && (
          <div className="ws-sync-btns" style={{ marginTop: 10 }}>
            <button className="ws-backup-row compact" onClick={() => syncPull()}>
              <Download size={16} /> Pull now
            </button>
            <button className="ws-backup-row compact" onClick={() => syncPush()}>
              <Upload size={16} /> Push now
            </button>
          </div>
        )}

        {!connected && (
          <details className="ws-gist-help">
            <summary>How to get a token (1 min)</summary>
            <ol>
              <li>GitHub → Settings → Developer settings → Personal access tokens → <b>Tokens (classic)</b></li>
              <li>Generate new token (classic). Note: "Sulog". Expiration: your call.</li>
              <li>Tick the single <b>gist</b> scope — nothing else.</li>
              <li>Generate, copy the <b>ghp_…</b> value, paste it above.</li>
            </ol>
            The token is stored only in this browser and used solely to read/write your one private gist. Revoke it on GitHub anytime.
          </details>
        )}

        {connected && (
          <div className="ws-pron-note" style={{ marginTop: 12 }}>
            Auto-saves a few seconds after each change, and pulls when Sulog opens. Open it on another device, paste the same token, and it'll find this gist.
          </div>
        )}
      </div>

      <div className="ws-pron-note" style={{ marginTop: 18 }}>
        Backups are plain JSON — you own the file and can read or keep it anywhere.
      </div>
    </div>
  );
}

/* ============================ PRONOUNCE ============================ */
function PronounceView({ ctx }) {
  const { setView, settings, saveSettings } = ctx;
  const SPEEDS = [
    { k: "slow", label: "Slow", rate: 0.78 },
    { k: "normal", label: "Normal", rate: 0.95 },
    { k: "natural", label: "Natural", rate: 1.1 },
  ];
  // available system voices (populated async via onvoiceschanged)
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    const load = () => { try { setVoices(window.speechSynthesis.getVoices() || []); } catch (e) {} };
    load();
    try { window.speechSynthesis.addEventListener("voiceschanged", load); } catch (e) {}
    return () => { try { window.speechSynthesis.removeEventListener("voiceschanged", load); } catch (e) {} };
  }, []);
  const goodVoices = voices.filter((v) => voiceRank(v) > 0);
  const hasFilipino = voices.some((v) => voiceRank(v) === 3);
  // preview the sample phrase at a given base rate (mirrors the adaptive offset)
  const preview = (r) => speak({ waray: "Maupay nga aga", say: "mah-OO-pigh ngah AH-gah" }, settings.adaptive ? r - 0.1 : r);
  // persist the chosen voice AND apply it to _voiceURI immediately, so the
  // preview uses it without waiting for the settings effect to commit
  const pickVoice = (uri) => {
    saveSettings({ ...settings, voiceURI: uri });
    _voiceURI = uri || null;
  };
  const rules = [
    ["Three vowels", "Waray has just a, i, u. In writing, o is the same sound as u, and e is the same as i — so luto and lutu, or babaye and babayi, are the same word."],
    ["a → \u201cah\u201d", "Always the open ah of \u201cfather.\u201d Never the flat a of \u201ccat.\u201d  ako = ah-KAW."],
    ["i → \u201ceh / ee\u201d", "Slides between the e of \u201cbet\u201d and the ee of \u201csee.\u201d  diri = DEE-ree."],
    ["u → \u201coh / oo\u201d", "Slides between oh and oo.  kulop = KOO-lop, oo = AW-aw."],
    ["The hyphen is a stop", "A hyphen marks a glottal stop — a clean catch in the throat, like the middle of \u201cuh-oh.\u201d  gab-i = gahb·EE, mag-aano = mag·AH·ah·no."],
    ["-ay → \u201cigh\u201d", "The ending -ay sounds like the y in \u201csky.\u201d  maupay = mah-OO-pigh, balay = bah-LIGH, sangkay = sahng-KIGH."],
    ["-aw → \u201cow\u201d", "The ending -aw sounds like \u201cnow.\u201d  ikaw = ee-KOW, sayaw = sah-YOW."],
    ["ng is one sound", "ng is a single nasal, like the end of \u201csing\u201d — even at the start of a word.  hangin = HAH-ngin."],
    ["d \u2194 r", "Between vowels, d often softens toward r. You'll hear both; don't worry about it."],
    ["Stress moves", "Stress isn't fixed and it can change meaning. Lean on the CAPS in each card's respelling, and on your own recordings."],
  ];
  const examples = [
    ["Maupay nga aga", "mah-OO-pigh ngah AH-gah", "Good morning"],
    ["Kumusta ka?", "koo-moos-TAH kah", "How are you?"],
    ["Salamat", "sah-LAH-mat", "Thank you"],
    ["gab-i", "gahb-EE", "evening / night"],
    ["Diri ako maaram", "DEE-ree ah-KAW mah-AH-ram", "I don't know"],
  ];
  return (
    <div className="ws-page">
      <TopBar title="How Waray sounds" onBack={() => setView("home")} />
      <div className="ws-pron-intro">
        Browsers don't speak Waray. A Filipino/Tagalog voice reads it most accurately (Tagalog spelling sounds
        almost like Waray); without one it falls back to an English voice reading a rough respelling. Best of all,
        record your teacher or yourself on any card — that becomes the voice you'll hear from then on.
      </div>

      <SectionLabel icon={<Volume2 size={14} />} text="Playback speed" />
      <div className="ws-speed">
        <div className="ws-speed-seg">
          {SPEEDS.map((s) => (
            <button key={s.k} className={Math.abs(settings.rate - s.rate) < 0.02 ? "on" : ""}
              onClick={() => { saveSettings({ ...settings, rate: s.rate }); preview(s.rate); }}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="ws-speed-slider">
          <label className="ws-speed-glabel">Speed</label>
          <input type="range" min="0.6" max="1.4" step="0.05" value={settings.rate}
            onChange={(e) => saveSettings({ ...settings, rate: parseFloat(e.target.value) })}
            onMouseUp={(e) => preview(parseFloat(e.target.value))}
            onTouchEnd={(e) => preview(parseFloat(e.target.value))}
            aria-label="Playback speed" />
          <span className="ws-speed-val">{settings.rate.toFixed(2)}×</span>
        </div>
        <div className="ws-speed-slider">
          <label className="ws-speed-glabel">Voice</label>
          <select className="ws-voice-select" value={settings.voiceURI || ""}
            onChange={(e) => { pickVoice(e.target.value); preview(settings.rate); }}
            aria-label="Speech voice">
            <option value="">Auto{goodVoices.length ? " (best match)" : ""}</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} ({v.lang}){voiceRank(v) > 0 ? " ★" : ""}
              </option>
            ))}
          </select>
        </div>
        <div className={`ws-voice-note ${goodVoices.length ? "good" : ""}`}>
          {hasFilipino
            ? "A Filipino voice (★) is available — it reads Waray most accurately. Pick it above."
            : goodVoices.length
            ? "No Filipino voice here, but Indonesian/Malay voices (★) are close cousins — same vowels and spelling — and read Waray far more naturally than English. Try one above (e.g. Damayanti or Amira)."
            : "No close-language voice found. A Filipino, Indonesian, or Malay voice reads Waray far better than English — on Mac add one in System Settings → Accessibility → Spoken Content → System Voice → Manage Voices."}
        </div>
        <button className={`ws-speed-adapt ${settings.adaptive ? "on" : ""}`}
          onClick={() => saveSettings({ ...settings, adaptive: !settings.adaptive })}>
          <span className="ws-speed-adapt-box">{settings.adaptive ? <Check size={13} /> : null}</span>
          <span>
            <b>Speed up as I learn</b>
            <i>New cards play slower; the better you know a card, the faster it speaks</i>
          </span>
        </button>
      </div>

      <SectionLabel text="The rules that matter" />
      <div className="ws-rules">
        {rules.map(([t, d], i) => (
          <div key={i} className="ws-rule">
            <div className="ws-rule-t">{t}</div>
            <div className="ws-rule-d">{d}</div>
          </div>
        ))}
      </div>
      <SectionLabel text="Hear the pattern" />
      <div className="ws-pron-ex">
        {examples.map(([w, s, e], i) => (
          <button key={i} className="ws-pron-row" onClick={() => speak({ waray: w, say: s })}>
            <Volume2 size={16} />
            <div>
              <div className="ws-pron-w">{w}</div>
              <div className="ws-pron-s">/ {s} /  ·  {e}</div>
            </div>
          </button>
        ))}
      </div>
      <div className="ws-pron-note">
        Source: Waray phonology (3-vowel system, 16 consonants, stress-based) and the Wikivoyage Waray phrasebook respelling style.
      </div>
    </div>
  );
}

/* ============================ shared bits ============================ */
function TopBar({ title, onBack }) {
  return (
    <div className="ws-topbar">
      <button className="ws-icon-btn" onClick={onBack}><ArrowLeft size={20} /></button>
      <h2>{title}</h2>
      <div style={{ width: 40 }} />
    </div>
  );
}
function SectionLabel({ icon, text }) {
  return <div className="ws-seclabel">{icon}<span>{text}</span></div>;
}
function Bar({ pct }) {
  return <div className="ws-bar"><div className="ws-bar-fill" style={{ width: `${Math.round(pct * 100)}%` }} /></div>;
}

/* ============================ styles ============================ */
function Styles() {
  return (
    <style>{`
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Outfit:wght@300;400;500;600;700&display=swap');

:root{
  --sea-ink:#0a2e34; --sea:#0c6b73; --tide:#16a3ab; --tide-soft:#3fa9b0;
  --sun:#f4a53a; --sun-deep:#e0892a; --coral:#e2604a; --jade:#4fb286;
  --shell:#f7f1e6; --sand:#ece2cf; --sand-deep:#ddcfb4;
  --ink:#15282b; --ink-soft:#4a5d5f; --foam:#ffffff;
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
.ws-root{font-family:'Outfit',system-ui,sans-serif;color:var(--ink);
  background:var(--shell);min-height:100%;max-width:480px;margin:0 auto;
  position:relative;line-height:1.45}
.ws-root *::selection{background:var(--tide);color:#fff}
.ws-load{display:flex;flex-direction:column;align-items:center;justify-content:center;
  gap:14px;min-height:60vh;color:var(--sea)}
.ws-page{padding:18px 16px 90px}

/* header */
.ws-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.ws-eyebrow{font-size:11px;letter-spacing:.18em;text-transform:uppercase;
  color:var(--tide);font-weight:600}
.ws-title{font-family:'Fraunces',serif;font-size:46px;line-height:.95;font-weight:600;
  margin:2px 0 0;color:var(--sea-ink);letter-spacing:-.01em}
.ws-sub{font-size:13px;color:var(--ink-soft);margin-top:4px}
.ws-icon-btn{width:40px;height:40px;border-radius:12px;border:1px solid var(--sand-deep);
  background:var(--foam);color:var(--sea);display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:.15s}
.ws-icon-btn:active{transform:scale(.94)}

/* tide hero */
.ws-tide{position:relative;border-radius:22px;overflow:hidden;height:184px;
  box-shadow:0 10px 30px -12px rgba(10,46,52,.5)}
.ws-tide-svg{width:100%;height:100%;display:block}
.ws-wave1{animation:wave 7s ease-in-out infinite alternate}
.ws-wave2{animation:wave 9s ease-in-out infinite alternate-reverse}
@keyframes wave{from{transform:translateX(-12px)}to{transform:translateX(12px)}}
.ws-tide-overlay{position:absolute;inset:0;display:flex;flex-direction:column;
  justify-content:center;padding-left:24px}
.ws-tide-pct{font-family:'Fraunces',serif;font-size:58px;font-weight:600;color:#fff;
  line-height:.9;text-shadow:0 2px 14px rgba(0,0,0,.25)}
.ws-tide-pct span{font-size:24px;opacity:.8}
.ws-tide-label{color:#eaf7f7;font-size:13px;font-weight:500;margin-top:4px;
  text-shadow:0 1px 8px rgba(0,0,0,.3)}

/* streak chips */
.ws-streakrow{display:flex;gap:8px;margin:14px 0 18px}
.ws-chip{flex:1;background:var(--foam);border:1px solid var(--sand-deep);border-radius:14px;
  padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:1px;color:var(--ink-soft)}
.ws-chip b{font-size:19px;color:var(--ink);font-weight:700;font-family:'Fraunces',serif}
.ws-chip span{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em}
.ws-chip svg{color:var(--tide);margin-bottom:2px}
.ws-chip-flame svg{color:var(--sun-deep)}

/* 14-day tracker */
.ws-tracker{background:var(--foam);border:1px solid var(--sand-deep);border-radius:16px;
  padding:13px 14px 11px;margin-bottom:18px}
.ws-tracker-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:11px}
.ws-tracker-title{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:var(--ink-soft);font-weight:600}
.ws-tracker-streak{display:inline-flex;align-items:center;gap:4px;font-size:12.5px;font-weight:700;color:var(--sun-deep)}
.ws-tracker-grid{display:flex;gap:4px}
.ws-day{flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}
.ws-day-cell{width:100%;aspect-ratio:1;border-radius:5px;background:var(--sand)}
.ws-day-cell.lv1{background:#cdeae8}
.ws-day-cell.lv2{background:var(--tide-soft)}
.ws-day-cell.lv3{background:var(--tide)}
.ws-day.today .ws-day-cell{box-shadow:0 0 0 2px var(--sun-deep)}
.ws-day-lbl{font-size:9px;color:var(--sand-deep);font-weight:600}

/* home "Units" tiles (mastery boxes, tap to review) */
.ws-units{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}
.ws-unit-tile{display:block;width:100%;text-align:left;padding:14px;border-radius:16px;
  border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;font-family:inherit;transition:.15s}
.ws-unit-tile:active{transform:scale(.99)}
.ws-unit-tile-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
.ws-unit-tile-name{font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:var(--sea)}
.ws-unit-tile-meta{display:inline-flex;align-items:center;gap:2px;flex-shrink:0;font-size:12px;font-weight:700;
  color:var(--tide);font-variant-numeric:tabular-nums}
.ws-unit-tile-sub{font-size:11.5px;color:var(--ink-soft);margin:2px 0 2px}

/* learn path */
.ws-learn{padding-bottom:30px}
.ws-section{margin-bottom:26px}
.ws-section-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
  border-bottom:2px solid var(--sand-deep);padding-bottom:6px;margin-bottom:14px}
.ws-section-name{font-family:'Fraunces',serif;font-size:22px;font-weight:600;color:var(--sea)}
.ws-section-prog{flex-shrink:0;font-size:12px;font-weight:700;color:var(--tide);font-variant-numeric:tabular-nums}
.ws-section-hint{font-size:12px;color:var(--ink-soft)}
.ws-unit{margin-bottom:22px}
.ws-unit-head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
.ws-unit-name{font-family:'Fraunces',serif;font-size:18px;font-weight:600;color:var(--ink)}
.ws-unit-hint{font-size:12px;color:var(--ink-soft);margin-top:1px}
.ws-unit-prog{flex-shrink:0;font-size:11px;font-weight:700;color:var(--tide);background:#eef8f8;
  border-radius:20px;padding:4px 9px;font-variant-numeric:tabular-nums}
.ws-lessons{display:flex;flex-direction:column;gap:8px}
.ws-lnode{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:11px 13px;
  border-radius:14px;border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;
  font-family:inherit;transition:.15s}
.ws-lnode.cur{border-color:var(--tide);background:#eef8f8}
.ws-lnode.done{border-color:var(--jade)}
.ws-lnode.locked{opacity:.5;cursor:not-allowed}
.ws-lnode-ring{flex-shrink:0;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-size:11px;font-weight:700;color:var(--sea);
  background:conic-gradient(var(--tide) calc(var(--p)*1%), var(--sand) 0)}
.ws-lnode-ring span{background:var(--foam);width:30px;height:30px;border-radius:50%;display:flex;
  align-items:center;justify-content:center}
.ws-lnode.done .ws-lnode-ring{background:var(--jade);color:#fff}
.ws-lnode-body{flex:1;min-width:0}
.ws-lnode-title{font-size:14.5px;font-weight:600;color:var(--ink)}
.ws-lnode-sub{font-size:11.5px;color:var(--ink-soft);margin-top:1px}
.ws-lnode-arr{color:var(--sand-deep);flex-shrink:0}

/* lesson screen */
.ws-lesson-title{font-family:'Fraunces',serif;font-size:23px;font-weight:600;color:var(--ink);margin:4px 0 4px}
.ws-lwords{display:flex;flex-direction:column;gap:7px;margin-bottom:8px}
.ws-lword{display:flex;justify-content:space-between;align-items:center;gap:12px;width:100%;text-align:left;
  padding:10px 13px;border-radius:12px;border:1px solid var(--sand-deep);background:var(--foam);
  cursor:pointer;font-family:inherit}
.ws-lword-w{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:var(--sea)}
.ws-lword-say{font-size:11px;color:var(--tide);margin-top:1px}
.ws-lword-e{font-size:13px;color:var(--ink-soft);text-align:right;flex-shrink:0}
.ws-parts{display:flex;flex-direction:column;gap:8px;padding-bottom:30px}
.ws-part{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 13px;
  border-radius:14px;border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;
  font-family:inherit;transition:.15s}
.ws-part.cur{border-color:var(--tide);background:#eef8f8}
.ws-part.done{border-color:var(--jade)}
.ws-part:disabled{opacity:.45;cursor:not-allowed}
.ws-part-num{flex-shrink:0;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;font-weight:700;font-size:14px;color:#fff;background:var(--sand-deep)}
.ws-part.cur .ws-part-num{background:var(--tide)}
.ws-part.done .ws-part-num{background:var(--jade)}
.ws-part-body{flex:1;min-width:0}
.ws-part-label{font-size:14.5px;font-weight:600;color:var(--ink)}
.ws-part-hint{font-size:11.5px;color:var(--ink-soft);margin-top:1px}
.ws-part-cta{flex-shrink:0;font-size:12px;font-weight:700;color:var(--tide)}

/* CTAs */
.ws-cta-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
.ws-cta{display:flex;align-items:center;gap:13px;padding:15px 16px;border-radius:16px;
  border:1px solid var(--sand-deep);background:var(--foam);cursor:pointer;text-align:left;
  transition:.15s;width:100%}
.ws-cta:active{transform:scale(.99)}
.ws-cta-primary{background:linear-gradient(135deg,var(--sea),var(--tide));border:none;color:#fff}
.ws-cta-ic{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;
  justify-content:center;background:var(--sand);color:var(--sea);flex-shrink:0}
.ws-cta-primary .ws-cta-ic{background:rgba(255,255,255,.2);color:#fff}
.ws-ic-tide{background:#dcefef;color:var(--tide)}
.ws-ic-coral{background:#fae3de;color:var(--coral)}
.ws-cta-t{font-weight:600;font-size:15.5px}
.ws-cta-d{font-size:12.5px;opacity:.78;margin-top:1px}
.ws-cta-sub{font-size:11.5px;opacity:.6;margin-top:1px}
.ws-cta-arrow{margin-left:auto;opacity:.5;flex-shrink:0}
.ws-cta-primary .ws-cta-arrow{opacity:.85}
.ws-badge{display:inline-block;background:var(--coral);color:#fff;font-size:11px;font-weight:700;
  border-radius:9px;padding:1px 7px;margin-left:5px;vertical-align:middle}

/* section label */
.ws-seclabel{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;
  letter-spacing:.1em;text-transform:uppercase;color:var(--sea);margin:6px 0 11px}
.ws-seclabel svg{color:var(--tide)}

/* decks */
.ws-decks{display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
.ws-deck{background:var(--foam);border:1px solid var(--sand-deep);border-radius:16px;
  padding:14px 15px;cursor:pointer;text-align:left;transition:.15s}
.ws-deck:active{transform:scale(.99)}
.ws-deck-top{display:flex;justify-content:space-between;align-items:center}
.ws-deck-name{font-family:'Fraunces',serif;font-weight:600;font-size:16px;color:var(--sea-ink)}
.ws-deck-count{font-size:12px;color:var(--ink-soft);background:var(--sand);border-radius:20px;
  padding:2px 9px;font-weight:600}
.ws-deck-hint{font-size:12px;color:var(--ink-soft);margin:2px 0 9px}
.ws-deck-foot{display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink-soft);
  margin-top:7px;font-weight:500}
.ws-due-dot{color:var(--sun-deep);font-weight:600}

.ws-bar{height:7px;background:var(--sand);border-radius:20px;overflow:hidden}
.ws-bar-fill{height:100%;background:linear-gradient(90deg,var(--tide),var(--jade));
  border-radius:20px;transition:width .6s cubic-bezier(.2,.8,.2,1)}

/* distribution */
.ws-dist{margin-bottom:16px}
.ws-dist-bar{display:flex;height:13px;border-radius:20px;overflow:hidden;background:var(--sand)}
.ws-seg{transition:width .6s}
.ws-seg-m{background:var(--jade)} .ws-seg-l{background:var(--tide-soft)} .ws-seg-f{background:var(--sand-deep)}
.ws-dist-legend{display:flex;gap:14px;margin-top:9px;font-size:11.5px;color:var(--ink-soft);flex-wrap:wrap}
.ws-dist-legend span{display:flex;align-items:center;gap:5px}
.ws-dot{width:9px;height:9px;border-radius:3px;display:inline-block}
.ws-dot-m{background:var(--jade)} .ws-dot-l{background:var(--tide-soft)} .ws-dot-f{background:var(--sand-deep)}

/* constellation */
.ws-constel{display:grid;grid-template-columns:repeat(auto-fill,minmax(13px,1fr));gap:4px;margin-top:4px}
.ws-cell{aspect-ratio:1;border-radius:3px;transition:.3s}
.ws-cell-f{background:var(--sand-deep);opacity:.5}
.ws-cell-l1{background:var(--coral);opacity:.65}
.ws-cell-l3{background:var(--tide-soft)}
.ws-cell-m{background:var(--jade)}

/* bottom bar */
.ws-build{text-align:center;font-size:10.5px;color:var(--sand-deep);letter-spacing:.04em;
  font-variant-numeric:tabular-nums;margin:18px 0 84px}
.ws-bottombar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:480px;
  background:rgba(247,241,230,.92);backdrop-filter:blur(10px);border-top:1px solid var(--sand-deep);
  display:flex;padding:8px 0 10px;z-index:20}
.ws-bb{flex:1;background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:3px;
  font-size:10.5px;color:var(--ink-soft);cursor:pointer;font-weight:500;font-family:inherit}
.ws-bb.active{color:var(--sea)}
.ws-bb.active svg{color:var(--tide)}

/* topbar */
.ws-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.ws-topbar h2{font-family:'Fraunces',serif;font-size:21px;font-weight:600;color:var(--sea-ink)}

/* setup */
.ws-pick-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:22px}
.ws-pick{display:flex;align-items:center;gap:8px;padding:12px 12px;border-radius:13px;
  border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;transition:.15s;text-align:left}
.ws-pick.on{border-color:var(--tide);background:#eef8f8}
.ws-pick-check{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--sand-deep);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#fff}
.ws-pick.on .ws-pick-check{background:var(--tide);border-color:var(--tide)}
.ws-pick-name{font-weight:600;font-size:13.5px;flex:1}
.ws-pick-n{font-size:11px;color:var(--ink-soft)}

.ws-seg-toggle{display:flex;gap:8px;margin-bottom:22px}
.ws-seg-toggle button{flex:1;padding:13px 8px;border-radius:13px;border:1.5px solid var(--sand-deep);
  background:var(--foam);cursor:pointer;font-family:inherit;font-weight:600;font-size:13px;
  color:var(--ink);transition:.15s;line-height:1.3}
.ws-seg-toggle button em{display:block;font-style:normal;font-size:10.5px;font-weight:500;
  color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em;margin-top:3px}
.ws-seg-toggle button.on{border-color:var(--sea);background:var(--sea);color:#fff}
.ws-seg-toggle button.on em{color:rgba(255,255,255,.8)}

.ws-mode-list{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.ws-mode{display:flex;align-items:center;gap:12px;padding:13px 14px;border-radius:13px;
  border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;text-align:left;transition:.15s}
.ws-mode.on{border-color:var(--tide);background:#eef8f8}
.ws-mode-ic{width:36px;height:36px;border-radius:10px;background:var(--sand);color:var(--sea);
  display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ws-mode.on .ws-mode-ic{background:var(--tide);color:#fff}
.ws-mode-txt{flex:1}
.ws-mode-txt b{display:block;font-size:14px;font-weight:600}
.ws-mode-txt i{font-style:normal;font-size:12px;color:var(--ink-soft)}
.ws-mode-radio{width:20px;height:20px;border-radius:50%;border:2px solid var(--sand-deep);flex-shrink:0;
  display:flex;align-items:center;justify-content:center}
.ws-mode.on .ws-mode-radio{border-color:var(--tide)}
.ws-radio-on{width:10px;height:10px;border-radius:50%;background:var(--tide)}

.ws-setup-foot{position:sticky;bottom:0;display:flex;align-items:center;justify-content:space-between;
  gap:12px;padding-top:8px}
.ws-setup-meta{font-size:12.5px;color:var(--ink-soft);font-weight:500}
.ws-start{display:flex;align-items:center;gap:6px;padding:14px 26px;border-radius:14px;border:none;
  background:linear-gradient(135deg,var(--sun),var(--sun-deep));color:#3a2410;font-weight:700;font-size:15px;
  cursor:pointer;font-family:inherit;box-shadow:0 6px 18px -8px var(--sun-deep);transition:.15s}
.ws-start:active{transform:scale(.97)}
.ws-start:disabled{opacity:.4;box-shadow:none}
.ws-full{width:100%;justify-content:center;margin-bottom:16px}

/* session */
.ws-session{padding-top:16px}
.ws-session-top{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.ws-progress-track{flex:1;height:8px;background:var(--sand);border-radius:20px;overflow:hidden}
.ws-progress-fill{height:100%;background:linear-gradient(90deg,var(--tide),var(--sun));
  border-radius:20px;transition:width .4s}
.ws-session-count{font-size:12.5px;font-weight:600;color:var(--ink-soft);min-width:38px;text-align:right}

.ws-card{background:var(--foam);border:1px solid var(--sand-deep);border-radius:22px;
  padding:22px 20px;box-shadow:0 8px 24px -16px rgba(10,46,52,.4);animation:rise .35s ease}
@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.ws-card-tag{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--tide);
  font-weight:600;margin-bottom:18px}

.ws-prompt{text-align:center;margin-bottom:22px}
.ws-prompt-waray{font-family:'Fraunces',serif;font-size:33px;font-weight:600;color:var(--sea-ink);
  line-height:1.15}
.ws-prompt-eng{font-family:'Fraunces',serif;font-size:27px;font-weight:500;color:var(--sea-ink);line-height:1.2}
.ws-say{font-size:14px;color:var(--tide);font-weight:500;margin-top:7px;letter-spacing:.02em}
.ws-mini-play{display:inline-flex;align-items:center;gap:5px;margin-top:10px;background:var(--sand);
  border:none;border-radius:20px;padding:6px 13px;font-size:12.5px;color:var(--sea);font-weight:600;
  cursor:pointer;font-family:inherit;transition:.15s}
.ws-mini-play:active{transform:scale(.95)}
.ws-mini-play.sq{padding:8px;border-radius:10px;margin:0}
.ws-mini-play.rec{background:var(--coral);color:#fff;animation:pulse 1.1s infinite}

.ws-options{display:flex;flex-direction:column;gap:9px}
.ws-opt{padding:15px 16px;border-radius:13px;border:1.5px solid var(--sand-deep);background:var(--shell);
  font-size:15.5px;font-weight:500;color:var(--ink);cursor:pointer;text-align:left;transition:.15s;
  font-family:inherit}
.ws-opt:active{transform:scale(.99)}
.ws-opt.correct{border-color:var(--jade);background:#e7f6ee;color:#1f6b46;font-weight:600}
.ws-opt.incorrect{border-color:var(--coral);background:#fbe7e2;color:#a33422}

.ws-listen-big{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px;padding:26px;
  border-radius:16px;border:none;background:linear-gradient(135deg,var(--sea),var(--tide));color:#fff;
  cursor:pointer;margin-bottom:20px;font-family:inherit;font-size:14px;font-weight:600}
.ws-listen-big em{font-style:normal;font-size:11px;opacity:.85;background:rgba(255,255,255,.2);
  padding:2px 9px;border-radius:12px}
.ws-listen-big:active{transform:scale(.98)}

.ws-input{width:100%;padding:15px 16px;border-radius:13px;border:1.5px solid var(--sand-deep);
  font-size:17px;font-family:'Fraunces',serif;color:var(--sea-ink);background:var(--shell);outline:none;
  transition:.15s}
.ws-input:focus{border-color:var(--tide);background:#fff}
.ws-check{width:100%;margin-top:12px;padding:14px;border-radius:13px;border:none;background:var(--sea);
  color:#fff;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit;transition:.15s}
.ws-check:active{transform:scale(.99)}
.ws-check:disabled{opacity:.4}
.ws-yourans{text-align:center;font-family:'Fraunces',serif;font-size:22px;padding:10px;border-radius:12px;
  margin-bottom:14px}
.ws-yourans.right{color:#1f6b46}.ws-yourans.wrong{color:#a33422;text-decoration:line-through;opacity:.7}

.ws-reveal{width:100%;padding:15px;border-radius:13px;border:1.5px dashed var(--tide);
  background:#eef8f8;color:var(--sea);font-weight:600;font-size:14.5px;cursor:pointer;font-family:inherit}
.ws-answer-reveal{text-align:center;margin-bottom:6px;animation:rise .3s ease}
.ws-answer-text{font-family:'Fraunces',serif;font-size:30px;font-weight:600;color:var(--sea-ink)}
.ws-subtext{text-align:center;font-size:13px;color:var(--ink-soft);font-style:italic;margin:8px 0;
  background:var(--sand);padding:8px 12px;border-radius:10px}

.ws-verdict{margin-top:18px;padding-top:16px;border-top:1px solid var(--sand);animation:rise .3s ease}
.ws-verdict-head{display:flex;align-items:center;gap:7px;font-weight:700;font-size:15px}
.ws-verdict.ok .ws-verdict-head{color:var(--jade)}
.ws-verdict.no .ws-verdict-head{color:var(--coral)}
.ws-verdict-answer{display:flex;align-items:center;justify-content:center;gap:8px;margin:10px 0;
  font-family:'Fraunces',serif;font-size:24px;font-weight:600;color:var(--sea-ink)}
.ws-verdict-yousaid{text-align:center;font-size:12.5px;color:var(--ink-soft);margin:4px 0 2px}
/* history */
.ws-hist-overall{text-align:center;font-size:13px;font-weight:600;color:var(--tide);margin-bottom:16px}
.ws-hist-day{margin-bottom:14px}
.ws-hist-dayhead{display:flex;justify-content:space-between;align-items:baseline;
  border-bottom:1px solid var(--sand-deep);padding-bottom:4px;margin-bottom:6px}
.ws-hist-date{font-weight:600;font-size:13.5px;color:var(--ink)}
.ws-hist-acc{font-size:12px;font-weight:700;color:var(--ink-soft);font-variant-numeric:tabular-nums}
.ws-hist-miss{display:flex;align-items:center;gap:6px;font-size:12.5px;padding:3px 0}
.ws-hist-prompt{font-family:'Fraunces',serif;color:var(--sea);min-width:90px}
.ws-hist-yours{color:var(--coral);text-decoration:line-through}
.ws-hist-correct{color:var(--jade);font-weight:600}
.ws-verdict-actions{display:flex;gap:10px;margin-top:14px}
.ws-next-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:5px;padding:13px;
  border-radius:13px;border:none;background:var(--sea);color:#fff;font-weight:600;font-size:14.5px;
  cursor:pointer;font-family:inherit}
.ws-ghost-btn{padding:13px 16px;border-radius:13px;border:1.5px solid var(--sand-deep);background:var(--foam);
  color:var(--ink-soft);font-weight:600;font-size:13.5px;cursor:pointer;font-family:inherit}

.ws-selfgrade{display:flex;gap:10px;margin-top:18px}
.ws-sg{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:15px;border-radius:13px;
  border:none;font-weight:600;font-size:14.5px;cursor:pointer;font-family:inherit;transition:.15s}
.ws-sg:active{transform:scale(.98)}
.ws-sg-no{background:#fbe7e2;color:#a33422}
.ws-sg-ok{background:#e7f6ee;color:#1f6b46}

/* speak */
.ws-speak-prompt{text-align:center;margin-bottom:20px}
.ws-speak-instr{font-size:12px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.08em;
  margin-bottom:6px;font-weight:600}
.ws-speak-controls{display:flex;flex-direction:column;align-items:center;gap:12px;margin-bottom:18px}
.ws-rec-btn{display:flex;align-items:center;gap:9px;padding:14px 24px;border-radius:30px;border:none;
  background:var(--coral);color:#fff;font-weight:600;font-size:15px;cursor:pointer;font-family:inherit;
  box-shadow:0 6px 18px -8px var(--coral)}
.ws-rec-btn.recording{animation:pulse 1.1s infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.ws-rec-playback{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.ws-mic-err{text-align:center;font-size:12.5px;color:var(--ink-soft);background:var(--sand);
  padding:10px;border-radius:10px;margin-bottom:14px}

/* done */
.ws-done{display:flex;align-items:center;justify-content:center;min-height:80vh}
.ws-done-card{text-align:center;background:var(--foam);border:1px solid var(--sand-deep);border-radius:24px;
  padding:34px 28px;width:100%;box-shadow:0 12px 30px -18px rgba(10,46,52,.5)}
.ws-done-ring{width:120px;height:120px;border-radius:50%;margin:0 auto 18px;display:flex;
  align-items:center;justify-content:center;
  background:conic-gradient(var(--jade) calc(var(--p)*1%),var(--sand) 0)}
.ws-done-ring.fail{background:conic-gradient(var(--coral) calc(var(--p)*1%),var(--sand) 0)}
.ws-passpill{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:700;
  padding:5px 12px;border-radius:20px;margin-bottom:12px}
.ws-passpill.ok{background:#e7f6ee;color:var(--jade)}
.ws-passpill.no{background:#fae3de;color:var(--coral)}
.ws-done-ring span{width:92px;height:92px;border-radius:50%;background:var(--foam);display:flex;
  align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:32px;font-weight:600;
  color:var(--sea-ink)}
.ws-done-ring i{font-style:normal;font-size:16px;color:var(--ink-soft)}
.ws-done-card h2{font-family:'Fraunces',serif;font-size:26px;color:var(--sea-ink);margin:0 0 4px}
.ws-done-sub{font-size:13.5px;color:var(--ink-soft);margin-bottom:22px}
.ws-missed{text-align:left;width:100%;background:var(--shell);border:1px solid var(--sand-deep);
  border-radius:14px;padding:10px 12px;margin-bottom:18px;max-height:260px;overflow-y:auto}
.ws-missed-label{font-size:10.5px;text-transform:uppercase;letter-spacing:.07em;color:var(--coral);
  font-weight:700;margin-bottom:8px}
.ws-missed-row{padding:7px 0;border-top:1px solid var(--sand-deep)}
.ws-missed-row:first-of-type{border-top:none}
.ws-missed-prompt{font-family:'Fraunces',serif;font-size:14.5px;color:var(--ink)}
.ws-missed-ans{display:flex;align-items:center;gap:6px;font-size:12.5px;margin-top:2px}
.ws-missed-yours{color:var(--coral);text-decoration:line-through}
.ws-missed-arr{color:var(--sand-deep);transform:rotate(180deg);flex-shrink:0}
.ws-missed-correct{color:var(--jade);font-weight:600}
.ws-missed-said{font-size:11.5px;color:var(--ink-soft);margin-top:2px}
.ws-hist-said{color:var(--ink-soft);font-style:italic}
.ws-done-actions{display:flex;gap:10px;justify-content:center}
.ws-done-actions .ws-start{padding:13px 20px}

/* needs work */
.ws-empty{text-align:center;padding:50px 24px;color:var(--ink-soft)}
.ws-empty svg{color:var(--tide);margin-bottom:14px}
.ws-empty p{font-size:14px;line-height:1.6}
.ws-nw-list{display:flex;flex-direction:column;gap:8px}
.ws-nw{display:flex;align-items:center;gap:11px;background:var(--foam);border:1px solid var(--sand-deep);
  border-radius:13px;padding:11px 13px}
.ws-nw-body{flex:1;min-width:0}
.ws-nw-waray{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:var(--sea-ink)}
.ws-nw-eng{font-size:12.5px;color:var(--ink-soft)}
.ws-nw-meta{display:flex;align-items:center;gap:8px}
.ws-nw-miss{font-size:12px;color:var(--coral);font-weight:700;background:#fbe7e2;border-radius:8px;
  padding:3px 7px}
.ws-pin{width:32px;height:32px;border-radius:9px;border:1px solid var(--sand-deep);background:var(--foam);
  color:var(--sand-deep);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s}
.ws-pin.on{color:var(--sun);border-color:var(--sun);background:#fef4e3}
.ws-pin.on svg{fill:var(--sun)}

/* browse */
.ws-search{width:100%;padding:13px 15px;border-radius:13px;border:1.5px solid var(--sand-deep);
  font-size:14.5px;font-family:inherit;background:var(--foam);outline:none;margin-bottom:12px;color:var(--ink)}
.ws-search:focus{border-color:var(--tide)}
.ws-filter-row{display:flex;gap:7px;overflow-x:auto;padding-bottom:6px;margin-bottom:14px}
.ws-filter-row button{flex-shrink:0;padding:8px 14px;border-radius:20px;border:1.5px solid var(--sand-deep);
  background:var(--foam);font-size:12.5px;font-weight:600;color:var(--ink-soft);cursor:pointer;font-family:inherit}
.ws-filter-row button.on{background:var(--sea);color:#fff;border-color:var(--sea)}
.ws-browse-list{display:flex;flex-direction:column;gap:7px}
.ws-brow{display:flex;align-items:center;gap:11px;background:var(--foam);border:1px solid var(--sand-deep);
  border-radius:13px;padding:11px 13px}
.ws-brow-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.ws-brow-body{flex:1;min-width:0}
.ws-brow-waray{font-family:'Fraunces',serif;font-size:16px;font-weight:600;color:var(--sea-ink);
  display:flex;align-items:center;gap:6px}
.ws-voiced{color:var(--jade);font-size:9px}
.ws-brow-eng{font-size:12.5px;color:var(--ink-soft)}
.ws-brow-say{font-size:11px;color:var(--tide);margin-top:1px}
.ws-brow-actions{display:flex;gap:5px;align-items:center}

/* pronounce */
.ws-pron-intro{font-size:13.5px;color:var(--ink-soft);line-height:1.55;background:var(--foam);
  border:1px solid var(--sand-deep);border-left:3px solid var(--tide);border-radius:12px;padding:13px 15px;
  margin-bottom:22px}
.ws-rules{display:flex;flex-direction:column;gap:9px;margin-bottom:24px}
.ws-rule{background:var(--foam);border:1px solid var(--sand-deep);border-radius:13px;padding:13px 15px}
.ws-rule-t{font-family:'Fraunces',serif;font-weight:600;font-size:15.5px;color:var(--sea);margin-bottom:3px}
.ws-rule-d{font-size:13px;color:var(--ink-soft);line-height:1.5}
.ws-pron-ex{display:flex;flex-direction:column;gap:8px;margin-bottom:18px}
.ws-pron-row{display:flex;align-items:center;gap:13px;background:var(--foam);border:1px solid var(--sand-deep);
  border-radius:13px;padding:13px 15px;cursor:pointer;text-align:left;font-family:inherit;transition:.15s}
.ws-pron-row:active{transform:scale(.99)}
.ws-pron-row svg{color:var(--tide);flex-shrink:0}
.ws-pron-w{font-family:'Fraunces',serif;font-size:17px;font-weight:600;color:var(--sea-ink)}
.ws-pron-s{font-size:12.5px;color:var(--ink-soft)}
.ws-pron-note{font-size:11px;color:var(--sand-deep);text-align:center;line-height:1.5;padding:0 10px}

/* header buttons */
.ws-head-btns{display:flex;gap:8px}

/* speed control */
.ws-speed{margin-bottom:24px}
.ws-speed-seg{display:flex;gap:8px;margin-bottom:10px}
.ws-speed-seg button{flex:1;padding:12px 8px;border-radius:12px;border:1.5px solid var(--sand-deep);
  background:var(--foam);cursor:pointer;font-family:inherit;font-weight:600;font-size:13.5px;color:var(--ink);
  transition:.15s}
.ws-speed-seg button.on{border-color:var(--tide);background:var(--sea);color:#fff}
.ws-speed-slider{display:flex;align-items:center;gap:12px;margin-bottom:12px}
.ws-speed-slider input[type=range]{flex:1;accent-color:var(--tide);height:24px;cursor:pointer}
.ws-speed-glabel{font-size:12px;color:var(--ink-soft);min-width:88px}
.ws-voice-select{flex:1;min-width:0;padding:9px 10px;border-radius:10px;border:1.5px solid var(--sand-deep);
  background:var(--foam);font-family:inherit;font-size:13px;color:var(--ink);cursor:pointer}
.ws-voice-note{font-size:11.5px;line-height:1.5;color:var(--ink-soft);background:var(--foam);
  border:1px solid var(--sand-deep);border-radius:10px;padding:9px 11px;margin-bottom:12px}
.ws-voice-note.good{color:var(--ink);border-color:var(--tide);background:#eef8f8}
.ws-speed-val{font-variant-numeric:tabular-nums;font-weight:600;font-size:13.5px;color:var(--tide);
  min-width:52px;text-align:right}
.ws-speed-adapt{display:flex;align-items:flex-start;gap:11px;width:100%;padding:13px 14px;border-radius:13px;
  border:1.5px solid var(--sand-deep);background:var(--foam);cursor:pointer;text-align:left;font-family:inherit;
  transition:.15s}
.ws-speed-adapt.on{border-color:var(--tide);background:#eef8f8}
.ws-speed-adapt-box{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--sand-deep);flex-shrink:0;
  display:flex;align-items:center;justify-content:center;color:#fff;margin-top:1px}
.ws-speed-adapt.on .ws-speed-adapt-box{background:var(--tide);border-color:var(--tide)}
.ws-speed-adapt b{display:block;font-size:14px;font-weight:600;color:var(--ink)}
.ws-speed-adapt i{font-style:normal;font-size:12px;color:var(--ink-soft)}

/* backup view */
.ws-backup-stat{display:flex;gap:10px;margin-bottom:20px}
.ws-backup-stat>div{flex:1;background:var(--foam);border:1px solid var(--sand-deep);border-radius:14px;
  padding:14px 10px;text-align:center;display:flex;flex-direction:column;gap:2px}
.ws-backup-stat b{font-family:'Fraunces',serif;font-size:24px;font-weight:600;color:var(--sea-ink)}
.ws-backup-stat span{font-size:11px;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em}
.ws-backup-row{display:flex;align-items:center;gap:13px;width:100%;padding:14px 15px;border-radius:14px;
  border:1px solid var(--sand-deep);background:var(--foam);cursor:pointer;text-align:left;transition:.15s;
  margin-bottom:9px;font-family:inherit}
.ws-backup-row:active{transform:scale(.99)}
.ws-backup-row:disabled{opacity:.55}
.ws-backup-ic{width:40px;height:40px;border-radius:11px;display:flex;align-items:center;justify-content:center;
  background:var(--sand);color:var(--sea);flex-shrink:0}
.ws-backup-txt{flex:1}
.ws-backup-txt b{display:block;font-size:14.5px;font-weight:600;color:var(--ink)}
.ws-backup-txt i{font-style:normal;font-size:12px;color:var(--ink-soft)}
.ws-backup-msg{display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border-radius:12px;font-size:13px;
  line-height:1.45;margin:14px 0 4px;font-weight:500}
.ws-backup-msg svg{flex-shrink:0;margin-top:1px}
.ws-backup-msg.ok{background:#e7f6ee;color:#1f6b46}
.ws-backup-msg.err{background:#fbe7e2;color:#a33422}
.ws-drive-note{font-size:13px;color:var(--ink-soft);line-height:1.6;background:var(--foam);
  border:1px solid var(--sand-deep);border-left:3px solid var(--sun);border-radius:12px;padding:13px 15px;}
.ws-drive-note b{color:var(--sea-ink)}

/* gist sync */
.ws-gist-help{margin-top:12px;font-size:12.5px;color:var(--ink-soft);background:var(--foam);
  border:1px solid var(--sand-deep);border-radius:12px;padding:11px 14px}
.ws-gist-help summary{font-weight:600;color:var(--sea);cursor:pointer;font-size:13px}
.ws-gist-help ol{margin:10px 0 8px;padding-left:18px;line-height:1.6}
.ws-gist-help li{margin-bottom:4px}
.ws-gist-help b{color:var(--sea-ink)}
.ws-sync-status{display:flex;align-items:center;gap:9px;background:var(--foam);border:1px solid var(--sand-deep);
  border-radius:12px;padding:12px 14px;font-size:13.5px;font-weight:600;color:var(--ink);margin-bottom:10px}
.ws-sync-status code{margin-left:auto;font-size:11px;color:var(--ink-soft);background:var(--sand);
  padding:2px 7px;border-radius:7px;font-family:ui-monospace,monospace}
.ws-sync-dot{width:9px;height:9px;border-radius:50%;background:var(--jade);flex-shrink:0}
.ws-sync-status.syncing .ws-sync-dot{background:var(--sun);animation:pulse 1s infinite}
.ws-sync-status.error .ws-sync-dot{background:var(--coral)}
.ws-sync-btns{display:flex;gap:9px;margin-bottom:4px}
.ws-backup-row.compact{margin-bottom:0;justify-content:center;gap:7px;font-weight:600;font-size:13.5px;
  color:var(--sea);padding:12px}
.ws-start.ws-connected{background:linear-gradient(135deg,var(--jade),#3d9b73);color:#fff;
  box-shadow:0 6px 18px -8px var(--jade)}

@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    `}</style>
  );
}

/* ---- standalone mount ---- */
import { createRoot } from "react-dom/client";
const _root = document.getElementById("root");
if (_root) createRoot(_root).render(React.createElement(App));
