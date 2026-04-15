// Shared client-side state coordinator for the /contents accordion.
//
// The /contents page accordion (`ContentsAccordion`) and the sidebar TOC
// (`SideNavSubTree`) need to stay in sync: opening a section in one must
// reflect in the other. The URL hash is the source of truth so the state
// is shareable, deep-linkable, and survives back/forward navigation.
//
// `history.replaceState` does NOT fire the native `hashchange` event, so
// we additionally dispatch a custom `tome:section-change` event that both
// components listen for. Native `hashchange` (back/forward, URL bar edit)
// is also handled by listeners.

export const SECTION_HASH_EVENT = "tome:section-change";

export type SectionHashDetail = { type: string };

export function readSectionFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  return hash.length > 0 ? hash : null;
}

export function setSectionHash(type: string): void {
  if (typeof window === "undefined") return;
  if (window.location.hash !== `#${type}`) {
    window.history.replaceState(null, "", `#${type}`);
  }
  window.dispatchEvent(
    new CustomEvent<SectionHashDetail>(SECTION_HASH_EVENT, {
      detail: { type },
    }),
  );
}
