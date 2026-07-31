// Grade-1 (uncontracted) English braille mapping to Unicode Braille Patterns
// block (U+2800-U+283F). Visual representation only — not intended as a
// substitute for a real refreshable braille display.
const MAP: Record<string, string> = {
  a: "⠁", b: "⠃", c: "⠉", d: "⠙", e: "⠑", f: "⠋", g: "⠛", h: "⠓", i: "⠊",
  j: "⠚", k: "⠅", l: "⠇", m: "⠍", n: "⠝", o: "⠕", p: "⠏", q: "⠟", r: "⠗",
  s: "⠎", t: "⠞", u: "⠥", v: "⠧", w: "⠺", x: "⠭", y: "⠽", z: "⠵",
  "0": "⠴", "1": "⠂", "2": "⠆", "3": "⠒", "4": "⠲", "5": "⠢", "6": "⠖",
  "7": "⠶", "8": "⠦", "9": "⠔", " ": "⠀", ".": "⠲", ",": "⠂", "?": "⠦", "!": "⠖",
};

export function textToBraille(text: string): string {
  return text
    .toLowerCase()
    .split("")
    .map((ch) => MAP[ch] ?? ch)
    .join("");
}
