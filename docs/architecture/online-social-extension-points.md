# Online and Social Extension Points

Skirmish Arena 2.6 remains a complete local 3v3 game. It does not advertise friends, parties, lobbies, presence, matchmaking, reconnect, or online play because none of those services exist yet. This note records the seams the next major project can extend without rewriting the 2.6 match and presentation layers.

## Identity boundary

Match rows may carry an optional `identity` or `profile` object with a `displayName`. Presentation resolves that value before falling back to the simulation `displayName`, local `YOU` label, or entity id. `PostgameScreen` exposes the same behavior as an injectable `playerLabel` callback. The future `PlayerProfile` model should own account id, display name, cosmetics, presence, and social metadata; local actor ids and renderer objects should remain simulation concerns.

No UI should infer that the local actor is the only human. `isLocal` means “controlled by this client,” not “the only real player.”

## Roster boundary

Keep these collections separate:

- Party roster: zero to the supported party size, with identity, ready state, leader/host role, lobby character selection, and invite state.
- Match roster: all authoritative participants in a match, with team, actor id, connection state, and live statistics.

Scoreboard and postgame components already render arbitrary display identities from supplied match rows. A future lobby should introduce its own party-roster view model instead of reusing or mutating the six-player match-stat rows.

## Match-state boundary

Maps are selected from data definitions and the active `TileMap` derives its dimensions, collision, spawns, minimap bounds, camera bounds, and presentation from that definition. The future network layer should serialize an authoritative match snapshot containing at least:

- match id, ruleset, selected map id, round index, phase, timer, team score, and deterministic sequence/tick;
- participant identity reference, actor id, team, connected/reconnecting status, pose, health, active loadout, and public combat state;
- event stream for shots, damage, eliminations, assists, round results, and match completion.

Do not serialize renderer objects, DOM nodes, canvas state, or menu state. Local prediction/interpolation may consume snapshots, but `MatchManager` remains the rules authority boundary until the online project deliberately moves that authority to a server.

## Service interfaces for the next project

Introduce implementations behind explicit interfaces rather than branching the current UI on imagined connectivity:

- `IdentityService`: local profile plus remote profile lookup.
- `FriendsService`: friend list, requests, block state, invites, and presence subscriptions.
- `PartyService`: membership, leader transfer, ready state, lobby character selections, and party invites.
- `MatchmakingService`: queue join/cancel/status and match assignment for Casual or Arena.
- `MatchTransport`: authenticated command submission, ordered snapshots/events, latency state, disconnect, reconnect, and terminal failure.

Each interface needs a truthful state machine (`idle`, `connecting`, `ready`, `failed`, and domain-specific states) and test doubles. Do not present “online,” “ready,” queue estimates, or remote players unless those states come from a working implementation.

## Reconnect and persistence rules

The eventual transport must distinguish voluntary Arena abandonment from recoverable connection loss. The current local forfeit transaction is idempotent and crash-recoverable; online Arena should settle any penalty only from an authoritative server outcome keyed by match id and transaction id. Reconnect should restore the same participant slot and last acknowledged authoritative sequence rather than create a second player.

Career/Arena progression remains profile persistence, while live match snapshots remain ephemeral match state. Never derive authoritative online rank rewards or penalties solely from a client-rendered postgame screen.

## 2.6 invariants to preserve

- Local Casual and Arena continue to work without an account or network.
- The existing six-player match roster and team-colored scoreboard remain reusable.
- Current map definitions, loadouts, weapon balance, Career, Arena thresholds, and launcher/update pipeline remain authoritative until a future migration explicitly versions them.
- No fake friends, party, lobby, presence, queue, host, or online controls are exposed in 2.6.
