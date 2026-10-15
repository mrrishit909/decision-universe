import { useEffect, useMemo, useState } from "react";
import { StoryDeck, type DeckCard } from "../components/StoryDeck";
import { Track } from "../scroll/Track";
import { HonestyChip } from "../components/HonestyChip";
import { ArtifactStatus, SceneErrors } from "../components/StateUI";
import { useArtifact } from "../data/useArtifact";
import { META, M01, M02, M06, M10, fmt } from "../app/data";
import { computeU32, computeBridges } from "../state/compute";
import * as dist from "../model/dists";
import { useSteps, setTurn, useTurn, Tag } from "./common";
import type { SceneDef } from "../app/scenes";

 
function Seed({ m2, seed }: { m2: any; seed: number }) {
  const [u, setU] = useState<number[] | null>(null);
  const [ticks, setTicks] = useState(0);
  const [br, setBr] = useState<Float32Array | null>(null);
  useEffect(() => {
    let live = true;
    void computeU32(seed, 8).then((x) => { if (live) setU(x); });
    void computeBridges(seed, 64, 100).then((x) => { if (live) setBr(x); });
    return () => { live = false; };
  }, [seed]);
  useEffect(() => {
    if (!u) return;
    const id = setInterval(() => setTicks((t) => (t >= 8 ? t : t + 1)), 110);
    return () => clearInterval(id);
  }, [u]);
  const paths = useMemo(() => {
    if (!br) return [];
    const n = 100, out: string[] = [];
    for (let s = 0; s < 64; s++) {
      let d = "";
      for (let j = 0; j <= n; j += 2) d += `${j ? "L" : "M"}${(j / n) * 300},${(40 - br[s * (n + 1) + j]! * 260).toFixed(1)}`;
      out.push(d);
    }
    return out;
  }, [br]);
  return (
    <div className="deck-vis" data-seed-card>
      <p>xoshiro128** · splitmix32 · SEED {seed}</p>
      <ol className="u32" aria-label="First eight u32 values, recomputed in your browser">
        {(u ?? Array.from({ length: 8 }, () => null)).map((x, i) => (
          <li key={i} data-u32={i}>{x === null ? "…" : x}{u && i < ticks ? <span className="ok" data-ok={x === m2.first_1000_u32[i] ? "yes" : "no"}> {x === m2.first_1000_u32[i] ? "✓" : "✗"}</span> : null}</li>
        ))}
      </ol>
      <svg viewBox="0 0 300 80" className="bridges" role="img" aria-label="64 seeded samples as bridges: sampling error pinned at both ends, widest at 50%">
        {paths.map((d, i) => <path key={i} d={d} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="1" />)}
      </svg>
      <p>SAMPLING ERROR IS WIDEST AT 50%</p>
    </div>
  );
}
function Shapes({ m1 }: { m1: any }) {
  const pick = useMemo(() => {
    const seen = new Set<string>(), out: any[] = [];
    for (const c of m1.cases) if (!c.discrete && !seen.has(c.dist)) { seen.add(c.dist); out.push(c); }
    return out.slice(0, 5);
  }, [m1]);
  const mk = (c: any): dist.Dist => {
    const p = c.params;
    return c.dist === "normal" ? dist.normal(p.mu, p.sigma) : c.dist === "lognormal" ? dist.lognormal(p.mu, p.sigma) : c.dist === "beta" ? dist.beta(p.a, p.b) : dist.gamma(p.shape, p.scale);
  };
  return (
    <div className="deck-vis">
      {pick.map((c, i) => {
        const d = mk(c), lo = d.ppf(0.005), hi = d.ppf(0.995), pts = Array.from({ length: 48 }, (_, k) => lo + ((hi - lo) * k) / 47);
        const ys = pts.map((x) => d.pdf(x)), top = Math.max(...ys);
        const path = `M0,30 ${pts.map((_, k) => `L${(k / 47) * 280},${(30 - (ys[k]! / top) * 28).toFixed(1)}`).join(" ")} L280,30 Z`;
        return <svg key={i} viewBox="0 0 280 32" className="silhouette" role="img" aria-label={`${c.dist} density`}><path d={path} fill="#690DE2" fillOpacity="0.9" stroke="#B48CFF" strokeWidth="1" /></svg>;
      })}
      <p>INTEGRATES TO 1 WITHIN {m1.checks.max_abs_integral_error.toExponential(1).toUpperCase()} ACROSS {m1.cases.length} CASES</p>
    </div>
  );
}

/** S02 What is real: four cards. */
export function S02Real({ def }: { def: SceneDef }) {
  const v = useTurn();
  const [meta] = useArtifact(META);
  const [m1, r1] = useArtifact(M01);
  const [m2, r2] = useArtifact(M02);
  const [m6, r6] = useArtifact(M06);
  const [m10, r10] = useArtifact(M10);
  useSteps(def.id, [], () => setTurn({ mode: "turn", cam: "G1", alpha: 0.2, unroll: 0 }));
  const cm = m6.status === "ready" ? m6.data.spec.cost_matrix : null;
  const me = meta.status === "ready" ? meta.data : null;
  const nsw = m10.status === "ready" ? m10.data : null;
  const cards: DeckCard[] = [
    {
      variant: "violet", chip: "THE SEED", title: "The seed", body: <>EVERY RANDOM NUMBER ON THIS SITE COMES FROM ONE GENERATOR AND ONE PUBLISHED SEED.</>,
      visual: <ArtifactStatus file="m02_sampling.json" state={m2} retry={r2} empty="UNAVAILABLE">{(m) => <Seed key={v.seed} m2={m} seed={v.seed} />}</ArtifactStatus>,
      tag: m2.status === "ready" ? <Tag text={m2.data.tags.first_1000_u32} /> : <HonestyChip tag="SYNTHETIC" />,
    },
    {
      variant: "dark", chip: "SHAPES OF CHANCE", title: "Shapes of chance", body: <>FIVE DISTRIBUTIONS, COMPUTED FROM FIRST PRINCIPLES AND CHECKED AGAINST THE REFERENCE.</>,
      visual: <ArtifactStatus file="m01_distributions.json" state={m1} retry={r1} empty="UNAVAILABLE">{(m) => <Shapes m1={m} />}</ArtifactStatus>,
      tag: m1.status === "ready" ? <Tag text={m1.data.tags.cases} /> : <HonestyChip tag="DERIVED" />,
    },
    {
      variant: "dark", chip: "REAL APPLICANTS", title: "Real applicants", body: <>1,000 REAL LOAN APPLICATIONS FROM A GERMAN BANK, WITH A PUBLISHED COST FOR EACH KIND OF MISTAKE.</>,
      visual: (
        <div className="deck-vis">
          <ArtifactStatus file="m06_credit.json" state={m6} retry={r6} empty="UNAVAILABLE">{(m) => (
            <>
              <p>{fmt(m.dataset.rows)} ROWS · {m.dataset.split.train} TRAIN · {m.dataset.split.cal} CALIBRATE · {m.dataset.split.test} TEST</p>
              <table className="matrix"><tbody>
                <tr><th scope="row">APPROVE A BAD LOAN</th><td>{cm?.bad_accepted}</td></tr>
                <tr><th scope="row">REJECT A GOOD LOAN</th><td>{cm?.good_rejected}</td></tr>
                <tr><th scope="row">APPROVE GOOD / REJECT BAD</th><td>0</td></tr>
              </tbody></table>
              <p>UCI · CC BY 4.0 · HOFMANN (1994) · <a className="doi" href={`https://doi.org/${m.dataset.doi}`} rel="noreferrer">DOI {m.dataset.doi}</a></p>
            </>
          )}</ArtifactStatus>
        </div>
      ),
      tag: <HonestyChip tag="OBSERVED" />,
    },
    {
      variant: "blue", chip: "REAL EARNINGS", title: "Real earnings", body: <>A 1970s TRAINING EXPERIMENT AND A SURVEY OF PEOPLE WHO DID NOT TAKE PART.</>,
      visual: (
        <div className="deck-vis">
          <ArtifactStatus file="m10_causal.json" state={m10} retry={r10} empty="UNAVAILABLE">{() => nsw && (
            <>
              <p>NSW {nsw.nsw.benchmark.n_treated + nsw.nsw.benchmark.n_control} ({nsw.nsw.benchmark.n_treated} TREATED, {nsw.nsw.benchmark.n_control} CONTROL) · PSID {fmt(nsw.nsw.observational_sample.n_psid_controls)}</p>
              <p><a className="doi" href={nsw.spec.link} rel="noreferrer">NBER · ATTRIBUTABLE NON-COMMERCIAL USE</a></p>
              <ul className="attr">{(me?.citations ?? []).slice(0, 3).map((c: string, i: number) => <li key={i}>{c}</li>)}</ul>
              <p>{nsw.nsw.duplicates_in_nsw} EXACT DUPLICATE ROWS ARE REAL AND KEPT</p>
            </>
          )}</ArtifactStatus>
        </div>
      ),
      tag: <HonestyChip tag="OBSERVED" />,
    },
  ];
  return (
    <Track id={def.id} height={def.track} landing={def.landing} className="scene scene-real">
      <SceneErrors id={def.id} specs={[META, M01, M02, M06, M10]} />
      <p className="scene-kicker s02-kicker">S02 · WHAT IS REAL, WHAT IS INVENTED</p>
      <h2 id={`${def.id}-title`} tabIndex={-1} data-scene-heading className="sr-only">{def.title}</h2>
      <StoryDeck track={def.id} cards={cards} />
      <p className="scene-foot s02-foot mono-label" data-foot>EVERYTHING ELSE ON THIS SITE IS SYNTHETIC AND SEEDED · SEED {v.seed}{me ? ` · ${me.limitations[0]}` : ""}</p>
    </Track>
  );
}
