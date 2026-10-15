import { useEffect, useMemo, useState } from "react";
import { Track } from "../scroll/Track";
import { useArtifact } from "../data/useArtifact";
import { SceneErrors } from "../components/StateUI";
import { Radio } from "../components/Radio";
import { META, MODULE_SPECS, fmt } from "../app/data";
import { MODULE_IDS, SEEDED, type Artifacts, type LabResult, type ModuleId } from "../model/lab";
import { computeModule } from "../state/compute";
import { solveLp } from "../state/highs";
import { lpText, type LpProblem } from "../model/lp";
import { useActiveScene } from "../scroll/hooks";
import { turnView, visitor, SEED } from "../app/turnView";
import { Tag, UnitLine, Foot, useTurn, setTurn } from "./common";
import { Inspector } from "./Inspector";
import type { SceneDef } from "../app/scenes";

 
const DEC = ["build_now", "phased", "delay_one_year"] as const;
const NAMES: Record<string, string> = { build_now: "BUILD NOW", phased: "PHASED", delay_one_year: "DELAY ONE YEAR" };

/** THE LAB: ten instruments, each runnable in the browser against its published vectors. */
export function Lab({ def }: { def: SceneDef }) {
  const v = useTurn();
  const active = useActiveScene();
  const [meta] = useArtifact(META);
  const states = MODULE_SPECS.map((s) => useArtifact(s, true)); // eslint-disable-line react-hooks/rules-of-hooks
  const [results, setResults] = useState<Partial<Record<ModuleId, LabResult | "running" | string>>>({});
  const [seedText, setSeedText] = useState(String(v.seed));
  const [lev, setLev] = useState({ inv: 100, rev: 1, delay: 0 });
  const me = meta.status === "ready" ? meta.data : null;
  useEffect(() => { if (active === def.id) setTurn({ mode: "turn", cam: "G5", alpha: 1, unroll: 0 }); }, [active, def.id]);
  const arts = useMemo(() => {
    if (!states.every(([s]) => s.status === "ready")) return null;
    return Object.fromEntries(MODULE_IDS.map((id, i) => [id, (states[i]![0] as any).data])) as Artifacts;
  }, [states.map(([s]) => s.status).join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const seed = Number(seedText);
  const validSeed = Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32;
  const run = async (id: ModuleId) => {
    if (!arts) return;
    setResults((r) => ({ ...r, [id]: "running" }));
    try {
      const res = await computeModule(id, arts, validSeed ? seed : SEED);
      if (id === "m07") {
        const m = arts.m07, p = m.problem as LpProblem;
        let k = 0;
        try {
          for (const pt of m.front) { const s = await solveLp(lpText(p, p.b[0]!, pt.eps)); if (s.status === "Optimal" && Math.abs((s.objective ?? NaN) - pt.profit) <= 1e-6 + 1e-7 * Math.abs(pt.profit)) k++; }
          res.k += k; res.total += m.front.length;
          if (res.k !== res.total) res.parity = "mismatch";
        } catch (e) { setResults((r) => ({ ...r, [id]: `SOLVER UNAVAILABLE (${(e as Error).message}) · SHOWING PRECOMPUTED · PYTHON REFERENCE` })); return; }
      }
      setResults((r) => ({ ...r, [id]: res }));
    } catch (e) { setResults((r) => ({ ...r, [id]: `FAILED (${(e as Error).message})` })); }
  };
  const runAll = async () => { for (const id of MODULE_IDS) await run(id); };
  const applySeed = () => { if (validSeed) { visitor.seed = seed; setTurn({ seed, hovered: null }); setResults({}); } };
  const setCustom = (n: typeof lev) => { setLev(n); setTurn({ custom: { label: "CUSTOM LEVERS", investment_median: n.inv, revenue_multiplier: n.rev, delay_years: n.delay }, decA: "custom" }); visitor.decision = "custom"; visitor.label = "CUSTOM LEVERS"; };
  const reset = () => { setSeedText(String(SEED)); setLev({ inv: 100, rev: 1, delay: 0 }); setResults({}); visitor.seed = SEED; visitor.decision = "build_now"; visitor.label = "BUILD NOW"; setTurn({ seed: SEED, custom: null, decA: "build_now", hovered: null }); };
  const status = (id: ModuleId) => {
    const r = results[id];
    if (!r) return null;
    if (r === "running") return <span className="state-line" role="status">RUNNING IN YOUR BROWSER · SEED {validSeed ? seed : SEED}</span>;
    if (typeof r === "string") return <span className="state-line state-line--error">{r}</span>;
    return (
      <>
        <span className={`parity parity--${r.parity}`} data-parity={r.parity}>
          {r.parity === "match" ? `MATCHES PYTHON REFERENCE (${r.k} OF ${r.total} VECTORS)` : r.parity === "mismatch" ? `MISMATCH · ${r.diff ?? "see vectors"}` : `NO PUBLISHED VECTOR FOR SEED ${validSeed ? seed : SEED} · COMPUTED IN YOUR BROWSER`}
        </span>
        {r.lines.map((l, i) => <span key={i} className="note-line">{l}</span>)}
        <span className="note-line">RUNNING IN YOUR BROWSER · {fmt(r.ms, 1)} MS · PRECOMPUTED PART: {r.precomputed}</span>
      </>
    );
  };
  const modules = me?.modules ?? [];
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-lab">
      <SceneErrors id={def.id} specs={[META, ...MODULE_SPECS]} />
      <div className="lab-wrap">
        <div className="lab-head">
          <p className="scene-kicker">THE LAB · TEN INSTRUMENTS</p>
          <h2 id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="scene-title scene-title--sm">Ten instruments, in your browser.</h2>
        </div>
        <div className="lab-rail" data-rail>
          <label className="field"><span className="mono-label">SEED</span>
            <input className="rail-input" inputMode="numeric" value={seedText} aria-invalid={!validSeed} onChange={(e) => setSeedText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") applySeed(); }} onBlur={applySeed} />
          </label>
          {!validSeed ? <p className="state-line state-line--error">SEED MUST BE AN INTEGER FROM 0 TO 4,294,967,295</p> : null}
          <Radio label="DECISION" value={v.custom && v.decA === "custom" ? "build_now" : v.decA} options={DEC} render={(k) => NAMES[k]!} onChange={(k) => { visitor.decision = k; visitor.label = NAMES[k]!; setTurn({ decA: k, custom: null, hovered: null }); }} />
          <label className="slider"><span className="mono-label">INVESTMENT MEDIAN {lev.inv} M USD</span><input type="range" min={50} max={150} step={5} value={lev.inv} onChange={(e) => setCustom({ ...lev, inv: Number(e.target.value) })} /></label>
          <label className="slider"><span className="mono-label">REVENUE MULTIPLIER {lev.rev.toFixed(2)}</span><input type="range" min={0.5} max={1.2} step={0.05} value={lev.rev} onChange={(e) => setCustom({ ...lev, rev: Number(e.target.value) })} /></label>
          <label className="slider"><span className="mono-label">DELAY {lev.delay} YEARS</span><input type="range" min={0} max={2} step={1} value={lev.delay} onChange={(e) => setCustom({ ...lev, delay: Number(e.target.value) })} /></label>
          <div className="ctl-row"><button type="button" className="btn-square" onClick={runAll} disabled={!arts} aria-disabled={!arts}>RUN ALL TEN</button><button type="button" className="btn-square" onClick={reset}>RESET</button></div>
          <Inspector dec={v.decA} />
          <UnitLine drawn={v.drawn} n={v.n} seed={v.seed} />
        </div>
        <ol className="instruments" data-instruments>
          {MODULE_IDS.map((id, i) => {
            const mod = modules[i];
            return (
              <li key={id} data-module={id}>
                <div className="inst-head">
                  <b className="mono-label">{i + 1} · {mod?.name?.toUpperCase() ?? id.toUpperCase()}</b>
                  {mod ? <Tag text={mod.tag} /> : null}
                  <button type="button" className="btn-square" disabled={!arts || results[id] === "running"} aria-disabled={!arts} onClick={() => void run(id)}>RUN IN YOUR BROWSER</button>
                </div>
                <p className="note-line">{SEEDED[id] ? `DRIVEN BY THE SEED FIELD` : "DETERMINISTIC · NO SEED"}</p>
                <div className="inst-out" aria-live="polite">{status(id)}</div>
              </li>
            );
          })}
        </ol>
        <Foot meta={me} />
      </div>
    </Track>
  );
}
void turnView;
