#!/usr/bin/env python3
"""Parse Wolff Beginning Waray-Waray Vision-OCR output (v1-vision.jsonl) into a
structured lesson skeleton: lessons -> sections -> lines.

Layout facts (established by inspection):
  - running header y>0.88: "<lesson>-<page>  Lesson <n>" (rectos flip the order)
  - HathiTrust watermark: rotated left-margin lines, x < 0.08 -> drop
  - Basic Sentences pages are two-column (Waray x<~0.5, English x>~0.5);
    everything else is single-column
  - section markers in body text (OCR variants normalized):
      Commentary to Basic Sentences | 1A./IA. <title> ... 1E. | Grammatical Section
      | n.m <title> | Exercises and Pattern Practices | (song = last pages of lesson)
"""
import json, re, sys, os

SCRATCH = sys.argv[1] if len(sys.argv) > 1 else "."
OUT = sys.argv[2] if len(sys.argv) > 2 else "wolff-unit1.json"
LESSONS = range(1, 7)   # Unit 1 pilot

pages = {}
for ln in open(os.path.join(SCRATCH, "v1-vision.jsonl")):
    d = json.loads(ln)
    pages[d["page"]] = [l for l in d["lines"] if l["x"] >= 0.08]  # drop watermark

# --- page -> lesson map from running headers, then fill gaps by continuity ---
lesson_of = {}
for p, lines in pages.items():
    top = sorted([l for l in lines if l["y"] > 0.88], key=lambda l: l["x"])
    h = " ".join(l["t"] for l in top)
    m2 = re.search(r"Lesson\s*(\d+)", h)
    if m2 and re.search(r"\d+\s*[-–]\s*\d+", h):
        lesson_of[p] = int(m2.group(1))
known = sorted(lesson_of)

def is_title_page(p, n):
    """the lesson-opening page shows 'Lesson N' + its name as standalone body lines"""
    for l in pages.get(p, []):
        if re.search(rf"^Lesson\s*{n}\b", l["t"].strip()) and l["y"] > 0.7:
            return True
    return False

full = {}
for p in range(min(known), max(known) + 1):
    if p in lesson_of:
        full[p] = lesson_of[p]
    else:
        prev = max((q for q in known if q < p), default=None)
        nxt = min((q for q in known if q > p), default=None)
        if prev and nxt and lesson_of[prev] == lesson_of[nxt]:
            full[p] = lesson_of[prev]
        elif prev and nxt:
            # gap between lessons: tail pages (song/exercise ends) belong to PREV;
            # from the next lesson's title page onward they belong to NEXT
            nn = lesson_of[nxt]
            boundary = next((q for q in range(max(known[0], p - 6), nxt)
                             if is_title_page(q, nn)), nxt)
            full[p] = nn if p >= boundary else lesson_of[prev]
        elif nxt:
            full[p] = lesson_of[nxt]
# lesson 1 title page (seq 40) precedes the first headered page
first_seq = min(known)
for p in range(first_seq - 3, first_seq):
    if p in pages:
        full.setdefault(p, lesson_of[first_seq])

# OCR-fuzzed marker variants seen in the wild: "IBo Matching Questions",
# "IC. Pattorn Praotice on Basio Sentences", "ID. Huruhimangraw (Conversation)",
# "I\u2022 Free Conversation", "Ixorcisos and Pattern Practices", "1,31 Kant vs. Kita"
SECTION_PATTERNS = [
    ("commentary",  re.compile(r"^Com+[aeo]?ntary to [Bb]asi[oc]")),
    ("questions",   re.compile(r"(Mga Pa[kl]|Paki.na \(Qu|^[1ILVX]{1,4}\s?A[.,o]?\s*Qu[eo]stions)")),
    ("matching",    re.compile(r"^[1ILVX]{0,4}\s?B[.,o]?\s*Matching", re.I)),
    ("pattern",     re.compile(r"Pat+[oe]rn Pra[oc]ti[oc]e on Basi[oc]", re.I)),
    ("conversation",re.compile(r"(Huruhimangraw|^[1ILVX]{0,4}\s?D[.,o]?\s*Conv[eo]rsation)")),
    ("free_conv",   re.compile(r"Fr[eo]+ Conv[eo]rsation")),
    ("grammar",     re.compile(r"^Grammatical S[eo]ction")),
    ("exercises",   re.compile(r"^[EI]x[eo]rcis[eo]s and Pat+[oe]rn", re.I)),
    ("reading",     re.compile(r"^R[eo]ading\b")),
]
GRAMMAR_TOPIC = re.compile(r"^(\d+)[.,](\d+)\s+([A-Z].{3,60})")
SONGS = {1: "Lawiswis Kawayan", 2: "Burauen Song", 3: "Aku Magt", 4: "If You Leave",
         5: "Maryanu nga Buta", 6: "bi Lubi Medley"}

def is_two_col(lines):
    body = [l for l in lines if 0.1 < l["y"] < 0.90]
    if len(body) < 6: return False
    right = sum(1 for l in body if l["x"] > 0.52)
    left = sum(1 for l in body if l["x"] < 0.45)
    return right >= 4 and left >= 4 and right / max(1, len(body)) > 0.3

def top_markers(lines):
    """Section names printed as page-top running heads (y>0.88). The page-number
    head ("1-20", "Lesson 1") is excluded; what remains can OPEN a section when
    its inline marker fell on a page top."""
    out = []
    for l in lines:
        if l["y"] <= 0.90: continue
        t = l["t"].strip()
        if re.fullmatch(r"[\d\s\-–—.]+", t) or re.fullmatch(r"Lesson\s*\d+", t): continue
        out.append(t)
    return out

def linearize(lines, two_col):
    body = sorted([l for l in lines if l["y"] <= 0.90], key=lambda l: (-round(l["y"], 2), l["x"]))
    if not two_col:
        return [{"t": l["t"], "x": round(l["x"], 3), "y": round(l["y"], 3)} for l in body]
    out = []
    for l in body:
        col = "R" if l["x"] > 0.52 else "L"
        out.append({"t": l["t"], "x": round(l["x"], 3), "y": round(l["y"], 3), "col": col})
    return out

lessons = {}
for p in sorted(full):
    ln = full[p]
    if ln not in LESSONS: continue
    lessons.setdefault(ln, {"pages": [], "sections": []})
    lines = pages.get(p, [])
    two = is_two_col(lines)
    lessons[ln]["pages"].append({"seq": p, "two_col": two, "lines": linearize(lines, two),
                                 "top": top_markers(lines)})

# --- section segmentation: walk lines in order, cut at markers ---
ORDER = ["basic_sentences", "commentary", "questions", "matching", "pattern",
         "conversation", "free_conv", "grammar", "exercises", "reading", "song"]
for ln, L in lessons.items():
    sections = [{"name": "basic_sentences", "start": None, "lines": []}]
    song = SONGS.get(ln, "\x00")
    def cur(): return sections[-1]["name"]
    def opened(): return {sec["name"] for sec in sections}
    for pg in L["pages"]:
        for l in pg["lines"]:
            t = l["t"].strip()
            hit = None
            for name, pat in SECTION_PATTERNS:
                if pat.search(t):
                    hit = name; break
            if song.lower() in t.lower() and cur() in ("exercises", "reading"):
                hit = "song"
            gm = GRAMMAR_TOPIC.match(t)
            topic_ok = gm and (cur().startswith(("grammar", "topic")) or
                               cur() in ("conversation", "free_conv")) and int(gm.group(1)) == ln
            if hit and hit != cur() and (hit == "song" or hit not in opened()):
                sections.append({"name": hit, "start": pg["seq"], "lines": []})
            elif topic_ok:
                tid = f"topic {gm.group(1)}.{gm.group(2)}"
                if cur() != tid:
                    sections.append({"name": tid, "title": gm.group(3).strip(),
                                     "start": pg["seq"], "lines": []})
            sections[-1]["lines"].append({**l, "seq": pg["seq"]})
        # Running heads (y>0.90) name the section in effect by the END of the page.
        # If a section's inline marker was missed (fell in the head band or OCR-
        # mangled), open it now so the next page's lines land in the right bucket.
        for t in pg["top"]:
            want = None
            for name, pat in SECTION_PATTERNS:
                if pat.search(t):
                    want = name; break
            if re.match(r"^Songs?\b", t) or song.lower() in t.lower():
                want = "song"
            cur_ord = "grammar" if cur().startswith("topic") else cur()
            if want and want not in opened() and want in ORDER and cur_ord in ORDER \
               and ORDER.index(want) > ORDER.index(cur_ord):
                sections.append({"name": want, "start": pg["seq"] + 1, "lines": []})
    L["sections"] = [{k: v for k, v in s.items() if k != "lines"} | {"n_lines": len(s["lines"])}
                     for s in sections]
    L["_sections_full"] = sections

skel = {ln: {"pages": [p["seq"] for p in L["pages"]],
             "sections": L["sections"]} for ln, L in lessons.items()}
json.dump({str(ln): {"sections": L["_sections_full"]} for ln, L in lessons.items()},
          open(os.path.join(SCRATCH, OUT), "w"), ensure_ascii=False)
print(json.dumps(skel, indent=1)[:3500])
