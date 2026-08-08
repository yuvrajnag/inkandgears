/**
 * Routes.
 *
 * Entity, collection and flow ids are created by the writer at runtime and
 * live only in their browser, so there is no set of paths a build could ever
 * enumerate. They travel as query params, which keeps every page statically
 * exportable — the whole app ships as flat files.
 */
export const routes = {
  home: "/",
  script: "/script",

  board: "/board",
  newEntity: (boardId?: string) =>
    boardId ? `/board/new?board=${encodeURIComponent(boardId)}` : "/board/new",
  collection: (id: string) => `/board/collection?id=${encodeURIComponent(id)}`,
  entity: (id: string) => `/board/entity?id=${encodeURIComponent(id)}`,

  flow: "/flow",
  newFlow: "/flow/new",
  flowView: (id: string) => `/flow/view?id=${encodeURIComponent(id)}`,
} as const;
