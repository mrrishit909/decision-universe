import { createPortal } from "react-dom";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useArtifact } from "../data/useArtifact";
import { M03 } from "./data";
import { computeState } from "../state/compute";
import { DRAWN_CAP, camera, classOf } from "./geometry";
import { useTurn, UnitLine } from "../scenes/common";
import { pct } from "./data";
import { HonestyChip } from "../components/HonestyChip";

/** S00 labels portalled into the static section: corner lines, the decision label, the chip bound to the compute state, the caption. */
export function TurnOpening() {
  const [m3] = useArtifact(M03);
  const v = useTurn();
  const cs = useSyncExternalStore(computeState.subscribe, computeState.get, computeState.get);
  const [size, setSize] = useState({ w: 1440, h: 900 });
  useEffect(() => {
    const f = () => setSize({ w: document.documentElement.clientWidth, h: innerHeight });
    f(); addEventListener("resize", f);
    return () => removeEventListener("resize", f);
  }, []);
  const host = typeof document === "undefined" ? null : document.getElementById("turn-portal");
  if (!host) return null;
  const m = m3.status === "ready" ? m3.data : null;
  const median = m ? Math.round(Math.exp(m.environment.investment.mu)) : null;
  const dec = v.pack?.decisions[0];
  const cam = camera("G0", size.w, size.h);
  const cls = classOf(size.w);
  const running = cs.status === "ready" && !!v.pack;
  return createPortal(
    <>
      <div className="intro-corner" data-intro-corner>
        <p className="intro-corner__a" data-corner-a>
          {median !== null && v.pack ? <>INVEST {median} M USD (MEDIAN) · {v.n.toLocaleString("en-US")} FUTURES · SEED {v.seed}</> : "LOADING THE FIRST TURN"}
        </p>
        <p className="intro-corner__b"><UnitLine drawn={v.pack ? Math.min(v.n, v.pack.nDraw, DRAWN_CAP[cls]) : 0} n={v.n} seed={v.seed} /></p>
      </div>
      <p className="invest-label mono-label" style={{ left: cam.c[0] + 14, top: cam.c[1] - 8 }}>INVEST {median ?? 100} M USD?</p>
      <div className="s00-chip">
        <HonestyChip tag="SYNTHETIC" detail={`SEEDED${running ? ` · RUNNING IN YOUR BROWSER${cs.mode === "main" ? " (MAIN THREAD)" : ""}` : ""}`} />
      </div>
      <p className="s00-caption mono-label" data-caption>
        {dec ? <>{pct(dec.paybackShare, 0)} PAY BACK IN 8 YEARS · {pct(dec.lossShare, 0)} NEVER COMPLETE THE TURN</> : "COMPUTING THE FUTURES"}
        <br />
        <span className="dim">WHITE = POSITIVE NPV · VIOLET = LOSS · SQUARES ON THE TOP LINE = PAYBACK YEAR</span>
        <br />
        <span className="dim">DRAWN AS IF CASH ARRIVED EVENLY · THE MODEL PAYS AT YEAR END</span>
      </p>
    </>,
    host,
  );
}
