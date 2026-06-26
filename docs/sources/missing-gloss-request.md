# Waray missing-word gloss — first pass (for ChatGPT)

You are an expert in **Waray-Waray (Winaray)**, the language of Samar and Leyte, Philippines.
Below are 144 words taken from real Waray children's stories that our dictionary
could not gloss. They are shown **in their story sentence(s)** so you have context (the target
word is in **bold**).

For **each** word, decide exactly ONE verdict:

1. **scan** — it is an OCR / scanning error or typo (the source text is wrong). Put the
   corrected Waray spelling in `fix`. *(We will fix the text, not add a gloss.)*
2. **waray** — it is a genuine Waray word. Put a short English definition in `def`.
3. **other** — it is a word from another language used inside the Waray story (English,
   Spanish, Tagalog, etc.). Put the language in `lang` and the English meaning in `def`.
4. **unknown** — you genuinely cannot tell.

Use the context to disambiguate (e.g. an inflected verb → give the meaning of that verb).
Do **not** guess wildly; prefer **unknown** over a low-confidence answer.

## Output format — return ONLY this, nothing else

A single JSON array, one object per word, in the SAME order, shape:

```json
[
  {"w":"<word>","verdict":"scan|waray|other|unknown","fix":"","lang":"","def":""}
]
```

Leave unused fields as empty strings. Keep `def` short (a few words).

---

## Words (with context)

1. **pag-iha**  (2×, 2 stories)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Ha butnga han ira karisyuhan nakit-an han mga tawo an usa babayi nga may ada kugos nga misay ngan ira ini ginhimo nga pag-intrimisan ginkuha an misay ngan ginkariguan, ginbadoan ngan ginpasayaw-sayaw han mga tawo an nasabi nga misay, nga kun diin mas nagin marisyo pa hin duro an mga tawo samtang nagnanabigar ha kadagatan. Ngan waray **pag-iha.**"
   - _Hi Kaha, Kahon_: "Waray **pag-iha,** umabot an anak han tag-iya han tindahan. Ginkuha an iya sulod ngan gintrapohan. “Kailangan ko ikaw kay waray ako nasusudlan hin mga gudtiay nga pantinda”, siring han bata."

2. **pagkit-on**  (2×, 2 stories)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Ha pagkayana ini nga pormado nga bato in pareho hin usa nga barko nga nalutaw ha butnga han kadagatan. Ngan ini in maupay ngan kamakaruruyag **pagkit-on.**"
   - _Hi Kaha, Kahon_: "Nakita niya an mainggat nga salog. Makaruruyag **pagkit-on** an iba-iba nga klase hin mga light. Iba-iba nga kolor han mga butang an iya nakikita ha kada estante nga ira gin-aagian."

3. **kagugub-an**  (2×, 2 stories)
   - _AN BANOG HA BUKID HURAW_: "Malipayon nga naglilinupad-lupad hi Banog ha **kagugub-an.**"
   - _Waray na kakit-i_: "Naghimo nala hira hin ira mga urukyan nga malay-balay kay waray naman an kagugub an, waray na an mga kahayupan nga nan-ngungukoy nganhi,ngan an damo nga kakakahuyan. Sanglit kamo nga mga bata ayaw niyu pasagdi it aton **kagugub-an,** pagtanom kamo hin mga kahoy para mayda maukyan an katamsihan."

4. **paghirot**  (2×, 2 stories)
   - _Mga Kamot ni Lotlot_: "Usa ka Sabado, nagsarit hi Lotlot kan iya Nanay Lila nga makikimulay hiya ha ira libong Nanay, human na ako manilhig. Pwede ba ako magmulay ha gawas?” pakiana ni Lotlot Oo sige, basta **paghirot** ikaw ha.”, yakan ni Nanay Lila “Opo, nanay.”, baton ni Lotlot."
   - _An Maduruto nga Parapangisda_: ""Sigi, basta **paghirot** la pirmi ngan ayaw na pagkadto hit kalalawdan",tugon ni nanay Ondit. "Oo, ayaw kabaraka kay pirmi ko gin-aampo nga bantayan kita hit makagarahom nga Diyos", baton ni Tatay Omi."

5. **dolce**  (8×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: "Hi Ynah in usa nga bata nga babayi. Gutiay ngan matambok. Ayon niya it mga pagkaon nga magtam-is sugad hit cake, ice cream, tsukolate, softdrinks, lollipop, labi na gud it mga **dolce.**"
   - _An Bata nga Mahilig hin Dolce_: "May ada la po ako papaliton ha tindahan Nay, Tay! siring ni Ynah. "Upaya naman nga diri **dolce** tim paliton, mas maupay kun tinapay nala anak!" siring han iya nanay."

6. **kagugub**  (5×, 1 story)
   - _Waray na kakit-i_: "Han una nga panahon,an aton **kagugub** an damo an mga kahayupan nga naukoy ngan damo liwat an mga kakahuyan. Napupuno hin kanta hin katamsihan an bug-os nga **kagugub** an. Maupay hin duro ini nga lugar. "kamalipayon ko nanay nga dinhi kita ha **kagugub** an naukoy" siring ni tamsi Pikoy kan iya nanay, nagtawa la hi iya nanay ha iya."
   - _Waray na kakit-i_: "Han umabot na hira Pikoy ngan an iba pa nga katamsihan waray na hira balay,waray na liwat an mga kakahuyan,diri na maupay an **kagugub** an."nanay Pikoy waray na kita uukyan"nahingatangis nga yakan ni tamsi Pikoy, "maghihimo nala kita hin bag o naton nga mauukyan" baton ni nanay Pikoy."

7. **suok**  (3×, 1 story)
   - _An Suok nga Magsangkay_: "Magsangkay hi Ela ngan hi Mila. Tungod kay mag anyaw man hira. **Suok** gud kaupay hira nga magsangkay."
   - _An Suok nga Magsangkay_: "Nahibaro hi Mila han nahitabo. Nga nasakit an **suok** niya nga sangkay. Dali-dali nga bumalik hi Mila."

8. **ginpakianhan**  (2×, 1 story)
   - _An Pakla Nga Mayakan_: "Ha usa nga lugar, may ada usa nga Pakla nga masyado hin kamayakan.Nakausa, **ginpakianhan** niya an nga tanan nga mga hayop kun ano an karuyag kaunon han ira mga anak."
   - _An Pakla Nga Mayakan_: "**Ginpakianhan** niya an Tamsi, "Ano an karuyag kaunon han imo mga anak?""

9. **nagnanabigar**  (2×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Sumala han istorya han mga kalagsan, an ini nga pormado nga bato nga baga han nalutaw ha butnga han kadagatan in usa daw nga dako nga barko nga may mga sakay nga pasahero nga **nagnanabigar** hadto, nga kun diin samtang ini in nagbibiyahe ha butnga han kadagatan in may kalipay nga nahitatabo ha sulod han barko, may ada mga nagkakaranta, nagsasarayaw, nagkakatatawa, ngan nangugugli-at nga mga pasahero."
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Ha butnga han ira karisyuhan nakit-an han mga tawo an usa babayi nga may ada kugos nga misay ngan ira ini ginhimo nga pag-intrimisan ginkuha an misay ngan ginkariguan, ginbadoan ngan ginpasayaw-sayaw han mga tawo an nasabi nga misay, nga kun diin mas nagin marisyo pa hin duro an mga tawo samtang **nagnanabigar** ha kadagatan. Ngan waray pag-iha."

10. **magsarit**  (2×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Dugang pa nga istorya han pipira nga mga residente han usa barangay nga naukoy hirani ha kandiwata, an siring nira nga kun mangangawil o mananakop ka hin mga isda nga harani ha kandiwata in kinahanglan mo anay **magsarit** sa dako nga bato (kandiwata) para diri daw magkamay ada hin problema sugad han: pagkaruba han imo sarakyan, pagkasangit han imo pukot, pagpapaabat han mga diwata ngan engkanto ha imo o di ngani diri kana makakauli haiyo panimalay ."
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Bisan ha pagkayana kun may napakadto didto nga mga turista nga karuyag mangarigo o magpahalibway hira gin sasagdunan nga **magsarit** anay ha pormado nga bato ha bisan ano nga karuyag nira buhaton didto."

11. **pagkaaga**  (2×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Usa ka gab-i, gin kuha han usa nga ulitawo an iya tanom nga rosa. **Pagkaaga** pagkita ni apoy Garing ha iya libong waray na an iya minayuyo nga rosa. Naging masinalub-on hi apoy Garing kay nawara an iya tanom nga rosa."
   - _AN BUKAD HA LIBONG NI APOY GARING_: "**Pagkaaga** nalipay an daraga han iya nakita kay may usa nga tanom nga mahusay pagkinitaon. Iya gin daop ngan gin obserbahan. Na hunahunaan niya nga waray hiya tanom sugad hini kamahusay."

12. **gingagarbohan**  (2×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Nangaro hin pasaylo an ulitawo han enkantada nga alibangbang. "Pasayloa ako han akon nabuhat kay tungod ginhigugma ko an akon **gingagarbohan** kay mahilig hiya hin mahusay nga bukad sanglit ginkuha ko an tanom nga rosa ni apoy Garing". Bumaton an enkantada nga alibangbang "pangaro pasaylo kan apoy Garing han imo gin buhat kay kon diri ako an maghahatag ha imo hin sirot ha imo"."
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Nagtangis an daraga ngaha atubangan han nangunguyab ha iya tungod han ginbuhat hini. "Pangaro pasaylo kan apoy Garing han imo ginbuhat." An siring han daraga kan Lindo. "Oo mangangaro ako pasaylo. Pasayloa liwat ako han akon nabuhat" an baton ni han ulitawo ha iya **gingagarbohan.** Kumadto dayon hira kan apoy Garing para mangaro han kapasayloanan."

13. **pandemya**  (2×, 1 story)
   - _AN MALIPAYON NA PARAGSUDOY_: "Kulang na tawo an bungto tungod han **pandemya** (Covid 19)"
   - _AN MALIPAYON NA PARAGSUDOY_: "Nangadi hi Pedro, nga konta mawara na ini nga **pandemya.**"

14. **budgyong**  (2×, 1 story)
   - _Pagtimangno hin Panlawas_: "Usa ka adlaw samtang nagmumulay hi Potpot. Nakabati hiya han tunog han **budgyong.** “eeeeennnngggg eeennngggg” tunog han **budgyong** “Ginpapasabot nga gindidiri an paggawas han mga kabataan ngan pagsalin-urog hin bisan anu nga katitirok,” pag imporma han tanod."

15. **nagtitinuok**  (2×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: "Tigda nga nakagmata hi Ynah, nahangos ngan nakagtuok. "Hin o dawla adi nga **nagtitinuok?"** siring han iya Nanay. Gumawas hiya han ira kwarto para bilngon kun diin tikang an tuok."
   - _An Bata nga Mahilig hin Dolce_: ""Naano ka Ynah? kay ano **nagtitinuok** ka man?" pakiana ha iya ni iya nanay. "Nay nag-inop ako nga ginlalanat ako hin higante nga mga dolce makaradlok!.....nay..... Nay, masakit nanaman tak ngipon huhuhu"....sumat ni Ynah "Waray udog ako tuod kinana nga tinapay nala it palita siring nimo, mga dolce na liwat nak ginkaon kanina. Tikang yana matuod na ako pirmi ha imo nga diri na magpinalit hin mga dolce." yakan pa ni Ynah."

16. **nahingalimot**  (2×, 1 story)
   - _An Panapuan kan Elay_: "Naliaw hi Elay samtang nag-uuyag. **Nahingalimot** hiya han tugon ni iya Nanay."
   - _An Panapuan kan Elay_: "Dali-dali nga umuli hi Elay ha ira balay. "Nanay, pasaylua ako. **Nahingalimot** ako paghimo han imo tugon ha akon kay nag-uyag ako" nagbabasol nga yakan ni Elay. "Halas ige, sunod trabahua anay an akon tugon ha san-o ka mag-uyag. Adi na an imo panapuan ihahatag ko ha imo katapos mo sumugot" yakan ni Nanay Maya."

17. **iskoyla**  (2×, 1 story)
   - _An Maduruto nga Parapangisda_: "Pangisda an siyahan nga pangabuhi ni Tatay Omi. Tungod kay waray man hiya makatapos han pag **iskoyla.**"
   - _An Maduruto nga Parapangisda_: "Usa ka adlaw, malain an kaoras han panahon. "Omi, ayaw la anay pagkadto ha dagat kay diri maupay it panahon", siring ni Nanay Ondit. "Kon diri ngani ako gumikan waray kita igsusura ngan kakaunon niyan. Waray liwat kita igpapalit gamit kanan pag **iskoyla** hit kabataan" , baton ni Tatay Omi ."

18. **ginyakap**  (2×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Ha gab-i, samtang nagkakaon hira ni Joshua, **ginyakap** hiya han bata. “Nanay, proud ako ha imo.” Naluha hi Marites ngan **ginyakap** ini hin mahugot. “Mas proud ako ha imo, anak. Ikaw an akon kusog.”"

19. **mamalit**  (1×, 1 story)
   - _Kunta Huybes kada Adlaw_: "Bumalik hi Mira ha sulod han ira balay ngan nahinumdum hiya. "Aha! Huybes ngayan yana, adlaw han tabo asya waray dinhi hira nanay ngan tatay. Timprano pa hira nga napakadto ha tabu-an para **mamalit** hin pagkaun ngan iba pa namon nga panginahanglan!" "Ano dawla kun napalit nira nanay ngan tatay an akon gintugon?" pakiana ni Mira ha iya kalugaringon."

20. **asiti**  (1×, 1 story)
   - _Kunta Huybes kada Adlaw_: "May ada mga sibuyas, lasona ngan luya. Upod na an isda, karne han baboy ngan baka. Mayda liwat asin ngan asukar, toyo ngan **asiti.** Mayda pa gatas ngan palaman nga marasa! Kadako han tawa ni Mira!"

21. **bestida**  (1×, 1 story)
   - _Kunta Huybes kada Adlaw_: "May ginhatag nga nakaputos an nanay ni Mira ha iya. Ginkulba hiya! pero dayun la nga nakapakpak hin kalipay hi Mira. Ginpalit ni nanay ngan tatay an mga tugon niya! May ada na hiya bag-o nga lapis, pula nga payong ngan dulaw nga **bestida!**"

22. **aklo**  (1×, 1 story)
   - _An Bao_: "Balay niya pirmi **aklo.**"

23. **sapa**  (1×, 1 story)
   - _An Bao_: "Naukoy hiya ha **sapa.**"

24. **nakakaistorbo**  (1×, 1 story)
   - _An Tulo nga Magsarangkay_: "Ginsaway hira ni Mana Lita. "Kabataan, hinaya an iyo tingog kay **nakakaistorbo** na kamo." saway ni Mana Lita nga pinipiraw."

25. **ginsigawan**  (1×, 1 story)
   - _An Tulo nga Magsarangkay_: "**Ginsigawan** nira Jolo ngan Anton hi Tristan. "Hala ka, Tristan! Hala ka, Tristan!" sigaw han duha. Tungod han kaawod, pumurot hiya hin bato ngan ginlabay an atop nira Mana Lita."

26. **sigaw**  (1×, 1 story)
   - _An Tulo nga Magsarangkay_: "Ginsigawan nira Jolo ngan Anton hi Tristan. "Hala ka, Tristan! Hala ka, Tristan!" **sigaw** han duha. Tungod han kaawod, pumurot hiya hin bato ngan ginlabay an atop nira Mana Lita."

27. **nagroronda**  (1×, 1 story)
   - _An Tulo nga Magsarangkay_: "Kinalasan hira Mana Lita. Nahimangno hira ngatanan. Iksakto nalabay hi Mano Solomon kay **nagroronda.** Ginsaway niya hi Tristan. "Kay ano nga nanlalabay ka man?" pakiana ni Mano Solomon. Nandadlagan an magsaarangkay."

28. **magsaarangkay**  (1×, 1 story)
   - _An Tulo nga Magsarangkay_: "Kinalasan hira Mana Lita. Nahimangno hira ngatanan. Iksakto nalabay hi Mano Solomon kay nagroronda. Ginsaway niya hi Tristan. "Kay ano nga nanlalabay ka man?" pakiana ni Mano Solomon. Nandadlagan an **magsaarangkay.**"

29. **maagsarangkay**  (1×, 1 story)
   - _An Tulo nga Magsarangkay_: "Para matapos na an pagtuhay ha ira ni Kapitan, nangaro hin pasaylo an magsarangkay ngan ira mga kag-anak kan Mana Lita. Tikang hadto, an **maagsarangkay** in nagsaad nga diri na hira mag-uutro."

30. **mag-uutro**  (1×, 1 story)
   - _An Tulo nga Magsarangkay_: "Para matapos na an pagtuhay ha ira ni Kapitan, nangaro hin pasaylo an magsarangkay ngan ira mga kag-anak kan Mana Lita. Tikang hadto, an maagsarangkay in nagsaad nga diri na hira **mag-uutro.**"

31. **uminom**  (1×, 1 story)
   - _An Pakla Nga Mayakan_: "Bumaton an Baboy, "Karuyag **uminom** hin gatas an akon mga anak." "Oh asya!", baton han pakla."

32. **sikat**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Usa ha mga **sikat** kadtuon yana ha isla han munisipyo han Daram an ira bantog nga pormado nga bato o rock formation nga gintatawag nga kandiwata . An pulong nga Kandiwata in nagtikang sa lokal na termino han mga waray nga an karuyag sidngon in lugar o puroy-anan han mga diwata, engkanto o mga linarang nga diri nakikit-an han mga ordinaryo nga tawo."

33. **nangugugli-at**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Sumala han istorya han mga kalagsan, an ini nga pormado nga bato nga baga han nalutaw ha butnga han kadagatan in usa daw nga dako nga barko nga may mga sakay nga pasahero nga nagnanabigar hadto, nga kun diin samtang ini in nagbibiyahe ha butnga han kadagatan in may kalipay nga nahitatabo ha sulod han barko, may ada mga nagkakaranta, nagsasarayaw, nagkakatatawa, ngan **nangugugli-at** nga mga pasahero."

34. **karisyuhan**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Ha butnga han ira **karisyuhan** nakit-an han mga tawo an usa babayi nga may ada kugos nga misay ngan ira ini ginhimo nga pag-intrimisan ginkuha an misay ngan ginkariguan, ginbadoan ngan ginpasayaw-sayaw han mga tawo an nasabi nga misay, nga kun diin mas nagin marisyo pa hin duro an mga tawo samtang nagnanabigar ha kadagatan. Ngan waray pag-iha."

35. **pag-intrimisan**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Ha butnga han ira karisyuhan nakit-an han mga tawo an usa babayi nga may ada kugos nga misay ngan ira ini ginhimo nga **pag-intrimisan** ginkuha an misay ngan ginkariguan, ginbadoan ngan ginpasayaw-sayaw han mga tawo an nasabi nga misay, nga kun diin mas nagin marisyo pa hin duro an mga tawo samtang nagnanabigar ha kadagatan. Ngan waray pag-iha."

36. **nagsirom**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Nga tumigda la nga naglain an panahon ngan **nagsirom** an bug-os nga palibot ngan nagkamay ada hin makusog nga dalugdug ngan kidlat nga asya an naka-igo ha barko ngan ini nagin usa nga dako nga bato ngan nagporma hin sugad hin dako nga barko. Hito mismo nga oras pagkahuman han panhitabo in tigda la nga nagmingaw an bug-os nga palibot. An dako nga barko nagin usa nga dako nga bato."

37. **nagririsyo**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Dugang pa han istorya han pipira nga mangirisda nga nag-uukoy hirani ha kandiwata, nasiring hira nga danay may mga panahon nga nagpaparawa ha gab-i an pormado nga bato, ngan may ada mga tingog nira nga nahibabati-an nga mga **nagririsyo** nga sugad hin may ada sarayaw an mga diwata o engkanto. Asya daw adto an mga tawo nga sakay hadto han barko nga nagin usa nga bato."

38. **pagkaruba**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Dugang pa nga istorya han pipira nga mga residente han usa barangay nga naukoy hirani ha kandiwata, an siring nira nga kun mangangawil o mananakop ka hin mga isda nga harani ha kandiwata in kinahanglan mo anay magsarit sa dako nga bato (kandiwata) para diri daw magkamay ada hin problema sugad han: **pagkaruba** han imo sarakyan, pagkasangit han imo pukot, pagpapaabat han mga diwata ngan engkanto ha imo o di ngani diri kana makakauli haiyo panimalay ."

39. **pagkasangit**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Dugang pa nga istorya han pipira nga mga residente han usa barangay nga naukoy hirani ha kandiwata, an siring nira nga kun mangangawil o mananakop ka hin mga isda nga harani ha kandiwata in kinahanglan mo anay magsarit sa dako nga bato (kandiwata) para diri daw magkamay ada hin problema sugad han: pagkaruba han imo sarakyan, **pagkasangit** han imo pukot, pagpapaabat han mga diwata ngan engkanto ha imo o di ngani diri kana makakauli haiyo panimalay ."

40. **makakauli**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Dugang pa nga istorya han pipira nga mga residente han usa barangay nga naukoy hirani ha kandiwata, an siring nira nga kun mangangawil o mananakop ka hin mga isda nga harani ha kandiwata in kinahanglan mo anay magsarit sa dako nga bato (kandiwata) para diri daw magkamay ada hin problema sugad han: pagkaruba han imo sarakyan, pagkasangit han imo pukot, pagpapaabat han mga diwata ngan engkanto ha imo o di ngani diri kana **makakauli** haiyo panimalay ."

41. **haiyo**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Dugang pa nga istorya han pipira nga mga residente han usa barangay nga naukoy hirani ha kandiwata, an siring nira nga kun mangangawil o mananakop ka hin mga isda nga harani ha kandiwata in kinahanglan mo anay magsarit sa dako nga bato (kandiwata) para diri daw magkamay ada hin problema sugad han: pagkaruba han imo sarakyan, pagkasangit han imo pukot, pagpapaabat han mga diwata ngan engkanto ha imo o di ngani diri kana makakauli **haiyo** panimalay ."

42. **antis**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Dugang pa nga siring nira nga kinahanglan mo mag-itsa hin sinsilyo **antis** ka umuli o bumaya hito nga lugar para daw diri mag-isog o mabido an mga diwata o engkanto nga nangungukoy didto."

43. **gindadayo**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Usa nga mahusay nga dagat-panan-awon (tourist spot) an pormado nga bato han kandiwata ( kandiwata rock formation), nga **gindadayo** yana han mga turista nga natikang ha mga hagrani nga lugar han Daram. Maupay didto mangarigo kay an tubig malimpyo ngan matin-aw. Ini in usa nga natural nga karikuhan nga maidadasig han mga tawo nga mulopyo han munisipyo han Daram. Nga angay naton timangnuon, paghirutan ngan ipadayon an kalimpyo han kadagatan. Pagkaada hin pagrespeto ngadto han mga tawo nga nagkamay ada hin eksperyensiya mahiunong han ira mga istorya hiunong han kandiwata."

44. **pagkaada**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Usa nga mahusay nga dagat-panan-awon (tourist spot) an pormado nga bato han kandiwata ( kandiwata rock formation), nga gindadayo yana han mga turista nga natikang ha mga hagrani nga lugar han Daram. Maupay didto mangarigo kay an tubig malimpyo ngan matin-aw. Ini in usa nga natural nga karikuhan nga maidadasig han mga tawo nga mulopyo han munisipyo han Daram. Nga angay naton timangnuon, paghirutan ngan ipadayon an kalimpyo han kadagatan. **Pagkaada** hin pagrespeto ngadto han mga tawo nga nagkamay ada hin eksperyensiya mahiunong han ira mga istorya hiunong han kandiwata."

45. **pagrespeto**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Usa nga mahusay nga dagat-panan-awon (tourist spot) an pormado nga bato han kandiwata ( kandiwata rock formation), nga gindadayo yana han mga turista nga natikang ha mga hagrani nga lugar han Daram. Maupay didto mangarigo kay an tubig malimpyo ngan matin-aw. Ini in usa nga natural nga karikuhan nga maidadasig han mga tawo nga mulopyo han munisipyo han Daram. Nga angay naton timangnuon, paghirutan ngan ipadayon an kalimpyo han kadagatan. Pagkaada hin **pagrespeto** ngadto han mga tawo nga nagkamay ada hin eksperyensiya mahiunong han ira mga istorya hiunong han kandiwata."

46. **eksperyensiya**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Usa nga mahusay nga dagat-panan-awon (tourist spot) an pormado nga bato han kandiwata ( kandiwata rock formation), nga gindadayo yana han mga turista nga natikang ha mga hagrani nga lugar han Daram. Maupay didto mangarigo kay an tubig malimpyo ngan matin-aw. Ini in usa nga natural nga karikuhan nga maidadasig han mga tawo nga mulopyo han munisipyo han Daram. Nga angay naton timangnuon, paghirutan ngan ipadayon an kalimpyo han kadagatan. Pagkaada hin pagrespeto ngadto han mga tawo nga nagkamay ada hin **eksperyensiya** mahiunong han ira mga istorya hiunong han kandiwata."

47. **importansiya**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Aton tagan hin **importansiya** an mga mag-upay nga mga panan-awon nga aada nakikita ha aton mga lugar. Aton atamanon, timangnuon ngan ipadayon an kalimpyo han aton kalibungan, kadagatan ngan kagurangan. paghatag hin respeto ngadto han mga tawo nga naghahatag han ira mga istorya tikang han mga butang nga ira naekperyensiyan, nakit-an ngan nanhibati-an. Damo nga Salamat!"

48. **respeto**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Aton tagan hin importansiya an mga mag-upay nga mga panan-awon nga aada nakikita ha aton mga lugar. Aton atamanon, timangnuon ngan ipadayon an kalimpyo han aton kalibungan, kadagatan ngan kagurangan. paghatag hin **respeto** ngadto han mga tawo nga naghahatag han ira mga istorya tikang han mga butang nga ira naekperyensiyan, nakit-an ngan nanhibati-an. Damo nga Salamat!"

49. **naekperyensiyan**  (1×, 1 story)
   - _An Istorya Han Pormado Nga Bato Han Kandiwata_: "Aton tagan hin importansiya an mga mag-upay nga mga panan-awon nga aada nakikita ha aton mga lugar. Aton atamanon, timangnuon ngan ipadayon an kalimpyo han aton kalibungan, kadagatan ngan kagurangan. paghatag hin respeto ngadto han mga tawo nga naghahatag han ira mga istorya tikang han mga butang nga ira **naekperyensiyan,** nakit-an ngan nanhibati-an. Damo nga Salamat!"

50. **magtinanon**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Hi apoy Garing usa nga mahilig **magtinanon** bukad pero diri gud hiya gintutudkan hin mga tanom nga nabukad labot la ha usa nga tanom ini an tanom nga nabukad hin rosa."

51. **gintutudkan**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Hi apoy Garing usa nga mahilig magtinanon bukad pero diri gud hiya **gintutudkan** hin mga tanom nga nabukad labot la ha usa nga tanom ini an tanom nga nabukad hin rosa."

52. **paburito**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Pirmi ni apoy Garing gindadayaw ngan gintitimangno an iya bukad nga rosa. "Ikaw an bukad nga akon ginhihigugma kay ikaw la an tumurok han akon gin tanom ngan an kolor mo nga pula amo an akon **paburito."**"

53. **gagarbohan**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Gin dara han ulitawo an tanom ni apoy Garing nga rosa ngadto han libong han iya gin **gagarbohan.**"

54. **nalooy**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Nahibaroan han enkantada nga alibangbang an nahinabo ngan **nalooy** ini kan apoy Garing. Lumupad an enkantada nga alibangbang kan apoy Garing kamot ngan nagsiring "Apoy Garing nakita ko an imo kabidoan han kawara han imo tanom nga rosa, yana an imo mga kamot tatagan kon bendisyon para bisan man ano nga tanom maturok kon ikaw an magtanom.""

55. **magka**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Ngan mga pira ka adlaw nanubo an mga tanom ni apoy Garing nga nakita niya an **magka** iba-iba nga bukad nga maghusay."

56. **sirot**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Nangaro hin pasaylo an ulitawo han enkantada nga alibangbang. "Pasayloa ako han akon nabuhat kay tungod ginhigugma ko an akon gingagarbohan kay mahilig hiya hin mahusay nga bukad sanglit ginkuha ko an tanom nga rosa ni apoy Garing". Bumaton an enkantada nga alibangbang "pangaro pasaylo kan apoy Garing han imo gin buhat kay kon diri ako an maghahatag ha imo hin **sirot** ha imo"."

57. **ngaha**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Nagtangis an daraga **ngaha** atubangan han nangunguyab ha iya tungod han ginbuhat hini. "Pangaro pasaylo kan apoy Garing han imo ginbuhat." An siring han daraga kan Lindo. "Oo mangangaro ako pasaylo. Pasayloa liwat ako han akon nabuhat" an baton ni han ulitawo ha iya gingagarbohan. Kumadto dayon hira kan apoy Garing para mangaro han kapasayloanan."

58. **amin**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Han nakadto na hira kan apoy Garing libong nangaro hira hin kapasayloanan. "Pasayloa ako apoy Garing han akon ginbuhat" an siring han ulitawo. "Okey la intoy maupay kay nag **amin** ka han imo ginbuhat. Malipayon ako yana kay may ada na ako bago na mga tanom nga nabukad hin rosa ngan iba pa nga mga bukad". An baton ni apoy Garing."

59. **magsuok**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Waray hi apoy Garing mag-isog kundi naging malipayon pa hiya han may ada hiya yana. Gintagan pa niya ulitawo ngan an daraga hin mga taramnon. Tikang hadto naging **magsuok** hira nga magsarangkay ngan nananom hira hin mga iba-iba nga mga bukad sanglit naging maupay ngan mahusay an ira barangay."

60. **nananom**  (1×, 1 story)
   - _AN BUKAD HA LIBONG NI APOY GARING_: "Waray hi apoy Garing mag-isog kundi naging malipayon pa hiya han may ada hiya yana. Gintagan pa niya ulitawo ngan an daraga hin mga taramnon. Tikang hadto naging magsuok hira nga magsarangkay ngan **nananom** hira hin mga iba-iba nga mga bukad sanglit naging maupay ngan mahusay an ira barangay."

61. **tinda**  (1×, 1 story)
   - _AN MALIPAYON NA PARAGSUDOY_: "Usa ka adlaw naging masulob-on hi Pedro kay waray napalit han iya **tinda.**"

62. **anunsiyo**  (1×, 1 story)
   - _AN MALIPAYON NA PARAGSUDOY_: "Nag lipay hi Pedro han iya nabatian han **anunsiyo.** Naglipay liwat an iya pamilya."

63. **pagsalin-urog**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: "Usa ka adlaw samtang nagmumulay hi Potpot. Nakabati hiya han tunog han budgyong. “eeeeennnngggg eeennngggg” tunog han budgyong “Ginpapasabot nga gindidiri an paggawas han mga kabataan ngan **pagsalin-urog** hin bisan anu nga katitirok,” pag imporma han tanod."

64. **makakag-uyas**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: "Nanhunahuna hi Potpot ngan masulub-on nga sumiring. “Diri na kami **makakag-uyas** hit ak kasangkayan, ngan diri kami makaka eskwela.” "Makaka eskwela kamu pero dinhi la kamu ha balay," siring han nanay. "An aton angay buhaton atamani naton an aton kalugaringon nga diri kita matapnan hin sakit," dugang nga siring ni nanay."

65. **lwt**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: ""Pagtakop han baba ngan irong gamit an panyo, kun waray panyo puydi **lwt** an pako' han bado,ngan paharayo ha mga katawhan kun maubo" siring ni nanay. "Pagmantene liwat hin malibsog nga kalawasan, pinaagi hin pagtumar bitamina ngan pagkaon nga masustansya," dugang nga siring ni nanay."

66. **pagmantene**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: ""Pagtakop han baba ngan irong gamit an panyo, kun waray panyo puydi lwt an pako' han bado,ngan paharayo ha mga katawhan kun maubo" siring ni nanay. **"Pagmantene** liwat hin malibsog nga kalawasan, pinaagi hin pagtumar bitamina ngan pagkaon nga masustansya," dugang nga siring ni nanay."

67. **malibsog**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: ""Pagtakop han baba ngan irong gamit an panyo, kun waray panyo puydi lwt an pako' han bado,ngan paharayo ha mga katawhan kun maubo" siring ni nanay. "Pagmantene liwat hin **malibsog** nga kalawasan, pinaagi hin pagtumar bitamina ngan pagkaon nga masustansya," dugang nga siring ni nanay."

68. **pagtumar**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: ""Pagtakop han baba ngan irong gamit an panyo, kun waray panyo puydi lwt an pako' han bado,ngan paharayo ha mga katawhan kun maubo" siring ni nanay. "Pagmantene liwat hin malibsog nga kalawasan, pinaagi hin **pagtumar** bitamina ngan pagkaon nga masustansya," dugang nga siring ni nanay."

69. **masustansya**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: ""Pagtakop han baba ngan irong gamit an panyo, kun waray panyo puydi lwt an pako' han bado,ngan paharayo ha mga katawhan kun maubo" siring ni nanay. "Pagmantene liwat hin malibsog nga kalawasan, pinaagi hin pagtumar bitamina ngan pagkaon nga **masustansya,"** dugang nga siring ni nanay."

70. **hiripid**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: "“Tatagan ko hira Maya ngan Aloy han aton mga utanon,” malipayon nga siring ni Potpot. “Uu, manhahatag kita ha aton mga **hiripid,”** nalilipay nga baton ni nanay."

71. **isakto**  (1×, 1 story)
   - _Pagtimangno hin Panlawas_: "Tikang hadto ginhimo nga pamatasan han pamilya ni Potpot an agsob ngan **isakto** nga paghugas han kamot ngan pagsugot ha mga protocol panlawas para makalikay ha mga nakakatapon nga sakit."

72. **labwan**  (1×, 1 story)
   - _AN BANOG HA BUKID HURAW_: "Nagsiring hiya. "Bukid Huraw kaya ko lumupad ngan **labwan** an im kahitaas!""

73. **umandar**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "**Umandar** na an bus nga ginsasakyan ni Kaha. “Kamalipog man hini nga akon pagbiyahe”, reklamo ni Kaha. Sapit niya an dako nga sako han mga utanon ngan malangsa nga balde han isda."

74. **ginsasakyan**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Umandar na an bus nga **ginsasakyan** ni Kaha. “Kamalipog man hini nga akon pagbiyahe”, reklamo ni Kaha. Sapit niya an dako nga sako han mga utanon ngan malangsa nga balde han isda."

75. **kamalipog**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Umandar na an bus nga ginsasakyan ni Kaha. **“Kamalipog** man hini nga akon pagbiyahe”, reklamo ni Kaha. Sapit niya an dako nga sako han mga utanon ngan malangsa nga balde han isda."

76. **pagbay-og**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Usa… duha… tulo… tulo ka oras nga **pagbay-og** an gin-abat ni Kaha. Natapos gihap an iya beyahe. "Yeheey! Makakagawas na ako hini nga lugar", malipayon nga siring ni Kaha."

77. **yeheey**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Usa… duha… tulo… tulo ka oras nga pagbay-og an gin-abat ni Kaha. Natapos gihap an iya beyahe. **"Yeheey!** Makakagawas na ako hini nga lugar", malipayon nga siring ni Kaha."

78. **brown**  (1×, 1 story)
   - _Hi Kaha, Kahon_: ""Kamakaluluoy ko man kitaon", masulob-on nga siring ni Kaha. **Brown** an iya kolor nga may gudti nga mga luho ha ligid niya. Pinaagi han dulaw nga higot, nasisirahan an tapotapohon nga iya abrihan."

79. **nasisirahan**  (1×, 1 story)
   - _Hi Kaha, Kahon_: ""Kamakaluluoy ko man kitaon", masulob-on nga siring ni Kaha. Brown an iya kolor nga may gudti nga mga luho ha ligid niya. Pinaagi han dulaw nga higot, **nasisirahan** an tapotapohon nga iya abrihan."

80. **wow**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Dalidali hiya nga ginkuha han iya agaron ha iya kinamumutangan. Ginkaptan an dulaw nga higot nga ginhigot ha iya. Nahipausa hiya han iya nakita-an. **“Wow!** kamaupay man hini nga lugar.”, nalilipay nga siring ni Kaha."

81. **pamamalit**  (1×, 1 story)
   - _Hi Kaha, Kahon_: ""Kadadamo man hin tawo ha palibot', yakan ni Kaha. "Siguro kay mahagkot ini nga lugar". "Makikita ha ira nawong an kalipay ha pamamasyada, pagkaon ngan **pamamalit",** hunahuna ni Kaha."

82. **nasubo**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Ginbutang hiya sulod hin usa nga tindahan. Puno ini hin mag-upay nga mga pandekorasyon. Nakita niya nga gintagan hin kwarta an iya agaron kabalyo ha iya ngan lumakat na. **Nasubo** hi Kaha. “Kay ano ako ginbayaan han akon agaron?”, nahihingatangis nga siring ni Kaha. “Tungod ba kay luma na ako?”. “Waray nagud ada ako pulos ha iya”, tangis ni Kaha."

83. **luma**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Ginbutang hiya sulod hin usa nga tindahan. Puno ini hin mag-upay nga mga pandekorasyon. Nakita niya nga gintagan hin kwarta an iya agaron kabalyo ha iya ngan lumakat na. Nasubo hi Kaha. “Kay ano ako ginbayaan han akon agaron?”, nahihingatangis nga siring ni Kaha. “Tungod ba kay **luma** na ako?”. “Waray nagud ada ako pulos ha iya”, tangis ni Kaha."

84. **isplikar**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Nabatian hiya ni basurahan. “Diri ito ungod sangkay. Tanan kita may ada mga pulos dinhi ha tuna", **isplikar** ni Basurahan. “Diri karuyag signgon nga waray ka na pulos kun ginbayaan ka man han imo agaron "."

85. **signgon**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Nabatian hiya ni basurahan. “Diri ito ungod sangkay. Tanan kita may ada mga pulos dinhi ha tuna", isplikar ni Basurahan. “Diri karuyag **signgon** nga waray ka na pulos kun ginbayaan ka man han imo agaron "."

86. **iglabog**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "“Tama hi Basurahan. Kami gihapon imbis nga **iglabog** aadi kami para magamitan pa”, an siring han mga bagol hin lubi. "Ginhihimo kami nga pandekorasyon ha bahay, uyagan ngan puydi liwat mahimo nga garamiton ha pagluto.”"

87. **pantinda**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Waray pag-iha, umabot an anak han tag-iya han tindahan. Ginkuha an iya sulod ngan gintrapohan. “Kailangan ko ikaw kay waray ako nasusudlan hin mga gudtiay nga **pantinda”,** siring han bata."

88. **espiho**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Ginputos hiya hin malimpyo ngan bukadbukaron nga papel. May ada pa ginbutang nga pula nga ribbon ha bawbaw han iya takop. Nakita niya an iya kalugaringon ha **espiho** ha tindahan. "Kamakaruruyag kitaon it akon kalugaringon", nalilipay nga siring ni Kaha."

89. **gin-apresyar**  (1×, 1 story)
   - _Hi Kaha, Kahon_: "Tikang hadto, natood na hi Kaha nga tanan nga butang may ada pulos. **Gin-apresyar** niya an iya kalugaringon kay diri na hiya makalolooy kitaon ngan diri pa hiya makakahugaw ha kalibungan. "Damo nga salamat han maduruto ngan maabilidad nga bata", malipayon nga siring ni Kaha."

90. **nangunguna**  (1×, 1 story)
   - _An Suok nga Magsangkay_: "Ha ira pag eskwela magsapit gud hira. An ira mga maestra gindadayaw hira. Ha klase pirmi hira **nangunguna.**"

91. **nagbibinuligay**  (1×, 1 story)
   - _An Suok nga Magsangkay_: "Mga buruhaton ha balay waray kabudlay. Kay hira nga duha **nagbibinuligay.** Mga kag-anak nira waray problema."

92. **pagpahuway**  (1×, 1 story)
   - _An Suok nga Magsangkay_: "Bisan ha ira **pagpahuway.** Pirmi hira nag-iinatubangay. Pangandoy nira dungan nga mapa-uswag."

93. **mapa-uswag**  (1×, 1 story)
   - _An Suok nga Magsangkay_: "Bisan ha ira pagpahuway. Pirmi hira nag-iinatubangay. Pangandoy nira dungan nga **mapa-uswag.**"

94. **gin-raut**  (1×, 1 story)
   - _An Suok nga Magsangkay_: "Nahingadto hi Mila ha hirayo nga dapit. Hiya nakasala ha ira kamagsangkay. **Gin-raut** niya Ela ha iba."

95. **ginpinsar**  (1×, 1 story)
   - _An Suok nga Magsangkay_: "**Ginpinsar** ni Ela an panhitabo. Kada gab-i hiya nagtatangis. Ug hi Ela nagkasakit."

96. **tsukolate**  (1×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: "Hi Ynah in usa nga bata nga babayi. Gutiay ngan matambok. Ayon niya it mga pagkaon nga magtam-is sugad hit cake, ice cream, **tsukolate,** softdrinks, lollipop, labi na gud it mga dolce."

97. **aanhun**  (1×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: "Kun nalakat na ngani it iya Tatay ngan Nanay para magtrabaho pirmi gud hiya naaro hin singko. **"Aanhun** mo na liwat it kwarta Ynah?" pakiana ha iya ni Tatay."

98. **tim**  (1×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: "May ada la po ako papaliton ha tindahan Nay, Tay! siring ni Ynah. "Upaya naman nga diri dolce **tim** paliton, mas maupay kun tinapay nala anak!" siring han iya nanay."

99. **daun**  (1×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: "Dumiritso hiya **daun** ha tindahan. Pumalit hiya hin iba-iba nga klase hin dolce, waray hiya bumali han siring ni iya Nanay nga tinapay nala it paliton imbis nga dolce."

100. **bilngon**  (1×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: "Tigda nga nakagmata hi Ynah, nahangos ngan nakagtuok. "Hin o dawla adi nga nagtitinuok?" siring han iya Nanay. Gumawas hiya han ira kwarto para **bilngon** kun diin tikang an tuok."

101. **naku**  (1×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: ""Hay **naku** anak, hinaot unta nga pirmi kana manmamati tam mga sagdon ha imo". yakan ni iya nanay. Tikang hadto nga panhitabo, pirmi na hiya nag-totooth brush kada kakahuman niya pagkaon."

102. **tam**  (1×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: ""Hay naku anak, hinaot unta nga pirmi kana manmamati **tam** mga sagdon ha imo". yakan ni iya nanay. Tikang hadto nga panhitabo, pirmi na hiya nag-totooth brush kada kakahuman niya pagkaon."

103. **nag-totooth**  (1×, 1 story)
   - _An Bata nga Mahilig hin Dolce_: ""Hay naku anak, hinaot unta nga pirmi kana manmamati tam mga sagdon ha imo". yakan ni iya nanay. Tikang hadto nga panhitabo, pirmi na hiya **nag-totooth** brush kada kakahuman niya pagkaon."

104. **nagsarit**  (1×, 1 story)
   - _Mga Kamot ni Lotlot_: "Usa ka Sabado, **nagsarit** hi Lotlot kan iya Nanay Lila nga makikimulay hiya ha ira libong Nanay, human na ako manilhig. Pwede ba ako magmulay ha gawas?” pakiana ni Lotlot Oo sige, basta paghirot ikaw ha.”, yakan ni Nanay Lila “Opo, nanay.”, baton ni Lotlot."

105. **paghinaw**  (1×, 1 story)
   - _Mga Kamot ni Lotlot_: "Gintawag na hi Lotlot ni iya nanay para mangaon. “Lotlot, pakadi na pag meryenda na. Sano ka kumaon, **paghinaw** anay hit imo kamot ha.”, tugon ni Nanay Lila. Tungod nga guol man hi Lotlot Nahubya hiya paghunaw ngan kumaon dayon hiya hin baduya nga saging"

106. **kasilyas**  (1×, 1 story)
   - _Mga Kamot ni Lotlot_: "“Asya nga nagsakit an imo tiyan. Kinahanglan nga permi kita maghuhunaw sano ngan katapos kumaon, katapos magmulay ngan katapos gumamit han **kasilyas** para malimpyo permi an aton mga kamot. Kumapot ka han baduya nabalhin an kagaw han imo mahugaw nga kamot ngadto han imo pagkaon asya an hinungdan han pagsakit han imo tiyan, Lotlot.” siring ni Nanay Lila"

107. **pagsinakay**  (1×, 1 story)
   - _An Baluto_: ""Tatay, kaupay man ngayan **pagsinakay** hin baluto hano", siring ni Jose. "Oo naman asay pa kun maupay an panahon", baton ni Mano Boboy."

108. **hano**  (1×, 1 story)
   - _An Baluto_: ""Tatay, kaupay man ngayan pagsinakay hin baluto **hano",** siring ni Jose. "Oo naman asay pa kun maupay an panahon", baton ni Mano Boboy."

109. **pag-alsaha**  (1×, 1 story)
   - _An Baluto_: "Ha di maiha nga oras ginbuligan ni Mano Boboy ngan Jose **pag-alsaha** an pukot. Nahipausa hira pagkita nga dadamo an sulod nga isda. "Hala tatay, kadadamo man han aton dakop yana! Damo an aton mahisasakay ha aton baluto". Yehey! Yakan nga malipayon ni Boboy."

110. **tipauli**  (1×, 1 story)
   - _An Baluto_: "Malipayon ngan mahiyum-hiyom hi Mano Boboy ngan Jose samtang nagbubugsay hira han ira baluto **tipauli** ngadto han ira balay."

111. **nagsisibu-sibuay**  (1×, 1 story)
   - _Waray na kakit-i_: "An mga iba-iba nga tamsi **nagsisibu-sibuay** sanglit nagsaway hi iya nanay"bangin kamo madisgrasya hinay-hinay la kamo hit iyu pag-uyag pikoy"siring ni iya nanay, "opo nanay pikoy", baton han anak"

112. **mamiling**  (1×, 1 story)
   - _Waray na kakit-i_: "Usa ka adlaw lumakat hira nanay Pikoy kaupod an iya mga anak ug an iba pa nga tamsi para **mamiling** hin pagkaon. Lumupad hira, kumadto hira ha harayo nga lugar."

113. **pinanmulod**  (1×, 1 story)
   - _Waray na kakit-i_: "Samtang waray hira nanay Pikoy ngan an iba pa nga tamsi umabot an tag iya han tuna ngan **pinanmulod** nira tanan nga mga kahoy,waray mag iha nawara na an tanan nga kakahuyan."

114. **uukyan**  (1×, 1 story)
   - (no context found)

115. **maukyan**  (1×, 1 story)
   - _Waray na kakit-i_: "Naghimo nala hira hin ira mga urukyan nga malay-balay kay waray naman an kagugub an, waray na an mga kahayupan nga nan-ngungukoy nganhi,ngan an damo nga kakakahuyan. Sanglit kamo nga mga bata ayaw niyu pasagdi it aton kagugub-an, pagtanom kamo hin mga kahoy para mayda **maukyan** an katamsihan."

116. **pagpinasarang**  (1×, 1 story)
   - _An Panapuan kan Elay_: ""Ayaw **pagpinasarang** dinhi kay malakat ako" pahinumdom ni Nanay. "Oo nanay" baton ni Elay. "An akon panapuan ha?" mahiyum-hiyom nga yakan ni Elay. Naruruyag gud hiya nga an iya paborito an pirmi panapuan ha iya ni iya nanay."

117. **ige**  (1×, 1 story)
   - _An Panapuan kan Elay_: "Dali-dali nga umuli hi Elay ha ira balay. "Nanay, pasaylua ako. Nahingalimot ako paghimo han imo tugon ha akon kay nag-uyag ako" nagbabasol nga yakan ni Elay. "Halas **ige,** sunod trabahua anay an akon tugon ha san-o ka mag-uyag. Adi na an imo panapuan ihahatag ko ha imo katapos mo sumugot" yakan ni Nanay Maya."

118. **sumugot**  (1×, 1 story)
   - _An Panapuan kan Elay_: "Dali-dali nga umuli hi Elay ha ira balay. "Nanay, pasaylua ako. Nahingalimot ako paghimo han imo tugon ha akon kay nag-uyag ako" nagbabasol nga yakan ni Elay. "Halas ige, sunod trabahua anay an akon tugon ha san-o ka mag-uyag. Adi na an imo panapuan ihahatag ko ha imo katapos mo **sumugot"** yakan ni Nanay Maya."

119. **susugton**  (1×, 1 story)
   - _An Panapuan kan Elay_: "Malipayon nga nag-himos ngan nag-alog hi Elay. "Diri na ako mautro sunod" Pinsar ni Elay. **"Susugton** ko anay an iya tugon san-o ako mag-uyag kay gintatagan ako niya han akon pabotiro nga pasalubong"."

120. **pasalubong**  (1×, 1 story)
   - _An Panapuan kan Elay_: "Malipayon nga nag-himos ngan nag-alog hi Elay. "Diri na ako mautro sunod" Pinsar ni Elay. "Susugton ko anay an iya tugon san-o ako mag-uyag kay gintatagan ako niya han akon pabotiro nga **pasalubong".**"

121. **siyahan**  (1×, 1 story)
   - _An Maduruto nga Parapangisda_: "Pangisda an **siyahan** nga pangabuhi ni Tatay Omi. Tungod kay waray man hiya makatapos han pag iskoyla."

122. **magkaada**  (1×, 1 story)
   - _An Maduruto nga Parapangisda_: "Maadlaw man o mauran. Mamadlos ngan makusog man it balod nagikan la gihap pakadto ha dagat hi Tatay Omi para magbiling hin ira kakaunon ngan **magkaada** kwarta."

123. **igsusura**  (1×, 1 story)
   - _An Maduruto nga Parapangisda_: "Usa ka adlaw, malain an kaoras han panahon. "Omi, ayaw la anay pagkadto ha dagat kay diri maupay it panahon", siring ni Nanay Ondit. "Kon diri ngani ako gumikan waray kita **igsusura** ngan kakaunon niyan. Waray liwat kita igpapalit gamit kanan pag iskoyla hit kabataan" , baton ni Tatay Omi ."

124. **naghuhukot**  (1×, 1 story)
   - _An Maduruto nga Parapangisda_: "Kada adlaw amo pirmi ito it kan Tatay Omi ginbubuhat. Kun diri ngani hiya nakakagikan ngadto ha dagat, nabulig hiya ha mga trabahuon ha balay ngan **naghuhukot** han pukot."

125. **makakatalwas**  (1×, 1 story)
   - _An Maduruto nga Parapangisda_: "Umabot an damo nga kakurian ngan kawaray kwarta. Pero padayon la gihap hiya han pangisda kay natuod hiya nga **makakatalwas** hira hit mga kakurian."

126. **pag-iskoyla**  (1×, 1 story)
   - _An Maduruto nga Parapangisda_: "Naglabay an mga panahon naging maupay an kabutang han pamilya ni Tatay Omi. Nakatapos **pag-iskoyla** an iya mga anak ngan may ada na mga trabaho pinaagi han iya paningkamot han pangisda."

127. **sapayan**  (1×, 1 story)
   - _An Maduruto nga Parapangisda_: ""Damo nga salamat tatay han imo waray kaguol nga pagtimangno ha amon, dugang nga pulong ni Andy kan iya tatay. "Waray **sapayan,** anak. Obligasyon ito namon nga mga kag-anak. An makagarahom nga Diyos an angay naton pasalamatan ha tanan nga grasya nga iya ginhahatag ha aton," baton ni Tatay Omi."

128. **apisar**  (1×, 1 story)
   - _An Maduruto nga Parapangisda_: "Masisiring nga usa nga mahigugmaon nga tatay ngan maduruto nga parapangisda hi Tatay Omi. **Apisar** han mga kakurian padayon nga naato ha mga problima nga naulpot ha kinabuhi."

129. **hilumon**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Ha usa nga **hilumon** ngan mahayag nga baryo ha probinsya han Samar, nakatira hi Marites usa nga disi-sais anyos nga babaye nga puno hin damgo ngan paglaum. An ira balay ginbubuhat la tikang ha kahoy ngan yero, pero puno ini hin gugma ngan pagtinabangay."

130. **probinsya**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Ha usa nga hilumon ngan mahayag nga baryo ha **probinsya** han Samar, nakatira hi Marites usa nga disi-sais anyos nga babaye nga puno hin damgo ngan paglaum. An ira balay ginbubuhat la tikang ha kahoy ngan yero, pero puno ini hin gugma ngan pagtinabangay."

131. **disi-sais**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Ha usa nga hilumon ngan mahayag nga baryo ha probinsya han Samar, nakatira hi Marites usa nga **disi-sais** anyos nga babaye nga puno hin damgo ngan paglaum. An ira balay ginbubuhat la tikang ha kahoy ngan yero, pero puno ini hin gugma ngan pagtinabangay."

132. **yero**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Ha usa nga hilumon ngan mahayag nga baryo ha probinsya han Samar, nakatira hi Marites usa nga disi-sais anyos nga babaye nga puno hin damgo ngan paglaum. An ira balay ginbubuhat la tikang ha kahoy ngan **yero,** pero puno ini hin gugma ngan pagtinabangay."

133. **nag-aambit**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Hi Marites kilala ha ira eskwelahan sugad nga usa nga matinalahuron, matinumanon, ngan maalam nga estudyante. Pirme hiya **nag-aambit** ha klase, ngan ginpapabilhan han iya mga maestro an iya kakugi. “Diri gud ako matitimbang,” siring niya ha iya kalugaringon, “kay para ini ha akon pamilya ngan ha akon tidaraon.” An iya pinakadako nga damgo amo an magin maestra."

134. **ginpapabilhan**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Hi Marites kilala ha ira eskwelahan sugad nga usa nga matinalahuron, matinumanon, ngan maalam nga estudyante. Pirme hiya nag-aambit ha klase, ngan **ginpapabilhan** han iya mga maestro an iya kakugi. “Diri gud ako matitimbang,” siring niya ha iya kalugaringon, “kay para ini ha akon pamilya ngan ha akon tidaraon.” An iya pinakadako nga damgo amo an magin maestra."

135. **pagsulay**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Pero ha luyo han iya kalipay, mayda maabot nga **pagsulay.** Nakilala niya hi Carlo usa nga lalaki nga mas tigulang ha iya. Malambing hi Carlo, ngan pirme hiya naghahatag hin atensyon. Ha murayaw nga edad ngan kakulangan hin eksperyensya, naging duok hira."

136. **tigulang**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Pero ha luyo han iya kalipay, mayda maabot nga pagsulay. Nakilala niya hi Carlo usa nga lalaki nga mas **tigulang** ha iya. Malambing hi Carlo, ngan pirme hiya naghahatag hin atensyon. Ha murayaw nga edad ngan kakulangan hin eksperyensya, naging duok hira."

137. **nag-iiba**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Paglabay hin pipira ka semana, napansin niya nga **nag-iiba** an iya lawas. Nakuratan hiya burod hiya. An iya kalibutan sugad hin nabungkag. Damo nga gab-i an iya ginugol ha pag-ukoy ngan pagtinaluha."

138. **lihok**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Pero ha kada adlaw nga naglabay, ginbabatian niya an **lihok** han bata ha iya tiyan. “An akon anak… diri ko hiya pababayaan,” siring niya. Han adlaw han iya pagpanganak, gin-agian niya an duro nga kasakit. Pero han iya nakita an iya anak, usa nga matahum nga batang lalaki. Pinangaranan niya ini nga hi Joshua."

139. **huli**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "“Marites,” siring han iya nanay, “diri pa **huli** an tanan. Pwede ka pa bumalik ha eskwelahan.” Tungod han suporta, nagdesisyon hiya nga magpadayon. Diri ini masayon. Adlaw-adlaw, ginbubuhat niya an iya pinakamaopay. Usahay ginbibitbit niya hi Joshua kon waray magbantay. Ha gab-i, nag-aaral hiya bisan kapoy na gud."

140. **suporta**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "“Marites,” siring han iya nanay, “diri pa huli an tanan. Pwede ka pa bumalik ha eskwelahan.” Tungod han **suporta,** nagdesisyon hiya nga magpadayon. Diri ini masayon. Adlaw-adlaw, ginbubuhat niya an iya pinakamaopay. Usahay ginbibitbit niya hi Joshua kon waray magbantay. Ha gab-i, nag-aaral hiya bisan kapoy na gud."

141. **ginbibitbit**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "“Marites,” siring han iya nanay, “diri pa huli an tanan. Pwede ka pa bumalik ha eskwelahan.” Tungod han suporta, nagdesisyon hiya nga magpadayon. Diri ini masayon. Adlaw-adlaw, ginbubuhat niya an iya pinakamaopay. Usahay **ginbibitbit** niya hi Joshua kon waray magbantay. Ha gab-i, nag-aaral hiya bisan kapoy na gud."

142. **nag-aaral**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "“Marites,” siring han iya nanay, “diri pa huli an tanan. Pwede ka pa bumalik ha eskwelahan.” Tungod han suporta, nagdesisyon hiya nga magpadayon. Diri ini masayon. Adlaw-adlaw, ginbubuhat niya an iya pinakamaopay. Usahay ginbibitbit niya hi Joshua kon waray magbantay. Ha gab-i, **nag-aaral** hiya bisan kapoy na gud."

143. **palakpak**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Naglabay an mga tuig, ngan padayon hiya nga naningkamot. Tubtob nga nakaabot hiya ha iya graduation. Ha entablado, samtang gin-aabot niya an iya diploma, nabati niya an kusog nga **palakpak.** Waray hiya kapugong han iya luha. “Natuman ko gud,” siring niya ha iya kalugaringon."

144. **paonan-o**  (1×, 1 story)
   - _Ang Kusog han Gugma ha Murayaw nga Edad_: "Pagkahuman, nakatrabaho hiya sugad nga maestra ha ira baryo. Damo nga kabataan an iya natutdoan, ngan gin-inspirar niya ini pinaagi han iya istorya. Usa ka adlaw, nagpakiana an usa niya nga estudyante, “Ma’am, **paonan-o** kamo nagin kusog?” Nagngiti hi Marites ngan siniring, “An kusog diri tikang ha edad. Tikang ini ha gugma ngan determinasyon.”"
