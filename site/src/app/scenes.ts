/** Scene registry (VISUAL_DESIGN 3.1). `turn` (S00) is static HTML in index.html so the LCP headline paints before any JS. */
export interface SceneDef { id: string; code: string; nav: string | null; track: string; landing: number; title: string }
export const SCENES: SceneDef[] = [
  { id: "turn", code: "S00", nav: "FUTURES", track: "150vh", landing: 0, title: "Every decision creates a different future." },
  { id: "another", code: "S01", nav: "ANOTHER DECISION", track: "250vh", landing: 0.1, title: "Same chance. Another decision. Different futures." },
  { id: "real", code: "S02", nav: "WHAT IS REAL", track: "300vh", landing: 0.1, title: "What is real, what is invented." },
  { id: "enough", code: "S03a", nav: "ENOUGH", track: "250vh", landing: 0.05, title: "More futures do not make the future less uncertain." },
  { id: "learning", code: "S03b", nav: "LEARNING", track: "300vh", landing: 0.05, title: "Evidence narrows a belief." },
  { id: "unroll", code: "S04", nav: "UNROLL", track: "300vh", landing: 0.05, title: "Unroll the turn, and time falls." },
  { id: "line", code: "S05", nav: "THE LINE", track: "300vh", landing: 0.05, title: "Where you draw the line depends on what a mistake costs." },
  { id: "trade", code: "S06", nav: "TRADE-OFFS", track: "300vh", landing: 0.05, title: "Some trade-offs are efficient. Most inputs are not what matters." },
  { id: "unchosen", code: "S07", nav: "UNCHOSEN", track: "300vh", landing: 0.05, title: "The future you didn't choose cannot be observed." },
  { id: "lab", code: "LAB", nav: "THE LAB", track: "auto", landing: 0, title: "Ten instruments, in your browser." },
  { id: "closing", code: "S08", nav: null, track: "200vh", landing: 0.3, title: "Every decision creates a different future." },
];
export const NAV_ITEMS = SCENES.filter((s) => s.nav).map((s) => ({ id: s.id, label: s.nav! }));
export const navActive = (scene: string | null) => (scene === "closing" ? "lab" : scene ?? "turn");
export const LINKS = {
  site: "https://mrrishit909.github.io/decision-universe/",
  source: "https://github.com/mrrishit909/decision-universe",
} as const;
export const sceneIndex = (id: string) => SCENES.findIndex((s) => s.id === id);
