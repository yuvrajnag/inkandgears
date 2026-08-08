# INK & GEARS

A narrative creation platform — writing, worldbuilding, and story-flow planning
in one connected system.

The idea the whole thing is built around: **write once, structure
automatically.** Reference a place or a character while you're writing and the
link is recorded for you. You never maintain the same fact in two places.

## The four modules

| Tab        | Module        | What it is                                                        |
| ---------- | ------------- | ----------------------------------------------------------------- |
| **Script** | Draft Canvas  | Volumes, chapters, scenes, and the writing itself                  |
| **Board**  | World Matrix  | Characters, locations, factions, items — with reference imagery    |
| **Flow**   | Thread Map    | Node-based planning for structure, timelines, and relationships    |
| **Home**   | Cosmos + Pulse| Project state, version history, and story analysis                 |

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

The seed project ships with generated SVG plates instead of photographs — drop
your own images into any entity and they're replaced.

## Layout

```
src/
├── app/                  routes: /, /script, /board, /flow, /api/commands
├── components/
│   ├── chrome/           top bar, tabs, help, project menu
│   ├── script/           Draft Canvas — editor, toolbar, slash commands
│   ├── board/            World Matrix — collections, entity sheets
│   ├── flow/             Thread Map — canvas, templates
│   ├── home/             Cosmos + Audience Pulse
│   └── commands/         the assistant
└── lib/                  store, types, seed, AI context, analysis, export
```
