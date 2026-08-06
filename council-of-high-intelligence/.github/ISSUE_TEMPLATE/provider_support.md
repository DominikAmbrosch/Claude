---
name: Provider / host support
about: Request or propose support for a new LLM provider or host coordinator
title: "provider: "
labels: enhancement, provider
---

## Provider / host

<!-- Name, link, and how it's invoked (CLI binary, OpenAI-compatible endpoint, extension system, ...) -->

## Which integration path

- [ ] New **deliberation seat** provider (members routed to it) — usually fits the existing `openai_compatible_api` archetype or a new exec archetype in `SKILL.md` STEP 2
- [ ] New **host coordinator** (a new `SKILL.<host>.md` + `install.sh --<host>` path, like Codex/Gemini)

## Detection

<!-- How can scripts/detect-providers.sh detect it? Binary name, env var, endpoint? -->

## Notes

<!-- Auth model, model IDs, timeouts, anything unusual. New host coordinators must carry full protocol parity (see the checklist's SKILL parity checks) — additive, never replacing an existing host. -->
