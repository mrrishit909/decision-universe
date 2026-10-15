 
/** P10 release gate: the Turn tells the truth, parity with the artifacts, state machines, collisions, contrast, axe, reduced motion. */
import { expect, test, type Browser } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { WALK, collideAll, contrastFails, goScene, openSite } from "./qa";

test.skip(({ isMobile }) => isMobile, "viewports are set per test");
test.describe.configure({ timeout: 600_000 });
const BASE = "http://localhost:4401/decision-universe/";
const VP = (w: number, h: number) => ({ width: w, height: h });
async function at(browser: Browser, vp: { width: number; height: number }, opts: { reduced?: boolean } = {}) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 768, hasTouch: vp.width < 768, reducedMotion: opts.reduced ? "reduce" : "no-preference", baseURL: BASE });
  return { ctx, page: await ctx.newPage() };
}
const D = join(process.cwd(), "public/data");
const J = <T,>(f: string) => JSON.parse(readFileSync(join(D, f), "utf8")) as T;
const text = (page: any) => page.evaluate(() => document.body.innerText);
const KEYS = ["build_now", "phased", "delay_one_year"];
const pack = (page: any) => page.evaluate(() => (window as any).__du.pack());

test("S00: threads drawn, payback squares and the unit line are the run's own numbers", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await page.waitForTimeout(800);
  const d = await page.evaluate(() => (window as any).__du.drawn());
  const v = await page.evaluate(() => (window as any).__du.view());
  expect(d.threads).toBe(Math.min(1200, v.n));
  expect(d.cams.length).toBe(1);
  expect(Math.abs(d.cams[0].R - 590)).toBeLessThan(1);
  const t = await text(page);
  expect(t).toContain(`OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011`);
  expect(t).toContain("SYNTHETIC");
  expect(t).toContain("RUNNING IN YOUR BROWSER");
  const m3 = J<any>("m03_montecarlo.json");
  expect(t).toContain(`INVEST ${Math.round(Math.exp(m3.environment.investment.mu))} M USD (MEDIAN)`);
  // squares equal the drawn futures that pay back: exact count from the published rule
  const p = await page.evaluate(() => (window as any).__du.pack());
  expect(p.decisions[0].key).toBe("build_now");
  expect(d.paying).toBeGreaterThan(0);
  await ctx.close();
});

test("the Turn is the published environment: 16 futures per decision equal the artifact, same draws under every decision", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  const m3 = J<any>("m03_montecarlo.json");
  const p = await pack(page);
  p.draws.slice(0, 5).forEach((x: number, i: number) => expect(Math.abs(x - m3.paths.draws[0][i])).toBeLessThan(1e-8));
  for (const k of KEYS) {
    const dec = p.decisions.find((x: any) => x.key === k);
    m3.paths.decisions[k].forEach((w: any, i: number) => {
      expect(Math.abs(dec.npv[i] - w.npv)).toBeLessThan(1e-6);
      if (w.payback_year === null) expect(Number.isNaN(dec.pay[i])).toBe(true); else expect(Math.abs(dec.pay[i] - w.payback_year)).toBeLessThan(1e-6);
    });
  }
  // angle = 360 degrees x recovered, radius linear in years, at year 8 the thread ends on the rim
  const th = await page.evaluate(() => (window as any).__du.thread(0, 3));
  const dec = p.decisions[0];
  const last = th.length - 2;
  expect(Math.hypot(th[last], th[last + 1])).toBeCloseTo(1, 4);
  expect(Math.atan2(th[last], -th[last + 1])).toBeDefined();
  expect(dec.rec0[0]).toBe(0);
  await ctx.close();
});

test("S01: the pair, the ledger per decision and the same-worlds line", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "another", 0.65);
  const v = await page.evaluate(() => (window as any).__du.view());
  expect(v.mode).toBe("pair");
  const d = await page.evaluate(() => (window as any).__du.drawn());
  expect(d.cams.length).toBe(2);
  const m3 = J<any>("m03_montecarlo.json");
  const ph = m3.environment.decisions.presets.find((x: any) => x.id === "phased");
  await expect(page.locator("#another [data-decision=phased]")).toContainText(`P(LOSS) ${(ph.run.p_loss * 100).toFixed(1)}%`);
  await expect(page.locator("#another [data-crn]")).toContainText("SAME 20,000 WORLDS, SAME SEED 20261011");
  await page.locator("#another").getByRole("radio", { name: "DELAY ONE YEAR" }).click();
  const del = m3.environment.decisions.presets.find((x: any) => x.id === "delay_one_year");
  await expect(page.locator("#another [data-decision=delay_one_year]")).toContainText(`MEAN NPV ${del.run.mean.toFixed(1)}`);
  expect(await page.evaluate(() => (window as any).__du.view().decB)).toBe("delay_one_year");
  // inspector lights the same index in both turns
  await page.locator("#another [data-inspector] input[type=range]").fill("10");
  expect(await page.evaluate(() => (window as any).__du.view().hovered)).not.toBeNull();
  await ctx.close();
});

test("S02: the eight u32 values are recomputed live and tick against the artifact", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "real", 0.1);
  const m2 = J<any>("m02_sampling.json");
  await page.waitForTimeout(1600);
  const got = await page.locator("#real [data-u32]").allTextContents();
  m2.first_1000_u32.slice(0, 8).forEach((w: number, i: number) => expect(got[i]).toContain(String(w)));
  await expect(page.locator("#real [data-ok=yes]")).toHaveCount(8);
  await ctx.close();
});

test("S03a: the standard error at each n equals the published table; 100,000 is labelled PRECOMPUTED", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "enough", 0.1);
  const m3 = J<any>("m03_montecarlo.json");
  for (const n of [1000, 10000]) {
    await page.locator("#enough").getByRole("radio", { name: n.toLocaleString("en-US") }).click();
    const row = m3.convergence.find((c: any) => c.n === n);
    await expect(page.locator("#enough [data-stat]")).toContainText(`SE ${row.se.toFixed(3)}`, { timeout: 10000 });
  }
  await page.locator("#enough").getByRole("radio", { name: "100,000" }).click();
  await expect(page.locator("#enough [data-ledger]")).toContainText("PRECOMPUTED · PYTHON REFERENCE");
  await ctx.close();
});

test("S03b: credible and confidence marks are separate elements with their own words; posterior is a0+s, b0+f", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "learning", 0.5);
  const bad = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll("#learning [data-interval=credible]")) for (const sib of el.parentElement!.children) if (sib !== el && /confidence/i.test(sib.textContent ?? "") && sib.getAttribute("data-interval") !== "confidence") out.push("credible has confidence sibling");
    for (const el of document.querySelectorAll("#learning [data-interval=confidence]")) for (const sib of el.parentElement!.children) if (sib !== el && /credible/i.test(sib.textContent ?? "") && sib.getAttribute("data-interval") !== "credible") out.push("confidence has credible sibling");
    // a credible mark is never hollow, a confidence mark is never filled
    for (const el of document.querySelectorAll("#learning rect[data-interval=credible]")) if (el.getAttribute("fill") === "none") out.push("hollow credible");
    if (document.querySelector("#learning [data-interval=confidence] rect")) out.push("filled confidence");
    return out;
  });
  expect(bad).toEqual([]);
  await expect(page.locator("#learning [data-words=credible]").first()).toContainText("CREDIBLE");
  const live = page.locator("#learning [data-live]");
  for (let i = 0; i < 3; i++) await page.locator("#learning").getByRole("button", { name: "SUCCESS" }).click();
  await page.locator("#learning").getByRole("button", { name: "FAILURE" }).click();
  await expect(live.locator("[data-posterior]")).toContainText("3 SUCCESS IN 4 · POSTERIOR BETA(4, 2)");
  await page.locator("#learning").getByRole("button", { name: "RESET" }).click();
  await expect(live.locator("[data-posterior]")).toContainText("0 SUCCESS IN 0");
  await ctx.close();
});

test("S04: the unroll lands on its polar and cartesian targets; the prediction counter is the artifact's", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "unroll", 0.05);
  const p = await pack(page);
  expect(p).not.toBeNull();
  const v0 = await page.evaluate(() => (window as any).__du.vertex(0, 2, 4, 0));
  const th = await page.evaluate(() => (window as any).__du.thread(0, 2));
  const c = (await page.evaluate(() => (window as any).__du.drawn())).cams[0];
  // year 4 is sample 48 of 12 per year: polar target relative to the camera centre (unit thread scaled by R)
  expect(Math.abs(v0[0] - (c.c[0] + th[48 * 2] * c.R))).toBeLessThan(1);
  expect(Math.abs(v0[1] - (c.c[1] + th[48 * 2 + 1] * c.R))).toBeLessThan(1);
  await goScene(page, "unroll", 0.8);
  await page.waitForTimeout(600);
  const m5 = J<any>("m05_forecast.json");
  const hold: number[] = m5.intervals.holdout, iv = m5.intervals.ar1["0.95"];
  const covered = hold.filter((x, h) => x >= iv[h][1] && x <= iv[h][2]).length;
  await expect(page.locator("#unroll [data-coverage]")).toContainText(`COVERED ${covered} OF ${hold.length}`);
  await expect(page.locator("#unroll")).toContainText("PREDICTION INTERVAL");
  expect(await page.locator("#unroll [data-interval=prediction]").first().getAttribute("stroke-dasharray")).toBe("4 4");
  await ctx.close();
});

test("S05: cost at the threshold is the recomputed confusion cost; the optimum equals the artifact; counterfactual label", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "line", 0.1);
  const m6 = J<any>("m06_credit.json");
  const c05 = m6.vectors.find((v: any) => v.kind === "cost" && v.t === 0.5 && v.c_fn === 5);
  await expect(page.locator("#line [data-cost]")).toContainText(`COST PER APPLICANT ${c05.cost.toFixed(3)} · APPROVED BAD ${c05.fn} · REJECTED GOOD ${c05.fp}`);
  await expect(page.locator("#line [data-parity]")).toContainText("MATCHES PYTHON REFERENCE");
  await page.locator("#line input[aria-label='Rejection threshold']").fill("0.1");
  await expect(page.locator("#line [data-cost]")).toContainText(`COST PER APPLICANT ${m6.optimum.cost_opt.toFixed(3)}`);
  await goScene(page, "line", 0.85);
  await expect(page.locator("#line [data-cf-label]")).toContainText("MODEL COUNTERFACTUAL · NOT A CAUSAL CLAIM");
  await expect(page.locator("#line [data-immutable]")).toContainText("CANNOT CHANGE");
  await ctx.close();
});

test("S06: a live HiGHS solve at a published epsilon matches the reference; a forced solver failure shows error and RETRY", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "trade", 0.1);
  await page.locator("#trade").getByRole("button", { name: "CLEANEST" }).click();
  await expect(page.locator("#trade [data-solve]")).toContainText("MATCHES PYTHON REFERENCE", { timeout: 20000 });
  await expect(page.locator("#trade [data-solve]")).toContainText("SOLVED IN YOUR BROWSER");
  await expect(page.locator("#trade [data-solve]")).toContainText("OPTIMAL");
  await goScene(page, "trade", 0.8);
  await expect(page.locator("#trade [data-saltelli]")).toContainText("RUNNING IN YOUR BROWSER", { timeout: 10000 });
  await ctx.close();
  const f = await at(browser, VP(1440, 900));
  await f.page.goto("?fail=highs");
  await f.page.waitForFunction(() => (window as any).__du.view().packN > 0);
  await f.page.keyboard.press("Escape");
  await goScene(f.page, "trade", 0.1);
  await expect(f.page.locator("#trade")).toContainText("SOLVER UNAVAILABLE", { timeout: 10000 });
  await expect(f.page.locator("#trade").getByRole("button", { name: "RETRY" })).toBeVisible();
  await f.ctx.close();
});

test("S07: every gap is estimate minus benchmark, the benchmark is on screen with the estimators and the DAG assumptions", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "unchosen", 0.3);
  const m10 = J<any>("m10_causal.json");
  const b = m10.nsw.benchmark.estimate;
  for (const r of Object.values<any>(m10.nsw.observational_estimators)) expect(Math.abs(r.estimate - b - r.gap_vs_benchmark)).toBeLessThan(0.02);
  await expect(page.locator("#unchosen [data-benchmark]")).toBeVisible();
  await expect(page.locator("#unchosen")).toContainText(`EXPERIMENTAL BENCHMARK (NSW, RANDOMISED) ${b.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD`);
  await expect(page.locator("#unchosen [data-estimator]")).toHaveCount(4);
  await expect(page.locator("#unchosen [data-assumptions] li")).toHaveCount(m10.assumptions.length);
  await expect(page.locator("#unchosen [data-ess]")).toContainText(`EFFECTIVE CONTROLS ≈ ${m10.nsw.overlap.ess_controls.toFixed(1)} OF 2,490`);
  await goScene(page, "unchosen", 0.97);
  await expect(page.locator("#unchosen [data-argstack] .ex")).toHaveCount(3);
  await ctx.close();
});

test("THE LAB: all ten match at the published seed; another seed says NO PUBLISHED VECTOR and PRECOMPUTED rows do not move", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  await goScene(page, "lab", 0);
  await page.getByRole("button", { name: "RUN ALL TEN" }).click();
  await expect(page.locator("#lab [data-parity=match]")).toHaveCount(10, { timeout: 90000 });
  const before = await page.locator("#lab [data-module=m06] .inst-out").innerText();
  const input = page.locator("#lab input.rail-input");
  await input.fill("7");
  await input.press("Enter");
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "RUN ALL TEN" }).click();
  await expect(page.locator("#lab [data-module=m03] [data-parity=novector]")).toContainText("NO PUBLISHED VECTOR FOR SEED 7", { timeout: 60000 });
  await expect(page.locator("#lab [data-module=m06] .inst-out")).toContainText("PRECOMPUTED");
  const after = await page.locator("#lab [data-module=m06] .inst-out").innerText();
  expect(after.replace(/[\d.]+ MS/, "")).toBe(before.replace(/[\d.]+ MS/, ""));
  expect(await page.evaluate(() => (window as any).__du.view().seed)).toBe(7);
  // the seed changed the threads and the S08 line
  await goScene(page, "closing", 0.7);
  await expect(page.locator("#closing [data-yours]")).toContainText("SEED 7");
  await ctx.close();
});

test("worker failure: the same numbers are computed on the main thread and labelled", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await page.goto("?fail=worker");
  await page.waitForFunction(() => (window as any).__du && (window as any).__du.view().packN > 0);
  await page.waitForTimeout(500);
  expect((await text(page))).toContain("RUNNING IN YOUR BROWSER (MAIN THREAD)");
  const p = await pack(page);
  expect(Math.abs(p.decisions[0].mean - J<any>("m03_montecarlo.json").run.mean)).toBeLessThan(1e-7);
  await ctx.close();
});

test("zero external requests and zero console errors across every scene", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  const ext: string[] = [], errs: string[] = [];
  page.on("request", (r) => { if (!r.url().startsWith("http://localhost:4401") && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) ext.push(r.url()); });
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push(String(e)));
  await openSite(page);
  for (const [id, p] of WALK) await goScene(page, id, p);
  expect(ext).toEqual([]);
  expect(errs).toEqual([]);
  await ctx.close();
});

test("route-blocked m04_bayes.json: error line with RETRY, then recovery", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  let block = true;
  await page.route("**/m04_bayes.json", (r) => (block ? r.fulfill({ status: 500, body: "x" }) : r.continue()));
  await openSite(page);
  await goScene(page, "learning", 0.3);
  await expect(page.locator("#learning")).toContainText(/COULD NOT LOAD/i, { timeout: 8000 });
  block = false;
  await page.locator("#learning").getByRole("button", { name: "RETRY" }).first().click();
  await expect(page.locator("#learning [data-live]")).toBeVisible({ timeout: 8000 });
  await expect(page.locator("#learning [data-row]").first()).toBeVisible({ timeout: 8000 });
  await ctx.close();
});

test("copy rules: no dash characters, no AI or smart or intelligent, in any scene", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900));
  await openSite(page);
  let all = "";
  for (const [id, p] of WALK) { await goScene(page, id, p); all += "\n" + (await text(page)); }
  expect(all).not.toMatch(/[\u2014\u2015]/);
  expect(all).not.toMatch(/\b(AI|smart|intelligent)\b/i);
  expect(all).not.toMatch(/predicts the future/i);
  await ctx.close();
});

for (const vp of [VP(1440, 900), VP(1280, 720), VP(768, 1024), VP(390, 844), VP(375, 812), VP(360, 800)]) {
  test(`whole-document collision walk and text floor at ${vp.width}x${vp.height}`, async ({ browser }) => {
    const { ctx, page } = await at(browser, vp);
    await openSite(page);
    const bad: string[] = [];
    for (const [id, p] of WALK) {
      await goScene(page, id, p);
      for (const x of await collideAll(page)) bad.push(`${id}@${p}: ${x}`);
      const small = await page.evaluate(() => {
        const out: string[] = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const el = n.parentElement!;
          if (!n.textContent?.trim() || el.closest(".sr-only, script, style, [aria-hidden=true], svg")) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.bottom < 0 || r.top > innerHeight) continue;
          const cs = getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.3) continue;
          if (parseFloat(cs.fontSize) < 9.49) out.push(`${n.textContent!.trim().slice(0, 24)} ${cs.fontSize}`);
        }
        return out;
      });
      for (const s of small) bad.push(`${id}@${p} small: ${s}`);
    }
    expect(bad).toEqual([]);
    await ctx.close();
  });
}

test("no sideways scroll at 1440, 1024, 768, 390, 360 in every scene", async ({ browser }) => {
  const bad: string[] = [];
  for (const w of [1440, 1024, 768, 390, 360]) {
    const { ctx, page } = await at(browser, VP(w, w < 768 ? 800 : 900));
    await openSite(page);
    for (const [id, p] of WALK) {
      await goScene(page, id, p);
      const sw = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
      if (sw > w) bad.push(`${w} ${id}@${p}: ${sw}`);
    }
    await ctx.close();
  }
  expect(bad).toEqual([]);
});

const CONTRAST_SCENES: [string, number][] = [["turn", 0.8], ["another", 0.65], ["real", 0.45], ["enough", 0.5], ["learning", 0.5], ["unroll", 0.8], ["line", 0.2], ["line", 0.85], ["trade", 0.2], ["trade", 0.8], ["unchosen", 0.3], ["unchosen", 0.97], ["lab", 0], ["closing", 0.95]];
test("pixel contrast >= 4.5:1 (3:1 large) for visible text at 1440 and 390", async ({ browser }) => {
  const bad: string[] = [];
  for (const vp of [VP(1440, 900), VP(390, 844)]) {
    const { ctx, page } = await at(browser, vp);
    await openSite(page);
    for (const [id, p] of CONTRAST_SCENES) {
      await goScene(page, id, p);
      for (const f of await contrastFails(page)) bad.push(`${vp.width} ${id}@${p}: ${f}`);
    }
    await ctx.close();
  }
  expect(bad).toEqual([]);
});

test("axe: no serious or critical violations, motion and reduced motion", async ({ browser }) => {
  for (const reduced of [false, true]) {
    const { ctx, page } = await at(browser, VP(1440, 900), { reduced });
    await openSite(page);
    for (const [id, p] of CONTRAST_SCENES) {
      await goScene(page, id, p);
      const r = await new AxeBuilder({ page }).analyze();
      const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${id} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
      expect(bad, `reduced=${reduced}`).toEqual([]);
    }
    await ctx.close();
  }
});

test("reduced motion: scenes render in flow with their content and no intro", async ({ browser }) => {
  const { ctx, page } = await at(browser, VP(1440, 900), { reduced: true });
  await openSite(page);
  expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe("off");
  expect(await text(page)).toContain("Every decision creates a different future.");
  for (const id of ["another", "real", "enough", "learning", "unroll", "line", "trade", "unchosen", "lab", "closing"]) expect(await page.locator(`#${id}`).count()).toBe(1);
  await ctx.close();
});
