@AGENTS.md

# PrivacyGuard — project memory for Claude Code

> **What this file is:** the durable context for this project. If you're a Claude session arriving cold, read this top-to-bottom before doing any work. Update it whenever a meaningful decision is made, an external service is configured, a mistake is learned from, or a step in the plan completes.

---

## 1. Project at a glance

**Product name:** PrivacyGuard
**Repo name:** `chatgpt-learning-platform` (legacy; predates pivot)
**Working branch:** `claude/digital-footprint-monitor-DUCFF` (previous session used `claude/digital-footprint-removal-tool-8Q7bp`; work merged in)
**Detailed plan file:** `/root/.claude/plans/i-want-to-create-playful-river.md`

**What we're building:** A personal digital-footprint-removal tool, similar in spirit to DeleteMe / Incogni / Kanary. It scans data-broker / people-search sites for the user's PII, submits opt-out / removal requests on a recurring schedule, follows up until each request is closed, and shows a dashboard with counts (found, submitted, pending, removed) plus age of pending requests.

**Honest framing (important):** No solo-built tool can fully automate this. Brokers actively defend with Cloudflare/anti-bot, CAPTCHAs, email-confirmation links, and notarized-ID requirements; their TOS forbids scraping. We position PrivacyGuard as an **"assisted opt-out + tracker"** — curated broker registry, automated where feasible, manual-assist queue everywhere else, full lifecycle tracking + scheduled follow-ups + dashboard. Do not promise full autonomy in UI/copy/docs.

---

## 2. Confirmed decisions

These were chosen explicitly by the user via `AskUserQuestion`. Do not revisit without asking.

| Topic | Decision |
|---|---|
| Hosting + scheduler | Next.js (App Router) on **Vercel** + Firebase Auth/Firestore + **Vercel Cron** (hourly tick; pick users whose `scheduleHour == currentUtcHour`) |
| Automation depth | **Manual-assist first**; upgrade brokers to automated search / email opt-out gradually. Never lie about autonomy. |
| PII encryption | **Google Cloud KMS** envelope encryption; ciphertext in Firestore, server-only decrypts |
| MVP broker scope | **SUPERSEDED — pending discovery.** Originally "10 popular US people-search sites" (Spokeo, BeenVerified, Whitepages, MyLife, PeopleFinder, Radaris, Intelius, TruePeopleSearch, FastPeopleSearch, USSearch). User is **India-based**, so a US-only registry may find nothing. Decision: **run a real discovery pass first**, then build the Step 6 registry from evidence. Do not seed brokers until discovery output exists. |
| User scope | **Single user (just the owner).** Auth is still built properly, but no multi-tenancy, billing, or admin panel. |
| Region | **India.** DPDP Act 2023 is the governing law, not CCPA/GDPR — though most large brokers honour CCPA/GDPR-style requests regardless of requester location. |
| Notifications | **Daily email digest** (one per day, batching manual actions + status changes) **plus** the dashboard for on-demand status. No per-event emails. |
| Phase 3 automation | **Keep Playwright / Cloud Run / 2Captcha in the plan** as originally designed. The Claude + Chrome connector route (see §12) is a complementary near-term path, not a replacement. |
| Dev workflow | **Cloud-only.** All code work happens in this sandbox. User stays in the browser (Firebase Console, GCP Console, Vercel, GitHub). No local clone on the user's Mac. |
| Firebase project | Keep the existing project `chatgpt-learning-platfor-c592a`; display name renamed to "PrivacyGuard". Project ID is immutable. |
| Email provider | **Resend** (free tier covers Phase 1 from `onboarding@resend.dev`). Custom domain comes in Phase 2 when we email brokers. |

---

## 3. External services — configured state

### Firebase project: `chatgpt-learning-platfor-c592a` (display name: PrivacyGuard)
- **Auth providers enabled:** Email/Password ✅. Google sign-in **not yet enabled** (banner still showing on Sign-in method tab). Optional upgrade.
- **Firestore:** Native mode, **region `asia-south2` (New Delhi)**, **production rules** (default-deny). Empty database — no collections yet.
- **Service account:** `firebase-adminsdk-7fba4@chatgpt-learning-platfor-c592a.iam.gserviceaccount.com`. Private key JSON delivered via chat upload, base64-encoded into `FIREBASE_SERVICE_ACCOUNT_B64`.

### Google Cloud (same project, billing enabled)
- **Billing:** Free trial activated ($300 credit / 90 days). Card required at trial start; not auto-charged after trial.
- **Cloud KMS:**
  - Key ring `pii` in `asia-south2`
  - Key `pii` (yes, both named `pii` — see §7 "Mistakes")
  - Protection: Software, Purpose: Symmetric encrypt/decrypt, Rotation: 90 days
  - Full resource name: `projects/chatgpt-learning-platfor-c592a/locations/asia-south2/keyRings/pii/cryptoKeys/pii`
  - The Firebase service account has the **Cloud KMS CryptoKey Encrypter/Decrypter** role on this key.

### Resend
- Account: `tarun.bhandari@gmail.com`
- API key issued, stored in `RESEND_API_KEY`. No sending domain yet — use `onboarding@resend.dev` for Phase 1.

### Vercel
- Hobby plan, signed up via GitHub.
- One project linked to this repo: **`privacyguard`** (renamed from the auto-imported `chatgpt-learning-platform`). Deploys to `privacyguard.vercel.app`.
- A duplicate auto-import (`chatgpt-learning-platform-rjpg`) was deleted.
- Environment variables **not yet added** to the Vercel project — preview deploys of this branch will fail until they are. This will be done as part of Step 3's verification or Step 10's deploy.
- Vercel auto-builds every push to this branch as a preview at a generated URL.

### GitHub
- Remote: `tarunbhandari73/chatgpt-learning-platform`
- This is the **only repository** that GitHub MCP tools can touch. Never try to access other repos.

---

## 4. Repo conventions

- **Branch:** all development on `claude/digital-footprint-removal-tool-8Q7bp`. Never push to other branches without explicit permission.
- **Commits:** one logical step per commit. Title pattern: `Step N: <what>` or `Phase N: <what>` or `chore: <what>`. Body explains the why and includes a verification note when relevant. End every commit with the Claude session footer.
- **Push:** `git push -u origin claude/digital-footprint-monitor-DUCFF` after each successful step. Retry up to 4× with exponential backoff (2s, 4s, 8s, 16s) on network errors.
- **Pull requests:** do NOT create one unless the user explicitly asks.
- **GitHub comments:** be frugal; only post when genuinely needed.
- **Hooks:** a `stop-hook-git-check.sh` nags about uncommitted changes. Treat its feedback as user instruction. Auto-commits from earlier sessions are possible — don't be surprised by extra commits in `git log` you didn't make.

---

## 5. Implementation progress

Plan steps (see `/root/.claude/plans/i-want-to-create-playful-river.md` for full detail):

| Step | What | Status | Commit |
|---|---|---|---|
| Phase 0 | External setup (Firebase, KMS, Resend, billing) | ✅ Done | — |
| 1 | Scaffold Next.js 16 + Phase 1 deps | ✅ Done | `46ff5a3` |
| 2 | Firebase client + admin SDK wiring (+ smoke test) | ✅ Done | `9cd286f` |
| 3 | Auth pages (login, AuthProvider) | ✅ Done | `5fe3ec3` |
| 3b | Fix Vercel build: add serverExternalPackages to next.config.ts | ✅ Done | (this session) |
| 4 | Firestore rules + indexes | ✅ Done | (this session) |
| 5 | KMS-encrypted PII profile editor | ⏳ Pending |  |
| 6 | Seed broker registry + ManualAssistAdapter | ⏳ Pending |  |
| 7 | Findings + Requests + Queue UI | ⏳ Pending |  |
| 8 | Dashboard KPIs | ⏳ Pending |  |
| 9 | Daily cron worker | ⏳ Pending |  |
| 10 | Vercel deploy | ⏳ Pending |  |

Each step ends with a verifiable check — do not declare a step complete without that check passing.

---

## 6. Critical files (current and planned)

Already exist:
- `src/lib/firebase/client.ts` — singleton wrapper around the Firebase Web SDK (client components)
- `src/lib/firebase/admin.ts` — singleton wrapper around firebase-admin (server-only; reads service account from `FIREBASE_SERVICE_ACCOUNT_B64`)
- `scripts/verifyFirebase.ts` — one-shot smoke test; run with `npx tsx scripts/verifyFirebase.ts`
- `firestore.rules` — security rules: users own their data, brokers are read-only to clients, schedules are Admin-only
- `firestore.indexes.json` — composite indexes on requests (status+nextCheckAt, status+submittedAt) and findings (brokerId+discoveredAt)

Coming in upcoming steps:
- `src/lib/crypto/pii.ts` — KMS envelope encrypt/decrypt
- `src/lib/brokers/types.ts` — `BrokerAdapter` interface
- `src/lib/brokers/registry.ts`, `src/lib/brokers/manualAssist.ts`, `src/lib/brokers/adapters/*.ts`
- `src/lib/scheduler/runUser.ts`, `src/lib/scheduler/cadence.ts`
- `src/app/api/cron/daily/route.ts` — Vercel cron entrypoint
- `src/app/api/requests/[id]/transition/route.ts`
- Dashboard pages under `src/app/`
- `vercel.json` — cron schedule

---

## 7. Environment variables (`.env.local`, gitignored)

Never commit or echo these values back into the chat.

| Var | What | Notes |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` etc. (×7) | Firebase Web SDK config | Intentionally public — used in client bundle |
| `FIREBASE_SERVICE_ACCOUNT_B64` | Base64 of the service-account JSON | **Highly sensitive.** Server only. Rotate if it leaks. |
| `KMS_KEY_NAME` | Full KMS key resource path | Not secret, but treated as config |
| `RESEND_API_KEY` | Resend transactional email key | **Sensitive.** Rotate if it leaks. |
| `CRON_SECRET` | Random 32-byte base64 secret | Guards `/api/cron/daily` from unauthorized triggers. Generated locally. |

When deploying to Vercel, all of these must be added to the Vercel project's environment variables (Production + Preview). The `NEXT_PUBLIC_*` ones are safe in the client bundle by design; the rest are server-only.

---

## 8. Mistakes & learnings — don't repeat

These are real things that tripped us up. Read these before you make a similar move.

1. **`.env.local` was tracked in git from the very first commit.** Firebase web SDK keys are intentionally public, so this wasn't catastrophic, but the file needed to be untracked **before** we appended any real secrets (FIREBASE_SERVICE_ACCOUNT_B64, RESEND_API_KEY). Sequence: `git rm --cached .env.local`, verify with `git check-ignore -v .env.local`, then append secrets. (See commit `c04ef8b` — auto-committed by stop hook.)
2. **`create-next-app` refuses to scaffold into a directory containing certain "conflict" files** — notably `.env.local` and `README.md`. Workaround: move them aside (`/tmp/...`), scaffold, restore. `.gitignore` is fine to leave (not on the conflict list).
3. **KMS key naming mistake — we have `cryptoKeys/pii` not `cryptoKeys/profile-pii`.** The plan said `profile-pii`; user named it `pii`. KMS keys cannot be renamed once created. Code must use `pii`. The full resource path is `projects/chatgpt-learning-platfor-c592a/locations/asia-south2/keyRings/pii/cryptoKeys/pii`.
4. **`import "server-only"` breaks `tsx` script execution** outside a Next.js context — the `server-only` package throws by design. We removed it from `src/lib/firebase/admin.ts` so the verify script could run. Trade-off: lost the build-time guard against accidentally importing Admin SDK from client code. Mitigation: `firebase-admin` itself uses Node-only APIs and would fail to bundle for client. Re-add `server-only` in route handlers / dedicated server files where they exist.
5. **tsx auto-loads `.env` and `.env.local`** — explicit `dotenv.config({ path: ".env.local" })` is redundant but harmless. Don't waste energy ripping it out.
6. **Firebase Console UI was reorganized.** Authentication is no longer under "Build → Authentication" — it's under "Product categories → Security → Authentication". Don't trust pre-2025 muscle memory.
11. **`firebase-admin` and `@google-cloud/kms` must be in `serverExternalPackages`** in `next.config.ts`. Without this, Vercel's webpack bundler tries to include them in the server bundle, fails on native modules (`undici`, `encoding`, `google-gax`), and the preview deploy errors. Fix: `serverExternalPackages: ["firebase-admin", "@google-cloud/kms", "google-gax", "encoding"]`. Build is verified clean after this fix.
7. **GCP free trial requires a credit card** but does NOT auto-charge after the trial. Mention this clearly to non-technical users so they don't refuse the trial out of fear.
8. **Service-account JSON contents and the Resend API key were displayed in the chat transcript** at upload/paste time. After we have a working end-to-end test, rotate both keys (Firebase Console → Service accounts → delete old + generate new; Resend → API Keys → revoke + create new). See "Pending hygiene tasks" below.
9. **Firestore region `asia-south2` = New Delhi**, `asia-south1` = Mumbai. The user said "India, New Delhi" → `asia-south2`. KMS key ring is in the same region for latency.
10. **The repo was originally a stub "ChatGPT learning platform"** with only `.env.local`, `.gitignore`, `README.md`. The product pivot to PrivacyGuard happened in this session. The repo and Firebase project IDs still carry the old name; only display names were updated.

---

## 9. Pending hygiene tasks

Do these once Phase 1 is end-to-end functional:

- [ ] Rotate the **Firebase Admin service account key** (its private key appeared in this chat transcript). Generate a new one in Firebase Console → Project settings → Service accounts. Re-upload, re-encode into `FIREBASE_SERVICE_ACCOUNT_B64`. Update `.env.local` locally and Vercel env.
- [ ] Rotate the **Resend API key** (same reason). Resend dashboard → API Keys → revoke old, create new. Update `RESEND_API_KEY`.
- [ ] (Optional) Enable Google sign-in in Firebase Auth and add the button to the login page.
- [ ] (Optional, deferred to Phase 2) Verify a custom sending domain in Resend so we can email brokers from `privacy@<yourdomain>`.
- [ ] (Optional) Rename the GitHub repo from `chatgpt-learning-platform` to something like `privacyguard`. Wiring task description currently pins us to the old name — coordinate before renaming.

---

## 10. Working agreements with the user

These have been established through interaction in this session. Honor them.

- **Step-by-step is preferred.** The user pauses to do each external task themselves; do not race ahead through Phase 0 tasks that require human action.
- **Always offer a recommended option** when asking the user to choose (`AskUserQuestion` with a clearly-labeled "(Recommended)" first option).
- **Be honest about constraints.** The user appreciated the "we can't fully automate this" framing. Don't oversell.
- **Browser screenshots are the primary signal** when something looks wrong on Google/Firebase consoles. Read them carefully — the user may not know which UI element to click.
- **Voice-transcribed messages happen.** Phrases like "Play do now" probably mean "Let's do it now." Pattern-match generously.
- **Secrets via chat upload** are the agreed transport for service-account JSONs. Warn about transcript exposure and queue a rotation task.
- **Don't commit without intent.** Every commit should map to a finished step or a clearly-scoped chore.

---

## 11. Stack reference (Next.js 16 + React 19)

Per `AGENTS.md`: this is Next.js 16, with breaking changes from earlier versions. When unsure, read `node_modules/next/dist/docs/`. Notable points for this project:

- App Router only (no Pages Router)
- Tailwind v4 with `@tailwindcss/postcss`
- `import "server-only"` is the standard guard for server-only modules (skip in standalone scripts — see §8.4)
- Vercel Cron is configured in `vercel.json` with a `crons` array; minimum tick is hourly on the free tier
- Use `route.ts` files for API routes (not `pages/api`)

---

## 12. The "Digital Footprint Eraser Guide 2026" PDF — assessment

The user uploaded a third-party PDF guide and asked how it compares to this build. Summary of that
analysis, so a future session doesn't have to redo it.

**What the PDF is:** a prompt pack, not an architecture. Four prompts pasted into Claude.ai chat +
the Chrome connector for submissions + a Claude scheduled task for weekly rechecks. No code, no
infrastructure, ~5 min setup.

**Where the PDF genuinely beats us:**
- It has a *working discovery mechanism* (Claude web search) — PrivacyGuard Phase 1 has none.
- It has a *working submission mechanism* (Chrome connector fills real opt-out forms) — ours is
  manual-assist only until Phase 3.
- Unbounded broker coverage: it finds whatever exists, rather than a hand-curated fixed list.
- Not region-locked in practice — a web search surfaces Indian exposure as readily as US.

**Where PrivacyGuard genuinely beats the PDF:**
- Durable, queryable state. A chat transcript cannot answer "how long has this been pending?" three
  months later. That was the user's *explicit* original requirement.
- KMS-encrypted PII at rest vs. PII sitting in chat history.
- Structured evidence + audit trail per request; survives context loss.

**Where the PDF oversells (do not copy this framing):** "Runs while you sleep", "Auto", "Claude does
the entire thing for you" — contradicted by its own troubleshooting table, which concedes CAPTCHAs,
email confirmation links, phone verification and ID checks all require the human. Our
"assisted opt-out" framing (§1) is the accurate one. Keep it.

**Resulting decisions:**
1. **Discovery-first.** Before seeding the Step 6 broker registry, run a real discovery pass against
   the user's actual name / phone / email and build the registry from what comes back. Prevents
   shipping a US-only registry to an India-based user.
2. **Phase 3 stays.** User explicitly chose to keep Playwright / Cloud Run / 2Captcha rather than
   relying solely on Claude + Chrome. Treat the Claude + Chrome route as a complementary near-term
   path that de-risks Phase 3, not as a replacement for it.
3. **Bulk-import path needed.** Step 7 should accept a pasted/structured discovery result and turn it
   into tracked `findings` in one action, so output from a Claude discovery run feeds the system of
   record cleanly.

Extracted text of the PDF (for reference, if needed again):
`/tmp/claude-0/-home-user-chatgpt-learning-platform/e3dc8d06-0e0e-5352-8fdc-c0ce13b6d24e/scratchpad/pdf.txt`
(scratchpad is ephemeral — re-extract from the upload if missing).
