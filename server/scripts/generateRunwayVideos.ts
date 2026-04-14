/**
 * generateRunwayVideos.ts
 * Generate thematic videos via Runway API.
 *
 * Phase 1 (this commit): API connectivity test only.
 *   Run without args to call GET https://api.dev.runwayml.com/v1/tasks
 *   and dump the response. Documents the available endpoints, task
 *   shape, and any auth errors.
 *
 * Phase 2 (next iteration, once we know the shape):
 *   --slug <theme> → runs generateVideo(prompt, slug) against the
 *   appropriate endpoint, polls until done, downloads the mp4 to
 *   public/videos/themes/{slug}.mp4.
 *
 * Usage examples :
 *   npx tsx server/scripts/generateRunwayVideos.ts              # API test only
 *   npx tsx server/scripts/generateRunwayVideos.ts --slug paris # generate one
 *
 * Env vars:
 *   - RUNWAY_API_KEY (required)
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, "..", "..", "client", "public", "videos", "themes");
const RUNWAY_BASE = "https://api.dev.runwayml.com/v1";

// Prompts à remplir par le user. Pour l'instant, stubs.
const THEMES: Record<string, string> = {
  "saint-tropez": "",
  "paris": "",
  "bordeaux": "",
  "nice": "",
  "monaco": "",
  "marrakech": "",
  "tokyo": "",
  "new-york": "",
  "bali": "",
  "dubai": "",
  "londres": "",
};

// ─── CLI parsing ───────────────────────────────────────────────────────
function parseArgs(): { slug?: string; test: boolean } {
  const args = process.argv.slice(2);
  const slugIdx = args.indexOf("--slug");
  const slug = slugIdx >= 0 ? args[slugIdx + 1] : undefined;
  return { slug, test: !slug };
}

// ─── API connectivity test ─────────────────────────────────────────────
async function testApi(apiKey: string): Promise<void> {
  console.log("[runway] Testing API connectivity…");
  console.log(`[runway] Endpoint: GET ${RUNWAY_BASE}/tasks`);

  const resp = await fetch(`${RUNWAY_BASE}/tasks`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "X-Runway-Version": "2024-11-06",
      Accept: "application/json",
    },
  });

  console.log(`[runway] Status: ${resp.status} ${resp.statusText}`);
  const rawText = await resp.text();

  let parsed: any = null;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    /* raw */
  }

  if (parsed) {
    console.log("[runway] Response (JSON):");
    console.log(JSON.stringify(parsed, null, 2));
  } else {
    console.log("[runway] Response (raw):");
    console.log(rawText.slice(0, 2000));
  }

  if (!resp.ok) {
    console.error(`\n[runway] ✗ Request failed (${resp.status})`);
    if (resp.status === 401) {
      console.error("[runway] Authentication failed — check RUNWAY_API_KEY.");
    } else if (resp.status === 404) {
      console.error("[runway] Endpoint not found — confirm the base URL and path.");
    }
    process.exit(1);
  }

  console.log("\n[runway] ✓ API connectivity OK");
  console.log("[runway] Next step: implement generateVideo() using the endpoint shape shown above.");
}

// ─── Video generation (stub to implement in phase 2) ──────────────────
async function generateVideo(prompt: string, slug: string, apiKey: string): Promise<void> {
  if (!prompt) {
    console.error(`[runway] No prompt defined for slug "${slug}". Add it to THEMES in the script.`);
    process.exit(1);
  }

  console.log(`[runway] Generating video for "${slug}"`);
  console.log(`[runway] Prompt: ${prompt}`);

  // TODO phase 2 — once we know the actual endpoint shape from testApi(),
  // implement the POST request, polling, and download here.
  // Likely flow based on Runway Gen-3 / Gen-4 API :
  //   1. POST /v1/text_to_video (or /v1/image_to_video) with { promptText, model, duration, ratio }
  //   2. Receive { id: taskId }
  //   3. Poll GET /v1/tasks/:id until status === "SUCCEEDED" (returns { output: [url] })
  //      or status === "FAILED" (abort)
  //   4. fetch() the output URL and stream it to OUTPUT_DIR/{slug}.mp4
  //
  // For now, emit a clear TODO so the user knows this branch is dormant.
  console.warn(
    `[runway] generateVideo is a stub until the API test confirms the exact endpoints and request shape. Re-run without --slug to test connectivity.`
  );
  process.exit(2);
}

// ─── Helper to download a file (phase 2 use) ──────────────────────────
async function downloadTo(url: string, destPath: string): Promise<void> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Download failed: ${resp.status}`);
  const arrayBuffer = await resp.arrayBuffer();
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  console.log(`[runway] Saved → ${destPath}`);
}

// ─── Main ──────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const apiKey = process.env.RUNWAY_API_KEY;
  if (!apiKey) {
    console.error("[runway] RUNWAY_API_KEY is required");
    process.exit(1);
  }

  const { slug, test } = parseArgs();

  if (test) {
    await testApi(apiKey);
    return;
  }

  if (slug) {
    if (!(slug in THEMES)) {
      console.error(`[runway] Unknown slug "${slug}". Available: ${Object.keys(THEMES).join(", ")}`);
      process.exit(1);
    }
    // Ensure the output directory exists before we start the long job
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    await generateVideo(THEMES[slug], slug, apiKey);
  }
}

// Suppress unused warnings on phase-1 helpers so the script compiles cleanly
void downloadTo;

main().catch((err) => {
  console.error("[runway] Fatal error:", err);
  process.exit(1);
});
