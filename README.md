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

This repo also vendors [obsidian-skills](https://github.com/kepano/obsidian-skills) (MIT) under
[`obsidian-skills/`](obsidian-skills/), for the same reason. To install it into a Claude Code
environment, run:

```bash
bash obsidian-skills/install.sh
```

This copies the five obsidian skills (`obsidian-markdown`, `obsidian-bases`, `json-canvas`,
`obsidian-cli`, `defuddle`) to `~/.claude/skills/`. Restart Claude Code afterwards so the new skills
are picked up. See `obsidian-skills/README.md` for details on each skill.