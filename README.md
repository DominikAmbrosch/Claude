# Claude

## Plugins

This repo vendors [Council of High Intelligence](https://github.com/0xNyk/council-of-high-intelligence) (MIT) under
[`council-of-high-intelligence/`](council-of-high-intelligence/), since `/plugin marketplace add` /
`/plugin install` are not available in this remote environment.

To install it into a Claude Code environment, run:

```bash
bash council-of-high-intelligence/install.sh
```

This copies the 18 council agents to `~/.claude/agents/` and the `/council` skill to
`~/.claude/skills/council/`. Restart Claude Code afterwards so the new skill and agents are picked up,
then use `/council [problem]` to convene the council. See `council-of-high-intelligence/README.md` for
full usage (flags, panel profiles, multi-provider routing, etc.).

This repo also vendors [Superpowers](https://github.com/obra/superpowers) (MIT) under
[`superpowers/`](superpowers/), for the same reason: `/plugin marketplace add` / `/plugin install` are
not available in this remote environment. Superpowers is a library of 14 skills covering brainstorming,
TDD, systematic debugging, code review, and other development workflow patterns.

To install it into a Claude Code environment, run:

```bash
bash superpowers/install.sh
```

This copies the 14 superpowers skills to `~/.claude/skills/`. Restart Claude Code afterwards so the
new skills are picked up. The `using-superpowers` skill governs when the others trigger; the upstream
project normally loads it automatically via a SessionStart hook (not wired up here since it relies on
`/plugin install`'s `${CLAUDE_PLUGIN_ROOT}` mechanism) — see `superpowers/README.md` and
`superpowers/hooks/hooks.json` to set that up by hand, or invoke skills directly via the `Skill` tool.