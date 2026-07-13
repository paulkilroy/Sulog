/* Waray (Classic) — the original source-driven order (Peace Corps course +
   teacher docs). Kept as a fallback model. Lessons reference cards by Waray
   string; unit/lesson ids are stable literals. */
export const CLASSIC = [
  { id: "s1", name: "Survival Kit", hint: "Say something on day one", units: [
  { id: "u1", name: "Greetings & courtesy", hint: "Hellos, thanks, manners", lessons: [
    { id: "u1l1", title: "Hellos & thanks", items: ["Maupay nga aga", "Maupay nga udto", "Maupay nga kulop", "Maupay nga gab-i", "Kumusta ka?", "Maupay man", "Salamat", "Damo nga salamat", "Pasensya na", "Sige"] },
    { id: "u1l2", title: "Yes, no & getting by", items: ["Oo", "Diri", "Waray", "Waray pa", "Anay", "Adi", "Pwede", "maupay", "tabang", "Hinay-hinay la"] },
  ] },
  { id: "u2", name: "Survival phrases", hint: "When you're stuck", lessons: [
    { id: "u2l1", title: "When you're stuck", items: ["Waray ako makabaro", "Naintindihan ko", "Diri ako maaram", "Buligi daw ako", "Pasaylo-a ako", "Hain an CR?", "Karuyag ko", "Gusto ko", "Nakikit-an mo?", "Klaro?"] },
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
    { id: "u36l1", title: "Church & belief", items: ["simbahan", "pastor", "misyonaryo", "Kristohanon", "Bibliya", "kros", "kinabuhi", "langit", "pasaylo", "kaadlawan"] },
  ] },
  ] },
];
