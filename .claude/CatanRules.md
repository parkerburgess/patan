
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
