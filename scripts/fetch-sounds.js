#!/usr/bin/env node
// fetch-sounds.js — the v1.4 sound replacement pass, drop-in half.
//
// Reads scripts/sounds-manifest.json and downloads each curated freesound.org
// sound into assets/sounds/ as the mp3 SoundService.init loads. No ffmpeg is
// needed: freesound serves a ready "preview-hq-mp3" for every sound.
//
// It is self-verifying, because the person who curated the manifest could not
// audition audio and freesound licenses/durations drift:
//   • LICENSE guard — only Creative Commons 0 and Attribution (CC-BY) are
//     accepted. The app monetizes, so NonCommercial (BY-NC) is refused, and
//     ShareAlike (BY-SA) is skipped unless --allow-sa. CC-BY downloads append
//     to assets/sounds/ATTRIBUTION.md.
//   • DURATION guard — a sound longer than the target's maxDurationSec is
//     skipped (a 35s "shimmer texture" must not become the freeze cue). Pass
//     --force to override, or --max=SECONDS to set a global cap.
// On any refusal the script tries the entry's "alternates" in order.
//
// Usage (from repo root):
//   FREESOUND_TOKEN=xxxx node scripts/fetch-sounds.js            # all targets
//   FREESOUND_TOKEN=xxxx node scripts/fetch-sounds.js freeze.mp3 combo30.mp3
//   FREESOUND_TOKEN=xxxx node scripts/fetch-sounds.js --dry      # metadata only
//
// Get a free API token (a "token", NOT OAuth): https://freesound.org/apiv2/apply/
// Requires Node 18+ (global fetch). Nothing here runs in a build.

const fs = require("fs")
const path = require("path")

const TOKEN = process.env.FREESOUND_TOKEN
const ROOT = path.resolve(__dirname, "..")
const SOUNDS_DIR = path.join(ROOT, "assets", "sounds")
const ATTRIB = path.join(SOUNDS_DIR, "ATTRIBUTION.md")
const MANIFEST = path.join(__dirname, "sounds-manifest.json")

const argv = process.argv.slice(2)
const flags = new Set(argv.filter((a) => a.startsWith("--")))
const globalMax = (() => {
  const m = argv.find((a) => a.startsWith("--max="))
  return m ? Number(m.split("=")[1]) : null
})()
const only = argv.filter((a) => !a.startsWith("--"))
const DRY = flags.has("--dry")
const FORCE = flags.has("--force")
const ALLOW_SA = flags.has("--allow-sa")

if (!TOKEN && !DRY) {
  console.error(
    "FREESOUND_TOKEN is not set. Get one at https://freesound.org/apiv2/apply/\n" +
      "  FREESOUND_TOKEN=xxxx node scripts/fetch-sounds.js",
  )
  process.exit(1)
}

// Returns { ok, cc0, label } for a freesound license URL.
function classifyLicense(url) {
  const u = (url || "").toLowerCase()
  if (u.includes("zero") || u.includes("publicdomain"))
    return { ok: true, cc0: true, label: "CC0" }
  if (u.includes("nc")) return { ok: false, label: "NonCommercial (refused)" }
  if (u.includes("-sa") || u.includes("sampling"))
    return { ok: !!ALLOW_SA, cc0: false, label: "ShareAlike/Sampling" }
  if (u.includes("/by")) return { ok: true, cc0: false, label: "Attribution" }
  return { ok: false, label: `unknown (${url})` }
}

async function meta(id) {
  const url =
    `https://freesound.org/apiv2/sounds/${id}/` +
    `?fields=id,name,license,duration,previews,username&token=${TOKEN}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`meta ${id}: HTTP ${res.status}`)
  return res.json()
}

async function download(previewUrl, dest) {
  // Preview files are public; if a CDN edge ever 403s, retry with the token.
  let res = await fetch(previewUrl)
  if (!res.ok) res = await fetch(`${previewUrl}?token=${TOKEN}`)
  if (!res.ok) throw new Error(`download: HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  return buf.length
}

// Try one candidate id for a target. Returns an attribution record or null.
async function tryCandidate(entry, id, author) {
  const m = await meta(id)
  const lic = classifyLicense(m.license)
  const cap = globalMax ?? entry.maxDurationSec ?? Infinity
  const tag = `${entry.target} <- ${id} (${m.username || author})`
  if (!lic.ok) {
    console.warn(`  SKIP  ${tag}: ${lic.label}`)
    return null
  }
  if (m.duration > cap && !FORCE) {
    console.warn(
      `  SKIP  ${tag}: ${m.duration.toFixed(1)}s > ${cap}s cap (--force to keep)`,
    )
    return null
  }
  const rec = {
    target: entry.target,
    id: m.id,
    name: m.name,
    author: m.username || author,
    url: `https://freesound.org/people/${m.username || author}/sounds/${m.id}/`,
    license: lic.label,
    cc0: lic.cc0,
    duration: m.duration,
  }
  if (DRY) {
    console.log(
      `  DRY   ${tag}: ${lic.label}, ${m.duration.toFixed(1)}s — "${m.name}"`,
    )
    return rec
  }
  const pv = m.previews && m.previews["preview-hq-mp3"]
  if (!pv) {
    console.warn(`  SKIP  ${tag}: no preview-hq-mp3`)
    return null
  }
  const bytes = await download(pv, path.join(SOUNDS_DIR, entry.target))
  console.log(
    `  OK    ${tag}: ${lic.label}, ${m.duration.toFixed(1)}s, ${(bytes / 1024).toFixed(0)}KB`,
  )
  return rec
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  const entries = manifest.sounds.filter(
    (e) => only.length === 0 || only.includes(e.target),
  )
  if (entries.length === 0) {
    console.error(`No manifest targets matched: ${only.join(", ")}`)
    process.exit(1)
  }
  console.log(
    `${DRY ? "[dry run] " : ""}${entries.length} target(s) -> ${SOUNDS_DIR}\n`,
  )

  const attributions = []
  const failed = []
  for (const entry of entries) {
    console.log(entry.target)
    const candidates = [
      { id: entry.id, author: entry.author },
      ...(entry.alternates || []).map((a) => ({ id: a.id, author: a.author })),
    ]
    let done = null
    for (const c of candidates) {
      try {
        done = await tryCandidate(entry, c.id, c.author)
        if (done) break
      } catch (err) {
        console.warn(`  ERR   ${entry.target} <- ${c.id}: ${err.message}`)
      }
    }
    if (!done) failed.push(entry.target)
    else if (!done.cc0) attributions.push(done)
  }

  if (!DRY && attributions.length) {
    const lines = [
      "# Sound attributions",
      "",
      "The app ships these freesound.org sounds under Creative Commons",
      "Attribution (CC-BY). CC0 sounds need no credit and are not listed.",
      "Generated by scripts/fetch-sounds.js.",
      "",
      ...attributions.map(
        (a) =>
          `- **${a.target}** — "${a.name}" by ${a.author} (${a.license}) — ${a.url}`,
      ),
      "",
    ]
    fs.writeFileSync(ATTRIB, lines.join("\n"))
    console.log(`\nWrote ${ATTRIB} (${attributions.length} CC-BY credit(s)).`)
  }

  console.log(
    `\nDone. ${entries.length - failed.length}/${entries.length} resolved.` +
      (failed.length ? ` Unresolved: ${failed.join(", ")}` : ""),
  )
  if (failed.length) process.exitCode = 2
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
