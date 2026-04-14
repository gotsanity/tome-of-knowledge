import type { NodeType } from "@/lib/db/schema";

export interface CategoryMeta {
  type: NodeType;
  label: string;
  letter: string;
  blurb: string;
}

export const CATEGORY_META: Record<NodeType, CategoryMeta> = {
  npc: {
    type: "npc",
    label: "Figures",
    letter: "Fi",
    blurb: "The named hands that shape the world.",
  },
  location: {
    type: "location",
    label: "Places",
    letter: "Pl",
    blurb: "Cities, ruins, and crossroads worth naming.",
  },
  faction: {
    type: "faction",
    label: "Factions",
    letter: "Fa",
    blurb: "Cabals, orders, and powers vying for their cause.",
  },
  region: {
    type: "region",
    label: "Regions",
    letter: "R",
    blurb: "Broad territories and the climes that shape them.",
  },
  species: {
    type: "species",
    label: "Species",
    letter: "Sp",
    blurb: "Peoples and kin who walk the mortal road.",
  },
  religion: {
    type: "religion",
    label: "Faiths",
    letter: "Fai",
    blurb: "Creeds and the gods they name.",
  },
  system: {
    type: "system",
    label: "Systems",
    letter: "Sy",
    blurb: "Laws, magics, and the inner workings of the world.",
  },
  lore: {
    type: "lore",
    label: "Lore Fragments",
    letter: "L",
    blurb: "Half-remembered truths recovered from the margins.",
  },
  event: {
    type: "event",
    label: "Events",
    letter: "E",
    blurb: "Days that turned the ledger of history.",
  },
  plotline: {
    type: "plotline",
    label: "Plotlines",
    letter: "Plo",
    blurb: "Threads pulled taut through the chronicle.",
  },
  campaign: {
    type: "campaign",
    label: "Campaigns",
    letter: "Ca",
    blurb: "Chronicles of play, sessioned and sung.",
  },
  "campaign-frame": {
    type: "campaign-frame",
    label: "Campaign Frames",
    letter: "Cf",
    blurb: "Shapes of play — the premise before the first dice roll.",
  },
  handout: {
    type: "handout",
    label: "Handouts",
    letter: "H",
    blurb: "Letters, missives, and pages pressed into mortal hands.",
  },
  bestiary: {
    type: "bestiary",
    label: "Bestiary",
    letter: "B",
    blurb: "Creatures catalogued from fang to feather.",
  },
  pc: {
    type: "pc",
    label: "Player Characters",
    letter: "PC",
    blurb: "The protagonists whose choices write the next page.",
  },
};
