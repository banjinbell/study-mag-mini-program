# 学伴 (Study Buddy) — Product PRD

| | |
|---|---|
| **Status** | Draft v2 |
| **Doc type** | Product PRD (top-level) |
| **Owner** | Jane |
| **Contributors** | — (solo build; 1-3 friends as pilot listeners) |
| **Target release** | Beta v0.1 — Week 4 from kickoff |
| **Last updated** | 2026-05-26 |
| **Related docs** | `design-2026-05-26.md` (architecture, model selection, infrastructure) |

---

## 1. Problem / opportunity

People who actively try to learn from WeChat 公众号 and 小红书 read 5-20 fragments per day but retain almost none of it. The pain is **not** "there's no podcast app." The pain is:

- **Saved-not-learned**: content piles up in favorites lists that never get revisited.
- **Shallow exposure**: 2-minute phone-reading bursts don't form durable understanding.
- **Wrong channel**: the time most available for learning (commute, chores, walks) is ears-free, but the saved content is text-only.

**The opportunity**: convert text-bound fragments into a structured audio learning experience, delivered in the channel (WeChat) where the content already lives. Closing this loop replaces passive scrolling with active learning during dead time the user already has.

## 2. Background / strategic fit

NotebookLM (Google, 2024) proved that dual-host AI podcasts hit a real learning nerve — millions of users, organic growth. But it doesn't exist inside WeChat, doesn't speak 公众号 / 小红书 source patterns, and requires leaving the content ecosystem to use it. That's the gap.

The technical preconditions matured in 2025: cheap mainland LLMs (DeepSeek, Qwen), conversational TTS (MiniMax, CosyVoice 2), WeChat mini-program subscription messaging, and BackgroundAudioManager native audio. The product is buildable today, by one person, at ~¥100-200/month operating cost.

## 3. Target users & use cases

### Primary persona — "the reflective learner"

25-40 year-old knowledge worker (PM, engineer, designer, student, founder) who:

- Saves 5+ pieces of content per day on 公众号 + 小红书
- Has 30-60 minutes of daily commute, chores, or walking time
- Tries podcasts but can't find ones aligned with what they're curious about *today*
- Feels mild guilt about hoarding content without learning from it

### Critical user journeys (CUJs)

| CUJ | Trigger | What the user wants |
|---|---|---|
| **First capture** | Sees an interesting 小红书 post over lunch | Save the moment, trust it'll become listenable later |
| **Focused learning** | Has captured content but wants depth on specific concepts | Pick the 1-3 ideas they actually want explained, skip the rest |
| **Daily listen** | Puts in earphones on the subway home | Have today's saved content ready as a podcast |
| **Return** | Wants to relisten or revisit a topic | Find past podcasts quickly |

## 4. Assumptions

- Users will trust AI-generated learning content when it's clearly labeled and includes critical perspective.
- Two-host dialogue is more engaging than solo narration (per NotebookLM data and prior podcast research).
- 3-5 min generation latency is acceptable because users batch listening to their dead-time window, not real-time.
- **Users want control over what gets deepened.** A short concept-selection step before generation is worth the extra 30-60 s of interaction because it makes the resulting podcast feel personal, not generic.
- Beta-only distribution (≤89 users) is enough to validate behavior change; we don't need scale to learn.

## 5. Proposed solution

### Elevator pitch

Drop a screenshot or paste a snippet into a WeChat mini-program. Pick the concepts you actually want explained. 3-5 minutes later you get a two-host AI podcast that goes deep on what *you* care about, not what the AI guessed.

### Top 3 MVP value props

1. **Capture without leaving WeChat** — friction-zero; fits the reading habit you already have.
2. **You direct the depth** — pick the concepts that matter to you; the podcast explains *those* in detail, instead of skimming everything equally.
3. **Listenable in dead time** — two-host audio with native lock-screen controls.

### Conceptual model

```
Fragment (text / screenshot)
   ↓  in-WeChat capture
Concept extraction  (5-10 candidates surfaced from source)
   ↓  user picks 1-3 to deep-dive (or skips → AI defaults)
Enriched article  (selected concepts get the depth: background + related + critical perspective)
   ↓  AI pipeline (skill-driven)
Two-host podcast  (5-7 min MVP / 20 min target)
   ↓  lock-screen native audio
Active listening during dead time
```

## 6. Goals / measurable outcomes

1. **Habit**: pilot users average ≥ 5 listens/week for 4 weeks post-launch.
2. **Quality**: ≥ 70% per-podcast listen-completion rate.
3. **Focus validation**: ≥ 50% of generated podcasts use user-selected concepts (i.e. users actually engage with the focus picker rather than always skipping).
4. **Behavior change**: ≥ 1 pilot self-reports "I open 学伴 before 小红书" by end of month 1.

## 7. Functional requirements (MVP)

Bucketed by CUJ. Each requirement maps to a user need, not an implementation.

### CUJ-1 — First capture (in-WeChat)

| Pri | Requirement | Acceptance |
|---|---|---|
| **P0** | User pastes text into the mini-program | Pasted text > 10 chars creates a valid task |
| **P0** | User uploads an image from photo library | JPEG/PNG ≤ 10 MB accepted; oversize rejected with clear error |
| **P0** | User takes a photo from camera | Camera permission requested with clear copy |
| **P0** | System acknowledges submission in < 5s | UI shows "正在生成…" within 5 s of submit |
| **P0** | User grants subscription-message permission per submission | `requestSubscribeMessage` triggered each task |
| **P1** | Identity onboarding (student / PM / engineer / …) | All future tasks generate from selected identity lens |

### CUJ-2 — Receive & listen

| Pri | Requirement | Acceptance |
|---|---|---|
| **P0** | Subscription message arrives when podcast is ready | Notification fires within 1 min of task completion |
| **P0** | Tap notification → opens player for that task | Deep link to `pages/player?taskId=` works |
| **P0** | Player shows title, host labels, plays audio | First audio frame < 2 s after tap-play |
| **P0** | Lock-screen native controls (play / pause / skip / progress) | Works on iOS & Android lock screen |
| **P0** | "AI-generated, for learning reference only" disclosure | Persistent footer on player page |

### CUJ-3 — Focused learning

The core differentiator. After capture, the system proposes the concepts found in the source; the user picks the ones they want deep-dived. The podcast then spends most of its runtime on those concepts, treating the rest as light context. If the user skips selection, the AI picks defaults so the zero-touch path still works.

| Pri | Requirement | Acceptance |
|---|---|---|
| **P0** | After capture, system extracts 5-10 candidate concepts from the source within ~15 s | Concept list shown on a "focus picker" screen; load time p50 < 15 s |
| **P0** | User can tap to select 1-3 concepts to deep-dive (or tap "Skip — let AI pick") | Selection state visible; selection persisted to the task record |
| **P0** | Podcast generation weights selected concepts as primary, others as secondary | Selected concepts get ≥ 60% of dialogue runtime (measured by transcript word-count proportion) |
| **P0** | Player surfaces which concepts were chosen as the focus | "Focus: X, Y, Z" line visible on player screen |
| **P1** | User can revisit a past podcast and request a follow-up that deep-dives a *different* concept from the same source | New task created from the original capture + new concept selection |
| **P1** | "I want to know more about X" free-text override on the focus picker (when AI didn't surface the right concept) | Free-text concept appended to selection; treated as primary |

### CUJ-4 — Return & browse

| Pri | Requirement | Acceptance |
|---|---|---|
| **P0** | Home page lists past podcasts, newest first | List loads < 2 s; shows title + date + duration |
| **P0** | Tap list item → opens player | Same player as fresh notifications |
| **P2** | Search past podcasts by title / transcript keyword | Results < 2 s |
| **P2** | Topic clustering / weekly grouping | Grouped view available |

### Non-functional (only the ones that block adoption)

| Pri | Requirement | Acceptance |
|---|---|---|
| **P0** | End-to-end latency p50 < 5 min | Measured across 20 real submissions |
| **P0** | Task-lifecycle telemetry (created / processing / done / failed) | All states logged with timestamps |
| **P0** | Per-user data isolation | DB rule: `auth.openid == doc._openid` |

## 8. Not doing (out of scope for v1)

| Item | Why not |
|---|---|
| Social features (likes, comments, share-to-feed) | Not part of the learning loop; complicates the data model |
| Notes / second-brain export | Different product; users can screenshot if needed |
| Live news / time-sensitive content | 3-5 min latency disqualifies this use case |
| Original writing assistance | Different problem — this product is for consumption, not creation |
| Public mini-program listing | Individual entity can't register AI category; beta is acceptable |
| Payment / monetization | Personal tool first; revisit only if external demand appears |

## 9. Open questions

| # | Question | Owner | Blocking? |
|---|---|---|---|
| 1 | Is 5-7 min or 20 min the right podcast length for completion rate? | PM — test same content, same user | No, pick one for MVP |
| 2 | Is "critical perspective" polarizing for some users? | PM — A/B once ≥ 5 pilots | No |
| 3 | Is fire-and-forget cloud-function dispatch reliable in production? | Engineering — Day 1 verification | **Yes, blocks Week 1** |
| 4 | What % of users will engage with the focus picker vs. skip-to-default? If skip rate > 70%, the feature isn't earning its UI cost. | PM — track from launch | No, but informs v2 design |
| 5 | Does the user-directed deep-dive actually feel more useful than the AI-default? Same content, both modes, blind compare. | PM — week-2 test | No |
| 6 | Past 89 beta users, what's the distribution path? | PM | No, defer |

## 10. Timeline

| Phase | Window | Outcome |
|---|---|---|
| Day 1 | 1 day | Infrastructure verified; fire-and-forget proven |
| Week 1 | 7 days | Model bake-off complete (vision + text + TTS chosen) |
| Week 2 | 7 days | Cloud functions run end-to-end on real content |
| Week 3 | 7 days | WeChat frontend live; beta open to friends |
| Week 4+ | Ongoing | Daily self-use; iterate on prompts and model mix |

## Appendix

- **Design memo** — architecture, model selection rubric, provider abstraction, cost: `design-2026-05-26.md`
- **Day 1 verification checklist** — 6 items (AppID, env ID, MCP, fire-and-forget, vision API, TTS API)
- **Model selection scoring rubric** — vision / text / TTS evaluation criteria + scoring template
