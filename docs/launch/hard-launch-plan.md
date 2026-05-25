# Epic 4 Hard Launch Plan

## Objective

Launch ChinaCode CLI publicly as an open-source coding agent for Chinese LLMs and reach 500+ GitHub stars in the first week.

Primary launch promise:

> ChinaCode CLI is an open-source coding agent for developers who want a Claude Code-style terminal workflow with Qwen, DeepSeek, MiMo, and other Chinese LLM providers.

## Audience

Primary:

- Developers already using terminal coding agents.
- Engineers looking for lower-cost or regionally available LLM providers.
- Open-source AI tool builders.
- Chinese developer communities evaluating Qwen, DeepSeek, MiMo, and local model workflows.

Secondary:

- AI newsletter editors.
- DevTools founders and maintainers.
- Teams blocked by provider availability, cost, or data residency constraints.

## Launch Assets

Required before hard launch:

- GitHub repo: `[GITHUB_REPO_URL]`
- npm package: `[NPM_PACKAGE_URL]`
- Docs site or docs entry point: `[DOCS_URL]`
- Demo GIF: `[DEMO_GIF_URL]`
- Demo video: `[DEMO_VIDEO_URL]`
- Announcement blog post: `[BLOG_ANNOUNCEMENT_URL]`
- Community channel: `[DISCORD_OR_TELEGRAM_URL]`
- Benchmarks or comparison notes: `[BENCHMARKS_URL]`
- Press kit: `[PRESS_KIT_URL]`

Minimum repo readiness:

- Installation works with `npm install -g chinacode`.
- Quick start produces a successful agent run in under 5 minutes.
- README above the fold explains supported providers, setup, examples, and limitations.
- Issue templates exist for bug reports, provider requests, and plugin requests.
- License, contribution guide, and security contact are present.
- Demo GIF is visible near the top of the repo and announcement pages.

## Positioning

Headline options:

- Open-source coding agent for Qwen, DeepSeek, and Chinese LLM providers.
- A Claude Code-style terminal agent for Chinese LLMs.
- Bring Chinese LLMs into your coding workflow from the terminal.

Differentiators to emphasize:

- Open-source and self-hostable workflow.
- Provider choice across Qwen, DeepSeek, MiMo, and OpenAI-compatible APIs.
- Terminal-native coding loop with file context, tools, skills, subagents, and MCP.
- Practical for developers who care about cost, availability, and provider diversity.

Avoid claiming:

- Drop-in parity with Claude Code unless verified by benchmarks.
- Enterprise security guarantees without published policy.
- Final URLs before they are live.
- Performance numbers not backed by `[BENCHMARKS_URL]`.

## Timeline

### T-7 to T-5 Days

- Freeze launch scope and remove placeholder copy from public surfaces.
- Verify install, quick start, provider setup, and demo path on clean machines.
- Prepare posts from [social-posts.md](social-posts.md).
- Build a short list of 30 launch supporters who can test and upvote organically.
- Send embargoed newsletter pitches from [newsletter-pitches.md](newsletter-pitches.md).
- Prepare tracking sheet using [metrics-dashboard.md](metrics-dashboard.md).

### T-4 to T-2 Days

- Publish or schedule announcement blog post draft.
- Validate demo GIF/video loads quickly on mobile and desktop.
- Confirm README, docs, npm package, and GitHub release point to each other.
- Open community channel and pin quick start, FAQ, and contribution links.
- Prepare first 10 GitHub issues labeled `good first issue`, `provider`, and `docs`.
- Create saved searches for launch mentions and support questions.

### T-1 Day

- Run full launch rehearsal:
  - Fresh clone.
  - Fresh npm install.
  - First provider setup.
  - First task execution.
  - Docs navigation.
  - Issue creation flow.
- Confirm owners and backup owners for each launch channel.
- Finalize launch order and time windows.
- Prepare response snippets for common objections.

### Launch Day

Recommended sequence:

1. Publish GitHub release and npm package.
2. Publish blog announcement at `[BLOG_ANNOUNCEMENT_URL]`.
3. Post Twitter/X thread with demo GIF.
4. Post Show HN.
5. Post Reddit threads after HN has initial comments.
6. Post V2EX, Zhihu, and Juejin localized versions.
7. Send newsletter follow-ups with live links.
8. Monitor comments every 15 minutes for first 4 hours.

Launch-day operating rules:

- Reply to every substantive technical comment within 60 minutes.
- Move bugs into GitHub issues and link back to the discussion.
- Avoid arguing about provider politics; redirect to engineering tradeoffs and use cases.
- Keep all claims tied to docs, examples, or benchmark links.
- Ask satisfied users to star only after they have tried the tool or found it useful.

### T+1 to T+7 Days

- Ship one visible fix or docs improvement daily.
- Post progress updates with concrete metrics and changelog items.
- Convert repeated questions into docs updates.
- Follow up with newsletters that did not respond pre-launch.
- Publish "what we learned from launch week" if traction is strong.

## Channel Strategy

Priority channels:

- Hacker News: highest chance of concentrated GitHub traffic.
- Reddit: targeted technical discussion and long-tail discovery.
- V2EX, Zhihu, Juejin: Chinese developer reach and provider relevance.
- Twitter/X: fast amplification, founder/devtools network, demo visibility.
- Newsletters: durable traffic and credibility outside social feeds.

Channel sequencing rationale:

- Twitter/X first creates a linkable source and gives supporters a simple share target.
- Hacker News second gives the project a single technical discussion center.
- Reddit after HN prevents early moderation friction from duplicate-looking posts.
- Chinese platforms should launch the same day with localized positioning, not translated leftovers.
- Newsletter outreach should use live links and early traction numbers after the first 6-12 hours.

## 500+ Star Model

Target first-week contribution:

| Source | Star Target | Notes |
|---|---:|---|
| Hacker News | 180 | Requires top-half front page for several hours. |
| Reddit | 90 | Split across r/programming, r/LocalLLaMA, r/commandline, r/opensource. |
| V2EX/Zhihu/Juejin | 90 | Strong fit due to Chinese LLM provider angle. |
| Twitter/X | 70 | Depends on demo quality and supporter reposts. |
| Newsletters | 50 | Expected after day 2 if accepted. |
| Direct/community/supporters | 20 | Beta users, friends, maintainers, Discord/Telegram. |
| Total | 500 | Track daily and reallocate effort if any channel underperforms. |

Daily target:

| Day | Cumulative Stars | Operating Focus |
|---|---:|---|
| Day 0 | 150 | HN, Twitter/X, launch support, fast replies. |
| Day 1 | 250 | Reddit, Chinese platforms, first bug-fix release. |
| Day 2 | 325 | Newsletter follow-ups, docs fixes, contributor onboarding. |
| Day 3 | 385 | Use-case posts and benchmark discussion. |
| Day 4 | 430 | Community asks, issue triage, small release. |
| Day 5 | 470 | Second-wave social proof post. |
| Day 6 | 500 | Final push, launch-week recap, newsletter reminders. |

## Response Playbook

Common objections:

- "Why not just use Claude Code?"
  - ChinaCode CLI is for developers who want a similar terminal-native agent loop with Chinese LLM providers, provider choice, and open-source extensibility.
- "Is this only for China?"
  - No. The provider focus is useful globally for cost, availability, model diversity, and OpenAI-compatible workflows.
- "Is it production ready?"
  - Position honestly according to release state. Say what is stable, what is experimental, and where issues should be filed.
- "Do benchmarks prove it is better?"
  - Do not claim superiority. Point to `[BENCHMARKS_URL]` and invite reproducible benchmark contributions.

## Risks

| Risk | Signal | Mitigation |
|---|---|---|
| Install failure | Repeated npm/setup comments | Pin quick fix, release patch, update docs immediately. |
| Provider setup confusion | Questions about API keys/base URLs | Add provider-specific setup examples and FAQ. |
| Political discussion derails launch | Thread shifts away from engineering | Keep replies technical and avoid escalation. |
| HN post gets little traction | Below 20 points after 90 minutes | Push Twitter/X demo, Reddit, Chinese platforms, and newsletter outreach earlier. |
| Demo asset fails | Broken GIF/video links | Keep backup demo at `[DEMO_VIDEO_URL]` and local upload-ready files. |
