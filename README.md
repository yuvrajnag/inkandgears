# INK & GEARS

A narrative creation platform — writing, worldbuilding, and story-flow planning
in one connected system.

The idea the whole thing is built around: **write once, structure
automatically.** Reference a place or a character while you're writing and the
link is recorded for you. You never maintain the same fact in two places.

## The modules

| Tab        | Module        | What it is                                                        |
| ---------- | ------------- | ----------------------------------------------------------------- |
| **Script** | Draft Canvas  | Volumes, chapters, scenes, and the writing itself                  |
| **Board**  | World Matrix  | Characters, locations, factions, items — with reference imagery    |
| **Flow**   | Thread Map    | Node-based planning for structure, timelines, and relationships    |
| **Home**   | Cosmos + Pulse| Project state, version history, and story analysis                 |
| **Game**   | Game Narrative Studio | Phase 2 — quests, branching dialogue, state, and a playable runtime |

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

```bash
npm run build && npm start   # production
npm run lint
```

## Writing with entities

Type `/` in the editor to pull something out of the World Matrix:

| Command | Inserts   | | Command | Inserts  |
| ------- | --------- |-| ------- | -------- |
| `/c`    | Character | | `/e`    | Event    |
| `/p`    | Place     | | `/cr`   | Creature |
| `/f`    | Faction   | | `/v`    | Vehicle  |
| `/i`    | Item      | | `/s`    | Scene    |

`/p aeth` filters straight to matching places. If nothing matches, the menu
offers to create it — the new entity lands in the World Matrix and the
reference goes into your prose in one step.

The reference is stored as structured data inside the document, so the
entity's page fills in its own **Appeared in** list, first/last appearance, and
chapter spread. None of that is hand-maintained, and none of it is stored twice.

## Commands (the assistant)

`Ctrl/⌘ K` opens Commands. It assembles a narrow context — the current scene,
its chapter, and only the entities that scene actually references — rather than
shipping the whole project on every request.

Nothing it produces reaches your manuscript on its own. Output is staged as a
preview with **Insert below** / **Try again**; there is no code path where the
assistant edits a scene without you pressing a button.

With no provider configured it still runs, falling back to the analysis it can
do deterministically: measuring the scene, checking it against the World
Matrix, and asking the questions an editor would. To enable generation, set
either key on the server:

```bash
GEMINI_API_KEY=...          # or
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini    # optional
```

## Game Narrative Studio (Phase 2)

Turns the platform from "write a story" into "make a story playable". Six views
under the **Game** tab:

- **Dashboard** — counts, coverage, and whatever the debugger is unhappy about
- **Quest Forge** — quests, objectives, prerequisites, rewards, unlock chains
- **Dialogue Forge** — branching nodes with conditions, effects, and where each
  choice leads
- **State Matrix** — every variable, and every place it is read or written
- **Play** — the narrative runtime
- **Debug** — static analysis over the whole graph

### Play

Press Play and the flow executes for real: conditions gate choices, effects
mutate state, quests transition, world events fire when their conditions come
true. The debug panel beside it shows the current node, which conditions passed
and failed, what effects just ran, and every live variable — editable mid-run so
you can jump to a branch without replaying to it.

The session is held in component state and never written back, so **playing can
never modify your source narrative.** Same starting state plus the same choices
always produces the same run.

### Debug

Runs continuously while you edit — no build step. It finds unreachable nodes,
dead-end choices, conditions reading variables that don't exist, references to
deleted characters or quests, loops with no way out, endings that were never
marked as endings, duplicate ids, and content nothing points at.

### Export

`Export JSON` produces the narrative package — `quests.json`, `dialogue.json`,
`variables.json`, `events.json`, `characters.json`, `locations.json` and a
`localization.json` of every line keyed by id. `Lines CSV` is the same dialogue
flattened for translation vendors. Every object carries a stable id
(`QUEST_001`, `DLG_047`, `VAR_021`) that never changes when you rename things,
which is what makes re-import into an engine safe.

## Your work

Everything lives in this browser's local storage and saves as you type. The
caret beside undo in the top-left exports a full JSON backup or a Markdown
manuscript, and imports a backup back. Restore points are taken automatically
while you write; open them from the history icon in the Script toolbar.

## Modes

- **Simple mode** (gear icon, Tools group) strips the toolbar back to bold,
  italic, underline, lists, and a word count. No metadata, no narrative
  machinery.
- **Focus mode** dims everything except the block you're writing in.

## Stack

Next.js · TypeScript · React · Tailwind CSS · Tiptap/ProseMirror · React Flow ·
Zustand

Seed imagery is cropped from the design mockups at screenshot resolution —
replace `public/seed/*.jpg` with the masters before anything ships. The
wordmark in `public/logo.svg` is a hand trace of the real mark; drop the export
over it and nothing else changes.

## Layout

```
src/
├── app/                  routes: /, /script, /board, /flow, /game, /api/commands
├── components/
│   ├── chrome/           top bar, tabs, help, project menu
│   ├── script/           Draft Canvas — editor, toolbar, slash commands
│   ├── board/            World Matrix — collections, entity sheets
│   ├── flow/             Thread Map — canvas, templates
│   ├── home/             Cosmos + Audience Pulse
│   ├── game/             Game Narrative Studio — forges, simulator, debugger
│   └── commands/         the assistant
└── lib/
    ├── game/             narrative types, logic, runtime, validation, export
    └── …                 store, types, seed, AI context, analysis, export
```
