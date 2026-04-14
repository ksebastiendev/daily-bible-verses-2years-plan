import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createSupabaseScriptClient } from "../lib/supabase/server";

const PAGE_SIZE = 1000;
const RATE_LIMIT_MS = 100;
const PASSAGE_API_BASE_URL = "https://bible-available-api.onrender.com";

type PlanDayRow = {
  id: string;
  reference: string;
  passage_text: string | null;
};

class PassageApiRequestError extends Error {
  statusCode: number;
  apiMessage: string;
  apiRef: string;

  constructor(args: { statusCode: number; apiMessage: string; apiRef: string }) {
    super(`HTTP ${args.statusCode} - ${args.apiMessage}`);
    this.name = "PassageApiRequestError";
    this.statusCode = args.statusCode;
    this.apiMessage = args.apiMessage;
    this.apiRef = args.apiRef;
  }
}

type PassageApiResponse = {
  segments?: Array<{
    book?: { name?: string };
    verses?: Array<{
      chapter?: number;
      verse?: number;
      text?: string;
    }>;
  }>;
};
const BOOK_MAP: Record<string, string> = {
  // Ancien Testament
  Gen: "Genese", Gn: "Genese",
  Ex: "Exode",
  Lev: "Levitique", Lv: "Levitique",
  No: "Nombres", Nb: "Nombres", Num: "Nombres",
  Deut: "Deuteronome", Dt: "Deuteronome",
  Jos: "Josue",
  Jug: "Juges", Jg: "Juges",
  Ruth: "Ruth", Rt: "Ruth",
  "1Sam": "1-samuel", "1S": "1-samuel",
  "2Sam": "2-samuel", "2S": "2-samuel",
  "1Roi": "1-rois", "1Rois": "1-rois", "1R": "1-rois",
  "2Roi": "2-rois", "2Rois": "2-rois", "2R": "2-rois",
  "1Chron": "1-chroniques", "1Chr": "1-chroniques", "1Ch": "1-chroniques",
  "2Chron": "2-chroniques", "2Chr": "2-chroniques", "2Ch": "2-chroniques",
  Esd: "Esdras", Ezr: "Esdras",
  Neh: "Nehemie",
  Est: "Esther",
  Job: "Job",
  Ps: "Psaumes", Psa: "Psaumes",
  Prov: "Proverbes", Pr: "Proverbes",
  Eccl: "Ecclesiaste", Qo: "Ecclesiaste",
  Cant: "Cantique-des-cantiques", Ct: "Cantique-des-cantiques",
  Es: "Esaie", Esa: "Esaie", Is: "Esaie",
  Jer: "Jeremie", Jr: "Jeremie",
  Lam: "Lamentations",
  Ez: "Ezechiel", Eze: "Ezechiel",
  Dan: "Daniel", Dn: "Daniel",
  Os: "Osee", Ho: "Osee",
  Joel: "Joel", Jl: "Joel",
  Am: "Amos",
  Ab: "Abdias", Abd: "Abdias",
  Jon: "Jonas",
  Mic: "Michee", Mi: "Michee",
  Nah: "Nahum", Na: "Nahum",
  Hab: "Habacuc",
  Soph: "Sophonie", So: "Sophonie",
  Agg: "Aggee", Ag: "Aggee",
  Zach: "Zacharie", Za: "Zacharie",
  Mal: "Malachie",
  // Nouveau Testament
  Mat: "Matthieu", Mt: "Matthieu",
  Mc: "Marc", Mr: "Marc", Mk: "Marc",
  Luc: "Luc", Lc: "Luc",
  Jn: "Jean",
  Act: "Actes", Ac: "Actes",
  Ro: "Romains", Rom: "Romains",
  "1Cor": "1-corinthiens", "1Co": "1-corinthiens",
  "2Cor": "2-corinthiens", "2Co": "2-corinthiens",
  Gal: "Galates",
  Eph: "Ephesiens", Ep: "Ephesiens",
  Phil: "Philippiens", Ph: "Philippiens",
  Col: "Colossiens",
  "1Thes": "1-thessaloniciens", "1Th": "1-thessaloniciens",
  "2Thes": "2-thessaloniciens", "2Th": "2-thessaloniciens",
  "1Thess": "1-thessaloniciens",
  "2Thess": "2-thessaloniciens",
  "1Tim": "1-timothee", "1Ti": "1-timothee",
  "2Tim": "2-timothee", "2Ti": "2-timothee",
  Tite: "Tite",
  Tit: "Tite",
  Philem: "Philemon",
  Phm: "Philemon",
  Heb: "Hebreux", He: "Hebreux",
  Jac: "Jacques", Ja: "Jacques", Jm: "Jacques",
  "1Pi": "1-pierre", "1Pet": "1-pierre", "1P": "1-pierre",
  "2Pi": "2-pierre", "2Pet": "2-pierre", "2P": "2-pierre",
  "1Jean": "1-jean", "1Jn": "1-jean", "1J": "1-jean",
  "2Jean": "2-jean", "2Jn": "2-jean", "2J": "2-jean",
  "3Jean": "3-jean", "3Jn": "3-jean", "3J": "3-jean",
  Jude: "Jude", Jud: "Jude",
  Apo: "Apocalypse", Ap: "Apocalypse", Rev: "Apocalypse",
};

function loadDotEnvLocal() {
  const envPath = join(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function parseLimitArg() {
  const arg = process.argv.find((item) => item.startsWith("--limit="));
  if (!arg) return null;

  const value = Number.parseInt(arg.slice("--limit=".length), 10);
  if (Number.isNaN(value) || value <= 0) {
    throw new Error("Invalid --limit value. Use --limit=N with N > 0");
  }

  return value;
}

function parseFailedOnlyArg() {
  return process.argv.includes("--failed-only");
}

function stripDayPartPrefix(segment: string) {
  return segment.replace(/^\s*[MS]\s+/i, "").trim();
}
function resolveMappedBook(bookToken: string) {
  if (BOOK_MAP[bookToken]) {
    return BOOK_MAP[bookToken];
  }

  const lower = bookToken.toLowerCase();
  const foundEntry = Object.entries(BOOK_MAP).find(([key]) => key.toLowerCase() === lower);
  if (foundEntry) {
    return foundEntry[1];
  }

  throw new Error(`Livre non reconnu: ${bookToken}`);
}

function transformSegment(segmentRaw: string) {
  const segment = stripDayPartPrefix(segmentRaw);
  if (!segment) {
    throw new Error("Segment vide");
  }

  const match = segment.match(/^([0-9]*[A-Za-z]+)(.*)$/);
  if (!match) {
    throw new Error(`Format de reference non supporte: ${segmentRaw}`);
  }

  const [, bookToken, remainder] = match;
  const mappedBook = resolveMappedBook(bookToken);

  if (mappedBook === "Philemon" && !remainder.trim()) {
    return "Philemon1";
  }

  return `${mappedBook}${remainder}`;
}

function normalizeReferenceForApi(reference: string) {
  return reference
    .replace(/\s*[|;]\s*/g, ",")
    .split(",")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => transformSegment(segment))
    .join(",");
}

function cleanVerseText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function buildPassageTextFromApi(payload: PassageApiResponse) {
  const lines: string[] = [];

  for (const segment of payload.segments ?? []) {
    const bookName = segment.book?.name?.trim() || "Livre";

    for (const verse of segment.verses ?? []) {
      const chapter = verse.chapter;
      const verseNumber = verse.verse;
      const text = typeof verse.text === "string" ? cleanVerseText(verse.text) : "";

      if (!chapter || !verseNumber || !text) continue;
      lines.push(`[${bookName} ${chapter}:${verseNumber}] ${text}`);
    }
  }

  return lines.join("\n");
}

async function fetchPassageData(reference: string) {
  const normalizedRef = normalizeReferenceForApi(reference);
  if (!normalizedRef) {
    throw new Error("Reference vide apres normalisation");
  }

  const url = new URL(`${PASSAGE_API_BASE_URL}/v1/bible/passage`);
  url.searchParams.set("ref", normalizedRef);
  url.searchParams.set("translation", "LSG1910");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    let apiMessage = response.statusText || "Unknown error";

    try {
      const parsed = JSON.parse(responseText) as Record<string, unknown>;
      if (typeof parsed.message === "string" && parsed.message.trim()) {
        apiMessage = parsed.message.trim();
      } else if (typeof parsed.error === "string" && parsed.error.trim()) {
        apiMessage = parsed.error.trim();
      } else if (responseText.trim()) {
        apiMessage = responseText.trim();
      }
    } catch {
      if (responseText.trim()) {
        apiMessage = responseText.trim();
      }
    }

    throw new PassageApiRequestError({
      statusCode: response.status,
      apiMessage,
      apiRef: normalizedRef,
    });
  }

  const payload = (await response.json()) as PassageApiResponse;
  const passageText = buildPassageTextFromApi(payload);

  if (!passageText) {
    throw new Error(`Aucun texte retourne pour ref=${normalizedRef}`);
  }

  return {
    apiRef: normalizedRef,
    passageText,
  };
}

async function fetchRows(
  supabase: ReturnType<typeof createSupabaseScriptClient>,
  options: { limit: number | null; failedOnly: boolean },
) {
  const allRows: PlanDayRow[] = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from("plan_days")
      .select("id,reference,passage_text")
      .order("day_index", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (options.failedOnly) {
      query = query.is("passage_text", null);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Lecture plan_days impossible: ${error.message}`);
    }

    const chunk = (data ?? []) as PlanDayRow[];
    allRows.push(...chunk);

    if (options.limit !== null && allRows.length >= options.limit) {
      return allRows.slice(0, options.limit);
    }

    if (chunk.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  return allRows;
}

async function updatePassageText(
  supabase: ReturnType<typeof createSupabaseScriptClient>,
  id: string,
  passageText: string,
) {
  const { error } = await supabase
    .from("plan_days")
    .update({ passage_text: passageText })
    .eq("id", id);

  if (error) {
    throw new Error(`Update impossible: ${error.message}`);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  loadDotEnvLocal();

  const dryRun = process.argv.includes("--dry-run");
  const limit = parseLimitArg();
  const failedOnly = parseFailedOnlyArg();
  const supabase = createSupabaseScriptClient();

  console.log(`[seed-passage-text] Mode: ${dryRun ? "dry-run" : "write"}`);
  console.log(`[seed-passage-text] API source: ${PASSAGE_API_BASE_URL}/v1/bible/passage`);
  console.log(`[seed-passage-text] failed-only: ${failedOnly ? "yes" : "no"}`);
  if (limit !== null) {
    console.log(`[seed-passage-text] Limit: ${limit}`);
  }

  const rows = await fetchRows(supabase, { limit, failedOnly });
  const total = rows.length;

  console.log(`[seed-passage-text] ${total} passages a traiter`);

  let success = 0;
  let failed = 0;

  for (let index = 0; index < total; index += 1) {
    const row = rows[index];

    try {
      const { apiRef, passageText } = await fetchPassageData(row.reference);

      if (dryRun) {
        const preview = passageText
          .split("\n")
          .slice(0, 2)
          .join(" ")
          .trim();

        console.log(`${index + 1}/${total} | Ref originale : "${row.reference}"`);
        console.log(`     Ref API        : "${apiRef}"`);
        console.log(`     Texte (debut)  : "${preview}"`);
      }

      if (!dryRun) {
        await updatePassageText(supabase, row.id, passageText);
      }

      success += 1;
      console.log(`${index + 1}/${total} passages traites`);
    } catch (error) {
      failed += 1;
      if (error instanceof PassageApiRequestError) {
        console.error(`${index + 1}/${total} echec id=${row.id}`);
        console.error(`  Ref originale : "${row.reference}"`);
        console.error(`  Ref API       : "${error.apiRef}"`);
        console.error(`  HTTP code     : ${error.statusCode}`);
        console.error(`  API message   : "${error.apiMessage}"`);
      } else {
        const message = error instanceof Error ? error.message : String(error);
        let safeApiRef = "n/a";

        try {
          safeApiRef = normalizeReferenceForApi(row.reference);
        } catch {
          safeApiRef = "n/a";
        }

        console.error(`${index + 1}/${total} echec id=${row.id}`);
        console.error(`  Ref originale : "${row.reference}"`);
        console.error(`  Ref API       : "${safeApiRef}"`);
        console.error("  HTTP code     : n/a");
        console.error(`  API message   : "${message}"`);
      }
    }

    if (index < total - 1) {
      await sleep(RATE_LIMIT_MS);
    }
  }

  console.log(`[seed-passage-text] Termine. Success=${success}, Failed=${failed}, Total=${total}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[seed-passage-text] Fatal: ${message}`);
  process.exit(1);
});
