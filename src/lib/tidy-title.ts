/**
 * Walk and notice titles typed in capitals ("SALE WATER PARK CIRCULAR") are
 * saved with capital first letters instead ("Sale Water Park Circular").
 *
 * - A title with no small letters at all is shouting: every word gets a
 *   capital first letter, and little joining words ("and", "of", "the"…) go
 *   small unless they start the title. Known short names (UK, NHS…) stay.
 * - A title that's mostly normal keeps its short all-capital words, which are
 *   usually names (NHS, RSPB); only all-capital words of 4+ letters change
 *   ("Daisy Nook, HARTSHEAD PIKE circular" → "Daisy Nook, Hartshead Pike circular").
 * - Words with numbers in them (5KM, A6) are left alone.
 */
const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "via", "with"]);
const KEEP = new Set(["UK", "NHS", "RSPB", "YHA", "SSSI", "BBC", "GP", "MP", "OK", "BST", "GMT", "AM", "PM", "TV", "ID", "II", "III", "IV"]);

function capitalise(word: string) {
  // Each part after a hyphen or apostrophe-free join gets its own capital (Ramsbottom-Holcombe).
  return word
    .split("-")
    .map((part) => (part ? part[0]!.toUpperCase() + part.slice(1).toLowerCase() : part))
    .join("-");
}

export function tidyTitle(title: string): string {
  const shouting = /[A-Z]/.test(title) && !/[a-z]/.test(title) && (title.match(/[A-Z]/g)?.length ?? 0) >= 4;
  let first = true;
  return title.replace(/[A-Za-z][A-Za-z'’-]*/g, (word, offset: number) => {
    const isFirst = first;
    first = false;
    // Part of a word with numbers (5KM, A6): leave it.
    const before = title[offset - 1] ?? "";
    const after = title[offset + word.length] ?? "";
    if (/\d/.test(before) || /\d/.test(after)) return word;
    const letters = word.replace(/[^A-Za-z]/g, "");
    if (letters.length < 2 || letters !== letters.toUpperCase()) return word;
    if (KEEP.has(letters)) return word;
    if (!shouting) return letters.length >= 4 ? capitalise(word) : word;
    if (!isFirst && SMALL.has(word.toLowerCase())) return word.toLowerCase();
    return capitalise(word);
  });
}
