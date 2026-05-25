# Launch Metrics Dashboard

## North Star

500+ GitHub stars within 7 days of hard launch.

## First-Week Targets

| Metric | Day 0 | Day 1 | Day 3 | Day 7 |
|---|---:|---:|---:|---:|
| GitHub stars | 150 | 250 | 385 | 500 |
| GitHub unique visitors | 1,500 | 2,500 | 4,000 | 6,000 |
| GitHub clones | 150 | 300 | 550 | 900 |
| npm downloads | 150 | 350 | 800 | 1,500 |
| GitHub issues opened | 8 | 15 | 30 | 50 |
| External PRs | 1 | 2 | 5 | 10 |
| Community joins | 50 | 100 | 175 | 250 |
| Newsletter mentions | 0 | 1 | 2 | 3 |

## Source Attribution

Use UTM links where platforms allow them. For platforms that strip tracking, use GitHub traffic referrers and time-window attribution.

Placeholder links:

- Hacker News: `[GITHUB_REPO_URL]?utm_source=hackernews&utm_medium=community&utm_campaign=hard_launch`
- Reddit: `[GITHUB_REPO_URL]?utm_source=reddit&utm_medium=community&utm_campaign=hard_launch`
- V2EX: `[GITHUB_REPO_URL]?utm_source=v2ex&utm_medium=community&utm_campaign=hard_launch`
- Zhihu: `[GITHUB_REPO_URL]?utm_source=zhihu&utm_medium=community&utm_campaign=hard_launch`
- Juejin: `[GITHUB_REPO_URL]?utm_source=juejin&utm_medium=community&utm_campaign=hard_launch`
- Twitter/X: `[GITHUB_REPO_URL]?utm_source=twitter&utm_medium=social&utm_campaign=hard_launch`
- Newsletters: `[GITHUB_REPO_URL]?utm_source=[NEWSLETTER_NAME]&utm_medium=newsletter&utm_campaign=hard_launch`

## Tracking Cadence

Launch day:

- Every 30 minutes for first 4 hours.
- Hourly from hour 4 to hour 12.
- End-of-day summary at hour 24.

Days 1-7:

- Morning metrics snapshot.
- Midday channel response review.
- Evening changelog and star target review.

## Metrics To Capture

GitHub:

- Stars.
- Forks.
- Unique visitors.
- Traffic referrers.
- Clones.
- Issues opened.
- PRs opened.
- Watchers.
- Top viewed files.

npm:

- Daily downloads.
- Package page views if available.
- Install failure reports.

Community:

- Discord/Telegram joins.
- Support questions.
- Repeated friction points.
- Feature requests by provider.

Social:

- HN rank, points, comments.
- Reddit upvotes, comments, removals, moderator notes.
- V2EX replies and favorites.
- Zhihu views, likes, saves, comments.
- Juejin views, likes, comments.
- Twitter/X impressions, reposts, profile clicks, link clicks.

Quality:

- Install success reports.
- Time to first successful run.
- Setup confusion by provider.
- Bugs per 100 installs.
- Docs pages updated due to launch feedback.

## Response Thresholds

| Signal | Threshold | Action |
|---|---:|---|
| Stars below target | 25% under daily goal | Shift effort to highest-performing channel and publish a concrete update. |
| Install failures | 3 independent reports | Pause promotion for 30 minutes, reproduce, patch, and pin workaround. |
| Provider setup confusion | 5 similar questions | Add docs FAQ and reply with canonical link. |
| HN thread negative spiral | 5+ comments on same objection | Write one calm technical clarification and stop repeating. |
| Reddit moderator issue | 1 removal/warning | Do not repost; ask what should change and update checklist. |
| Newsletter interest | Any reply | Respond within 2 hours with links, quote, demo, metrics. |
| External PR opened | Any PR | Review or acknowledge within 12 hours. |

## Daily Report Template

```text
Launch Day [N] Report - [DATE]

Stars: [STAR_COUNT] / [TARGET]
npm downloads: [NPM_DOWNLOADS]
GitHub visitors: [GITHUB_VISITORS]
Issues opened: [ISSUES_OPENED]
PRs opened: [PRS_OPENED]
Community joins: [COMMUNITY_JOINS]

Top sources:
1. [SOURCE] - [STARS_OR_VISITS]
2. [SOURCE] - [STARS_OR_VISITS]
3. [SOURCE] - [STARS_OR_VISITS]

What shipped today:
- [CHANGE_1]
- [CHANGE_2]

Repeated questions:
- [QUESTION_1] -> [DOC_OR_ISSUE_LINK]
- [QUESTION_2] -> [DOC_OR_ISSUE_LINK]

Tomorrow's focus:
- [FOCUS_1]
- [FOCUS_2]
```
