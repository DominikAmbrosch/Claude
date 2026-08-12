# Skill Benchmark: grill-me

**Model**: claude-sonnet-5
**Date**: 2026-08-12T21:09:56Z
**Evals**: 0, 1, 2 (1 runs each per configuration)

## Summary

| Metric | With Skill | Without Skill | Delta |
|--------|------------|---------------|-------|
| Pass Rate | 100% ± 0% | 33% ± 29% | +0.67 |
| Time | 65.5s ± 27.0s | 44.4s ± 24.1s | +21.1s |
| Tokens | 44753 ± 15772 | 40071 ± 11790 | +4682 |

## Notes

- Consistent, discriminating signal across all 3 evals: without the skill, Claude defaults to a grouped listicle of many questions with no stated recommendation; with the skill, it asks exactly one question and always states a recommended answer. This is the skill's core value proposition and it held up in every eval, not just on average.
- Eval 2's 'repo was actually explored' assertion does not discriminate — the baseline (no-skill) agent also chose to explore investor-dashboard unprompted, since it was simply given repo access and general judgment. It's a real and desirable behavior, just not one this skill is responsible for; a future iteration should either drop this assertion or rephrase it to test something the skill specifically adds (e.g. 'the one question asked is the single most decision-relevant one, not just any exploration-informed question').
- With-skill runs took longer and used more tokens than baseline in every eval (mean +21.1s, +4682 tokens) — largely driven by eval 2's repo exploration in both configs, which was the single biggest cost driver overall (both with_skill and without_skill spent 2-3x longer on eval 2 than on evals 0/1). This is expected overhead for a 'look things up yourself instead of asking' skill design, not a red flag, but worth watching as the skill scales to bigger repos.
- n=1 per configuration — no real variance data. The pass-rate delta (100% vs 33%) is a strong and consistent single-sample signal, but a follow-up iteration should run each eval 2-3x per configuration before treating the timing/token deltas as stable.