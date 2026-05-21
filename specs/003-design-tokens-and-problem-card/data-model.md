# Data Model: Design Tokens + Canonical Problem Card

No database this slice. The "data" is (1) the token inventory and (2) the card prop contract.

## Token inventory (→ globals.css; source = CLAUDE.md §4)

| Group | Tokens | Themeable? | Source |
|---|---|---|---|
| surface | `canvas, card, raised` | yes (light/dark) | §4.1 |
| border | `default, strong` | yes | §4.1 |
| text | `primary, secondary, tertiary` | yes | §4.1 |
| accent | `bristle, validated` | yes | §4.1 |
| status | `warning, error, success` | yes | §4.1 |
| category (×8) | `<name>/bg`, `<name>/fg` for payments, devtools, ai-ml, auth-sso, deployment, analytics, mobile, email | yes | §4.1a |
| type scale (×10) | `display-xl, display-lg, h1, h2, h3, h4, body-lg, body-md, body-sm, mono-sm` (size + line-height + tracking) | no | §4.2 |
| font family (×3) | `sans` (Inter), `serif` (Source Serif 4), `mono` (JetBrains Mono) | no (runtime var) | §4.2 |
| spacing | base `--spacing: 4px` → octave scale | no | §4.3 |
| radius (×4) | `button 6, card 8, modal 12, pill 999` | no | §4.4 |

**Themeable color total**: 13 core + 16 category = **29 vars × 2 themes** (SC-001 diff target).

## Card prop contract (`ProblemCardFullProps`)

| Field | Type | Notes |
|---|---|---|
| `title` | `string` | Problem statement; serif `text-h3`. |
| `category` | `string` | Human label, e.g. "Payments". |
| `categoryColor` | `CategoryColor` | `payments \| devtools \| ai-ml \| auth-sso \| deployment \| analytics \| mobile \| email`; selects pill tint. Unknown → neutral fallback. |
| `momentum` | `number` | Signed %. Positive → up arrow (`accent/validated`); negative → down arrow (`status/error`); 0 → no arrow. Number text always `text/secondary`. |
| `sparkline` | `number[]` | 14-pt series; flat/single-value → mid-line. |
| `topQuote` | `string` | Italic serif inside a `surface/raised` box. |
| `quoteSource` | `SourceKey` | `gh \| hn \| so \| ph \| ap \| gp`; the avatar in the quote box. |
| `sources` | `SourceKey[]` | Footer badges, one per entry; "+N sources" derives from `sources.length`. |
| `lastSeenIso` | `string` | ISO-8601; rendered relative ("1h ago"). |

### Enums
- `CategoryColor` = 8 keys above (maps 1:1 to §4.1a token pairs).
- `SourceKey` = `gh`(GitHub) `hn`(Hacker News) `so`(Stack Overflow) `ph`(Product Hunt) `ap`(Apple App Store) `gp`(Google Play) — mirrors CLAUDE.md §1 ingestion sources.

### Validation / invariants (enforced by types + defensive rendering)
- `sparkline` expected length 14; component must not break on other lengths (edge case).
- `categoryColor` outside the enum can't occur via types, but the static map includes a neutral fallback for safety.
- No field is optional this slice (the showcase supplies complete fixtures).

## Sparkline generator contract
- `buildSparklinePath(values: number[], width: number, height: number): string`
  - Pure; maps index→x linearly, value→y normalized to [min,max] (flat series → horizontal mid-line, no divide-by-zero); returns an SVG `d` (`M … L …`).
