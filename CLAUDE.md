# Patan — Claude Instructions

## Project
Single-player Catan clone with 2–4 NPCs. Built in Next.js (App Router) + TypeScript + Tailwind CSS. All board rendering is SVG-based (not Canvas).

## Dev Server
```
npm run dev   →   http://localhost:3000
```

## File Structure
```
types/game.ts           — All TypeScript interfaces (single source of truth)
lib/constants.ts        — Named constants (HEX_SIZE, ratios, etc.)
lib/geometry.ts         — Pure geometry functions (axialToPixel, hexCornerPoints, edgeMidpoint, ...)
lib/board.ts            — Board generation: shuffle, createBoard()
lib/dice.ts             — rollDice() → { die1, die2, total }
components/Board.tsx    — SVG viewport; renders tiles → roads → ports
components/HexTile.tsx  — Single hex: image + polygon + number token + robber
components/Port.tsx     — Port indicator (circle + connector line outside border hex)
components/Road.tsx     — Edge/road segment: thick outer line + center stripe
components/PlayerCard.tsx — Player stat card (color bg, VP, road, army, piece counts)
components/DiceDisplay.tsx — Two SVG die faces with pips
app/page.tsx            — Root state + layout
app/layout.tsx          — Minimal root layout
public/images/          — Resource tile images (wood.png, brick.png, sheep.png, wheat.png, stone.png, desert.png)
```

## Naming Conventions
- Resource is **"stone"** not "ore" — matches planning document
- `ResourceType`: `"wood" | "brick" | "sheep" | "wheat" | "stone" | "desert"`
- `PlayableResource`: `Exclude<ResourceType, "desert">`
- `PortType`: `ResourceType | "generic"`

## Hex Grid
- **Pointy-top** hexagons, **axial (q, r)** coordinates
- 19 tiles: all (q, r) satisfying `|q| ≤ 2`, `|r| ≤ 2`, `|q+r| ≤ 2`
- Pixel conversion: `x = HEX_SIZE * √3 * (q + r/2)`, `y = HEX_SIZE * 1.5 * r`
- `HEX_SIZE = 70` SVG units (circumradius, center to corner)
- Corner `i` at angle `(60*i + 30)°` (pointy-top)
- **Edge directions** (SVG y-down): `0=SE, 1=SW, 2=W, 3=NW, 4=NE, 5=E`
  - Edge `i` connects corner `i` and corner `(i+1)%6`

## Resource Counts (19 tiles)
| Resource | Count |
|----------|-------|
| Wood     | 4     |
| Sheep    | 4     |
| Wheat    | 4     |
| Brick    | 3     |
| Stone    | 3     |
| Desert   | 1     |

## Number Tokens
`[2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]` — 18 tokens for 18 non-desert tiles. Board generation rejects layouts where any 6 or 8 is adjacent to another 6 or 8.

## Ports (9 total)
- 4 generic (3:1) + 1 each of wood/brick/sheep/wheat/stone (2:1)
- Port positions are fixed (specific border hex + edge); port *types* are shuffled each game
- Port indicator renders outward from the edge midpoint using `PORT_OFFSET_RATIO`

## Game Rules (from planning doc — not yet implemented)
- Victory: 10 points
- Piece limits per player: 15 roads, 5 villages, 4 towns
- Setup phase: `board.IsInSetup = true`; free placement without resource cost
- Distance rule: no two settlements on adjacent `VillageLocation`s
- Robber triggers on a 7 roll; players with 8+ cards must discard half
- Dev card types: VictoryPoint, Knight, YearOfPlenty, Monopoly
- Largest Army: player with most Knight cards played (min 3)
- Longest Road: player with longest continuous road (min 5)

## What's Implemented
- [x] Random board generation (tiles + ports)
- [x] SVG hex grid rendering with resource images
- [x] Port indicators
- [x] Road/edge rendering (all black/unowned; wire up `ownedRoads` prop on `<Board>` when ready)
- [x] Player card sidebar (4 players, human always first)
- [x] Dice rolling + display (`rollDice()` in `lib/dice.ts`)

## What's Not Yet Implemented
- [ ] Village/road location geometry (54 vertices, 72 edges) — stubs return `[]`
- [ ] Setup phase placement flow
- [ ] Turn structure (`PlayerTurn`, `EndTurn`, active player rotation)
- [ ] Resource distribution on dice roll (`AssignCardsToAllPlayers`)
- [ ] Robber logic
- [ ] Trade
- [ ] Dev cards
- [ ] Victory detection

## Patterns to Follow
- All shared geometry goes in `lib/geometry.ts`, all magic numbers go in `lib/constants.ts`
- Use `Record<ResourceType, string>` (not `Record<string, string>`) for resource maps — enforces exhaustiveness
- SVG render order in `Board.tsx`: ocean → tiles → roads → ports (roads sit above tiles but below port bubbles)
- Road edge deduplication uses rounded-coordinate canonical string keys to handle floating-point
- `ownedRoads` on `<Board>` is a `Map<roadLocationId, playerColor>` — currently unused, wired for future use

## Preferences
- Favor readability over cleverness
- When in doubt about game rules, ask before implementing
- Suggest tests when adding new game logic
- Prefer small, focused PRs over large sweeping changes
