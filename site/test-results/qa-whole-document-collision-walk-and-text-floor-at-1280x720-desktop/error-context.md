# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: qa.spec.ts >> whole-document collision walk and text floor at 1280x720
- Location: e2e/qa.spec.ts:291:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 5

- Array []
+ Array [
+   "real@0.45: pinned: \"S02 · WHAT IS REAL, WHAT IS \" x \"THE SEED\"",
+   "real@0.7: pinned: \"S02 · WHAT IS REAL, WHAT IS \" x \"REAL APPLICANTS\"",
+   "real@0.9: pinned: \"S02 · WHAT IS REAL, WHAT IS \" x \"REAL APPLICANTS\"",
+ ]
```

# Page snapshot

```yaml
- main [ref=e2]:
  - region [ref=e3]:
    - generic [ref=e5]:
      - paragraph [ref=e6]: DECISION UNIVERSE
      - heading "Every decision creates a different future." [level=1] [ref=e7]:
        - generic [ref=e8]: Every
        - generic [ref=e9]: decision
        - generic [ref=e10]: creates
        - generic [ref=e11]: a
        - generic [ref=e12]: different
        - generic [ref=e13]: future.
      - paragraph [ref=e14]: "Animated introduction: a single point stands for a 100 million dollar investment. Thousands of lines leave it, one per simulated future, moving outward one year at a time and turning clockwise as money comes back. A line that returns to the top has repaid the investment."
      - generic:
        - generic [ref=e15]:
          - paragraph [ref=e16]: INVEST 100 M USD (MEDIAN) · 20,000 FUTURES · SEED 20261011
          - paragraph [ref=e17]:
            - paragraph [ref=e18]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
        - paragraph [ref=e19]: INVEST 100 M USD?
        - generic [ref=e21]:
          - text: SYNTHETIC
          - generic [ref=e23]: · SEEDED · RUNNING IN YOUR BROWSER
        - paragraph [ref=e24]: 62% PAY BACK IN 8 YEARS · 38% NEVER COMPLETE THE TURNWHITE = POSITIVE NPV · VIOLET = LOSS · SQUARES ON THE TOP LINE = PAYBACK YEARDRAWN AS IF CASH ARRIVED EVENLY · THE MODEL PAYS AT YEAR END
  - generic [ref=e25]:
    - navigation "Chapters" [ref=e26]:
      - list [ref=e29]:
        - listitem [ref=e30]:
          - link "FUTURES" [ref=e31] [cursor=pointer]:
            - /url: "#turn"
        - listitem [ref=e32]:
          - link "ANOTHER DECISION" [ref=e33] [cursor=pointer]:
            - /url: "#another"
        - listitem [ref=e34]:
          - link "WHAT IS REAL" [ref=e35] [cursor=pointer]:
            - /url: "#real"
        - listitem [ref=e36]:
          - link "ENOUGH" [ref=e37] [cursor=pointer]:
            - /url: "#enough"
        - listitem [ref=e38]:
          - link "LEARNING" [ref=e39] [cursor=pointer]:
            - /url: "#learning"
        - listitem [ref=e40]:
          - link "UNROLL" [ref=e41] [cursor=pointer]:
            - /url: "#unroll"
        - listitem [ref=e42]:
          - link "THE LINE" [ref=e43] [cursor=pointer]:
            - /url: "#line"
        - listitem [ref=e44]:
          - link "TRADE-OFFS" [ref=e45] [cursor=pointer]:
            - /url: "#trade"
        - listitem [ref=e46]:
          - link "UNCHOSEN" [ref=e47] [cursor=pointer]:
            - /url: "#unchosen"
        - listitem [ref=e48]:
          - link "THE LAB" [ref=e49] [cursor=pointer]:
            - /url: "#lab"
      - generic [ref=e50]:
        - button "REPLAY INTRO" [ref=e51] [cursor=pointer]
        - button "MOTION ON" [ref=e52] [cursor=pointer]
    - generic [ref=e55]:
      - generic [ref=e56]:
        - paragraph [ref=e57]: S01 · SAME WORLDS, ANOTHER DECISION
        - heading "Same chance. Another decision. Different futures." [level=2] [ref=e58]:
          - generic [ref=e59]: Same
          - generic [ref=e60]: chance.
          - generic [ref=e61]: Another
          - generic [ref=e62]: decision.
          - generic [ref=e63]: Different
          - generic [ref=e64]: futures.
        - generic [ref=e65]: SYNTHETIC
      - group "Controls and readouts" [ref=e67]:
        - radiogroup "DECISION B" [ref=e68]:
          - generic [aria-hidden] [ref=e69]: DECISION B
          - generic [ref=e70]:
            - radio "BUILD NOW" [ref=e71] [cursor=pointer]
            - radio "PHASED" [checked] [ref=e72] [cursor=pointer]
            - radio "DELAY ONE YEAR" [ref=e73] [cursor=pointer]
        - list [ref=e74]:
          - listitem [ref=e75]:
            - generic [ref=e76]: A · BUILD NOW
            - generic [ref=e77]: MEAN NPV 11.1 M USD · P(LOSS) 38.0% · MEDIAN PAYBACK YEAR 6.2
            - img "95% confidence interval of the mean 10.64 to 11.54" [ref=e78]
            - generic [ref=e79]: 95% CONFIDENCE INTERVAL OF THE MEAN 10.64 TO 11.54
          - listitem [ref=e80]:
            - generic [ref=e81]: B · PHASED
            - generic [ref=e82]: MEAN NPV 13.4 M USD · P(LOSS) 29.9% · MEDIAN PAYBACK YEAR 6.0
            - img "95% confidence interval of the mean 13.04 to 13.71" [ref=e83]
            - generic [ref=e84]: 95% CONFIDENCE INTERVAL OF THE MEAN 13.04 TO 13.71
        - paragraph [ref=e85]: THE PROCEDURE BEHIND THE BRACKETS COVERS THE TRUE MEAN IN 95% OF REPEATED RUNS.
        - paragraph [ref=e86]: "COMMON RANDOM NUMBERS: SAME 20,000 WORLDS, SAME SEED 20261011"
        - generic [ref=e87]:
          - generic [ref=e88]:
            - generic [ref=e89]: THREAD, SORTED BY FINAL NPV
            - slider "THREAD, SORTED BY FINAL NPV" [ref=e90]: "0"
          - paragraph [ref=e91]: LIGHTS ONE WORLD IN EVERY TURN.
        - button "RESET" [ref=e92] [cursor=pointer]
        - paragraph [ref=e93]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
      - paragraph [ref=e94]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e97]:
      - paragraph [ref=e98]: S02 · WHAT IS REAL, WHAT IS INVENTED
      - heading "What is real, what is invented." [level=2] [ref=e99]
      - generic [ref=e100]:
        - article [ref=e101]:
          - generic [ref=e102]: THE SEED
          - heading "The seed" [level=3] [ref=e112]
          - generic [ref=e114]:
            - paragraph [ref=e115]: xoshiro128** · splitmix32 · SEED 20261011
            - list "First eight u32 values, recomputed in your browser" [ref=e116]:
              - listitem [ref=e117]:
                - text: "3595447901"
                - generic [ref=e118]: ✓
              - listitem [ref=e119]:
                - text: "1865114723"
                - generic [ref=e120]: ✓
              - listitem [ref=e121]:
                - text: "2071441898"
                - generic [ref=e122]: ✓
              - listitem [ref=e123]:
                - text: "2576159172"
                - generic [ref=e124]: ✓
              - listitem [ref=e125]:
                - text: "126340258"
                - generic [ref=e126]: ✓
              - listitem [ref=e127]:
                - text: "2954739012"
                - generic [ref=e128]: ✓
              - listitem [ref=e129]:
                - text: "2461620194"
                - generic [ref=e130]: ✓
              - listitem [ref=e131]:
                - text: "2498548250"
                - generic [ref=e132]: ✓
            - 'img "64 seeded samples as bridges: sampling error pinned at both ends, widest at 50%" [ref=e133]'
            - paragraph [ref=e198]: SAMPLING ERROR IS WIDEST AT 50%
          - generic [ref=e199]: EVERY RANDOM NUMBER ON THIS SITE COMES FROM ONE GENERATOR AND ONE PUBLISHED SEED.
          - generic [ref=e200]: SYNTHETIC
        - article [ref=e203]:
          - generic [ref=e204]: SHAPES OF CHANCE
          - heading "Shapes of chance" [level=3] [ref=e214]
          - generic [ref=e216]:
            - img "normal density" [ref=e217]
            - img "lognormal density" [ref=e219]
            - img "beta density" [ref=e221]
            - img "gamma density" [ref=e223]
            - paragraph [ref=e225]: INTEGRATES TO 1 WITHIN 5.7E-12 ACROSS 14 CASES
          - generic [ref=e226]: FIVE DISTRIBUTIONS, COMPUTED FROM FIRST PRINCIPLES AND CHECKED AGAINST THE REFERENCE.
          - generic [ref=e227]: DERIVED
        - article [ref=e230]:
          - generic [ref=e231]: REAL APPLICANTS
          - heading "Real applicants" [level=3] [ref=e241]
          - generic [ref=e243]:
            - paragraph [ref=e244]: 1,000 ROWS · 600 TRAIN · 150 CALIBRATE · 250 TEST
            - table [ref=e245]:
              - rowgroup [ref=e246]:
                - row [ref=e247]:
                  - rowheader "APPROVE A BAD LOAN" [ref=e248]
                  - cell "5" [ref=e249]
                - row [ref=e250]:
                  - rowheader "REJECT A GOOD LOAN" [ref=e251]
                  - cell "1" [ref=e252]
                - row [ref=e253]:
                  - rowheader "APPROVE GOOD / REJECT BAD" [ref=e254]
                  - cell "0" [ref=e255]
            - paragraph [ref=e256]:
              - text: UCI · CC BY 4.0 · HOFMANN (1994) ·
              - link "DOI 10.24432/C5NC77" [ref=e257] [cursor=pointer]:
                - /url: https://doi.org/10.24432/C5NC77
          - generic [ref=e258]: 1,000 REAL LOAN APPLICATIONS FROM A GERMAN BANK, WITH A PUBLISHED COST FOR EACH KIND OF MISTAKE.
          - generic [ref=e259]: OBSERVED
        - article [ref=e262]:
          - generic [ref=e263]: REAL EARNINGS
          - tablist "Story progress" [ref=e264]:
            - tab "Card 1 of 4" [ref=e265] [cursor=pointer]
            - tab "Card 2 of 4" [ref=e267] [cursor=pointer]
            - tab "Card 3 of 4" [ref=e269] [cursor=pointer]
            - tab "Card 4 of 4" [selected] [ref=e271] [cursor=pointer]
          - heading "Real earnings" [level=3] [ref=e273]
          - generic [ref=e275]:
            - paragraph [ref=e276]: NSW 445 (185 TREATED, 260 CONTROL) · PSID 2,490
            - paragraph [ref=e277]:
              - link "NBER · ATTRIBUTABLE NON-COMMERCIAL USE" [ref=e278] [cursor=pointer]:
                - /url: https://users.nber.org/~rdehejia/nswdata2.html
            - list [ref=e279]:
              - listitem [ref=e280]: LaLonde, R. (1986). Evaluating the Econometric Evaluations of Training Programs. AER 76, 604-620.
              - listitem [ref=e281]: Dehejia, R. and Wahba, S. (1999). Causal Effects in Non-Experimental Studies. JASA 94(448), 1053-1062.
              - listitem [ref=e282]: Dehejia, R. and Wahba, S. (2002). Propensity Score Matching Methods for Non-Experimental Causal Studies. REStat 84, 151-161.
            - paragraph [ref=e283]: 15 EXACT DUPLICATE ROWS ARE REAL AND KEPT
          - generic [ref=e284]: A 1970s TRAINING EXPERIMENT AND A SURVEY OF PEOPLE WHO DID NOT TAKE PART.
          - generic [ref=e285]: OBSERVED
      - paragraph [ref=e288]: EVERYTHING ELSE ON THIS SITE IS SYNTHETIC AND SEEDED · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e291]:
      - generic [ref=e292]:
        - paragraph [ref=e293]: S03a · HOW MANY FUTURES ARE ENOUGH
        - heading "More futures do not make the future less uncertain. They make the average less uncertain." [level=2] [ref=e294]:
          - generic [ref=e295]: More
          - generic [ref=e296]: futures
          - generic [ref=e297]: do
          - generic [ref=e298]: not
          - generic [ref=e299]: make
          - generic [ref=e300]: the
          - generic [ref=e301]: future
          - generic [ref=e302]: less
          - generic [ref=e303]: uncertain.
          - generic [ref=e304]: They
          - generic [ref=e305]: make
          - generic [ref=e306]: the
          - generic [ref=e307]: average
          - generic [ref=e308]: less
          - generic [ref=e309]: uncertain.
        - generic [ref=e310]: SYNTHETIC
      - group "Controls and readouts" [ref=e312]:
        - radiogroup "FUTURES n" [ref=e313]:
          - generic [aria-hidden] [ref=e314]: FUTURES n
          - generic [ref=e315]:
            - radio "100" [ref=e316] [cursor=pointer]
            - radio "1,000" [ref=e317] [cursor=pointer]
            - radio "10,000" [ref=e318] [cursor=pointer]
            - radio "20,000" [checked] [ref=e319] [cursor=pointer]
            - radio "100,000" [ref=e320] [cursor=pointer]
        - generic [ref=e321]:
          - paragraph [ref=e322]: RUNNING IN YOUR BROWSER · SEED 20261011 · 114 MS · 1,200 DRAWN · STATISTICS FROM ALL 20,000
          - img "95% confidence interval of the mean 10.64 to 11.54" [ref=e323]
          - paragraph [ref=e324]: MEAN NPV 11.09 M USD · SE 0.229 · 95% CI 10.64 TO 11.54 · P(LOSS) 38.0% · SPREAD OF FUTURES (SD) 32.4
          - paragraph [ref=e325]: 100 X THE FUTURES · 10.1 X NARROWER (STANDARD ERROR, n 1,000 TO 100,000). THE SPREAD OF FUTURES DOES NOT SHRINK.
          - paragraph [ref=e326]: CONFIDENCE INTERVAL OF THE MEAN, NOT A RANGE FOR A SINGLE OUTCOME
        - button "RESET" [ref=e327] [cursor=pointer]
        - paragraph [ref=e328]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
      - paragraph [ref=e329]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e332]:
      - generic [ref=e333]:
        - paragraph [ref=e334]: S03b · LEARNING NARROWS A BELIEF
        - heading "Evidence narrows a belief." [level=2] [ref=e335]:
          - generic [ref=e336]: Evidence
          - generic [ref=e337]: narrows
          - generic [ref=e338]: a
          - generic [ref=e339]: belief.
        - generic [ref=e340]: SYNTHETIC
        - generic [ref=e342]:
          - paragraph [ref=e343]: "95% CREDIBLE INTERVAL · BAYESIAN CREDIBLE INTERVAL: P(PARAMETER IN INTERVAL | DATA, PRIOR) = 0.95"
          - paragraph [ref=e345]: "95% CONFIDENCE INTERVAL · FREQUENTIST CONFIDENCE INTERVAL: THE PROCEDURE COVERS THE TRUE VALUE IN 95% OF REPEATED SAMPLES"
      - generic [ref=e347]:
        - paragraph [ref=e348]: EXACT COVERAGE AT n 20, TRUE RATE 0.05 · 0.1 · 0.2 · 0.3 · 0.5
        - paragraph [ref=e349]: CREDIBLE (UNIFORM PRIOR) 92.5% · 95.7% · 95.6% · 97.5% · 95.9%
        - paragraph [ref=e350]: WILSON CONFIDENCE 92.5% · 95.7% · 95.6% · 97.5% · 95.9%
        - paragraph [ref=e351]: CREDIBLE, BETA(2,8) PRIOR 92.5% · 95.7% · 97.8% · 96.3% · 86.8%
        - paragraph [ref=e352]: "AT n 20 THE TWO PROCEDURES COVER THE SAME SET OF OUTCOMES, SO THE NUMBERS ARE EQUAL. THE STATEMENTS ARE STILL DIFFERENT: ONE IS A PROBABILITY GIVEN THE DATA, THE OTHER A LONG-RUN RATE."
        - paragraph [ref=e353]: AVERAGE CREDIBLE COVERAGE OVER A UNIFORM PRIOR 95.2% · PRECOMPUTED · PYTHON REFERENCE
      - group "Controls and readouts" [ref=e354]:
        - generic [ref=e355]:
          - generic [ref=e356]:
            - generic [ref=e357]: PRIOR
            - combobox "PRIOR" [ref=e358]:
              - option "BETA(1,1) UNIFORM" [selected]
              - option "BETA(0.5,0.5)"
              - option "BETA(2,8)"
              - option "BETA(5,5)"
              - option "BETA(20,20)"
          - button "SUCCESS" [ref=e359] [cursor=pointer]
          - button "FAILURE" [ref=e360] [cursor=pointer]
          - button "RESET" [ref=e361] [cursor=pointer]
        - generic [ref=e362]:
          - 'img "Belief column: time runs downward, each row one stage of evidence" [ref=e363]':
            - generic [ref=e364]: RATE 0
            - generic [ref=e365]: "1"
            - generic [ref=e366]: YOURS
          - paragraph [ref=e370]: "YOUR EVIDENCE: 0 SUCCESS IN 0 · POSTERIOR BETA(1, 1) · CREDIBLE 0.025 TO 0.975 · CONFIDENCE (WILSON) 0.000 TO 1.000 · RUNNING IN YOUR BROWSER"
      - paragraph [ref=e371]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e374]:
      - generic [ref=e375]:
        - paragraph [ref=e376]: S04 · THE TURN UNROLLS
        - heading "A forecast band is a promise. Count how often it keeps it." [level=2] [ref=e377]:
          - generic [ref=e378]: A
          - generic [ref=e379]: forecast
          - generic [ref=e380]: band
          - generic [ref=e381]: is
          - generic [ref=e382]: a
          - generic [ref=e383]: promise.
          - generic [ref=e384]: Count
          - generic [ref=e385]: how
          - generic [ref=e386]: often
          - generic [ref=e387]: it
          - generic [ref=e388]: keeps
          - generic [ref=e389]: it.
        - generic [ref=e390]:
          - generic [ref=e391]: SYNTHETIC
          - generic [ref=e393]: PREDICTED
          - generic [ref=e395]:
            - text: SIMULATED
            - generic [ref=e397]: · COVERAGE STUDY
      - generic:
        - 'img "Forecast: time runs downward; the series falls to now, then forecast paths with dashed prediction interval hairlines" [ref=e398]':
          - generic [ref=e455]: NOW
        - paragraph [ref=e456]: 95% INTERVAL COVERED 12 OF 12 HOLD-OUT VALUES (100%)
      - group "Controls and readouts" [ref=e457]:
        - generic [ref=e458]:
          - radiogroup "LEVEL" [ref=e459]:
            - generic [aria-hidden] [ref=e460]: LEVEL
            - generic [ref=e461]:
              - radio "80%" [ref=e462] [cursor=pointer]
              - radio "95%" [checked] [ref=e463] [cursor=pointer]
          - radiogroup "METHOD" [ref=e464]:
            - generic [aria-hidden] [ref=e465]: METHOD
            - generic [ref=e466]:
              - radio "AR(1)" [checked] [ref=e467] [cursor=pointer]
              - radio "SES" [ref=e468] [cursor=pointer]
        - paragraph [ref=e469]: 95% PREDICTION INTERVAL · A PREDICTION INTERVAL IS THE RANGE IN WHICH ONE SINGLE FUTURE OBSERVATION IS EXPECTED TO FALL WITH THE STATED PROBABILITY, IF THE MODEL IS RIGHT; IT IS WIDER THAN A CONFIDENCE INTERVAL FOR A MEAN AND IS NOT A CREDIBLE INTERVAL.
        - paragraph [ref=e470]: 95% INTERVAL COVERED 91.6% TO 94.5% OF 2,000 SIMULATED SERIES, HORIZONS 1 TO 12 · PRECOMPUTED · PYTHON REFERENCE
        - paragraph [ref=e471]: 40 SEEDED PATHS FROM THE FITTED AR(1) MODEL · SEED 20261018 · RUNNING IN YOUR BROWSER
        - paragraph [ref=e472]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
      - paragraph [ref=e473]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e476]:
      - generic [ref=e477]:
        - paragraph [ref=e478]: S05 · WHAT WOULD FLIP THE MODEL
        - heading "What would flip the model?" [level=2] [ref=e479]:
          - generic [ref=e480]: What
          - generic [ref=e481]: would
          - generic [ref=e482]: flip
          - generic [ref=e483]: the
          - generic [ref=e484]: model?
        - generic [ref=e485]:
          - generic [ref=e486]: OBSERVED
          - generic [ref=e488]: PREDICTED
      - generic [ref=e490]:
        - radiogroup "Applicant" [ref=e491]:
          - listitem [ref=e492]:
            - radio "APPLICANT 8" [checked] [ref=e493] [cursor=pointer]
          - listitem [ref=e494]:
            - radio "APPLICANT 16" [ref=e495] [cursor=pointer]
          - listitem [ref=e496]:
            - radio "APPLICANT 19" [ref=e497] [cursor=pointer]
          - listitem [ref=e498]:
            - radio "APPLICANT 55" [ref=e499] [cursor=pointer]
          - listitem [ref=e500]:
            - radio "APPLICANT 63" [ref=e501] [cursor=pointer]
          - listitem [ref=e502]:
            - radio "APPLICANT 77" [ref=e503] [cursor=pointer]
          - listitem [ref=e504]:
            - radio "APPLICANT 158" [ref=e505] [cursor=pointer]
          - listitem [ref=e506]:
            - radio "APPLICANT 167" [ref=e507] [cursor=pointer]
        - paragraph [ref=e508]: 36 MONTHS · 6,948 DM · 0 TO UNDER 200 DM · SAVINGS UNDER 100 DM
        - generic [ref=e509]:
          - paragraph [ref=e510]: TARGET 0.500 · P(BAD) 0.640 TO 0.499
          - list [ref=e511]:
            - listitem [ref=e512]: "SAVINGS ACCOUNT OR BONDS: UNDER 100 DM → 500 TO UNDER 1000 DM"
        - generic [ref=e513]:
          - paragraph [ref=e514]: TARGET 0.167 · P(BAD) 0.640 TO 0.148
          - list [ref=e515]:
            - listitem [ref=e516]: "CHECKING ACCOUNT: 0 TO UNDER 200 DM → NO CHECKING ACCOUNT"
            - listitem [ref=e517]: "LOAN DURATION (MONTHS): 36 → 30"
            - listitem [ref=e518]: "SAVINGS ACCOUNT OR BONDS: UNDER 100 DM → 1000 DM OR MORE"
        - paragraph [ref=e519]: "CANNOT CHANGE: AGE (YEARS) 35 · CREDIT HISTORY EXISTING CREDITS PAID BACK DULY SO FAR · PRESENT EMPLOYMENT 1 TO UNDER 4 YEARS · HOUSING RENT · EXISTING CREDITS AT THIS BANK 1"
        - paragraph [ref=e520]: MODEL COUNTERFACTUAL · NOT A CAUSAL CLAIM · WHAT FLIPS THIS MODEL, NOT WHAT CHANGES A LIFE
      - group "Controls and readouts" [ref=e521]
      - paragraph [ref=e522]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · UCI GERMAN CREDIT · CC BY 4.0 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e525]:
      - generic [ref=e526]:
        - paragraph [ref=e527]: S06 · WHAT MATTERS
        - heading "Some trade-offs are efficient. Most inputs are not what matters." [level=2] [ref=e528]:
          - generic [ref=e529]: Some
          - generic [ref=e530]: trade-offs
          - generic [ref=e531]: are
          - generic [ref=e532]: efficient.
          - generic [ref=e533]: Most
          - generic [ref=e534]: inputs
          - generic [ref=e535]: are
          - generic [ref=e536]: not
          - generic [ref=e537]: what
          - generic [ref=e538]: matters.
        - generic [ref=e539]:
          - generic [ref=e540]: DERIVED
          - generic [ref=e542]: SIMULATED
      - img "Variance split of the Ishigami function into first-order shares and interactions" [ref=e544]:
        - generic [ref=e545]:
          - generic [ref=e548]: S1 x1 0.314
          - generic [ref=e550]: 10 REPLICATES · MEAN 0.29
        - generic [ref=e551]:
          - generic [ref=e554]: S2 x2 0.442
          - generic [ref=e556]: 10 REPLICATES · MEAN 0.47
        - generic [ref=e557]:
          - generic [ref=e559]: S3 x3 0.000
          - generic [ref=e561]: 10 REPLICATES · MEAN -0.00
        - generic [ref=e562]: INTERACTIONS 0.244
      - group "Controls and readouts" [ref=e566]:
        - generic [ref=e567]:
          - radiogroup "N" [ref=e568]:
            - generic [aria-hidden] [ref=e569]: "N"
            - generic [ref=e570]:
              - radio "256" [ref=e571] [cursor=pointer]
              - radio "1,024" [checked] [ref=e572] [cursor=pointer]
              - radio "4,096" [ref=e573] [cursor=pointer]
              - radio "16,384" [ref=e574] [cursor=pointer]
          - button "RESET" [ref=e575] [cursor=pointer]
        - paragraph [ref=e576]: RUNNING IN YOUR BROWSER · SEED 20261011 · N 1,024 · 1 MS · S1 0.234 · 0.514 · -0.031 · TOTAL 0.520 · 0.450 · 0.273 · NO PUBLISHED VECTOR FOR SEED 20261011 AT N 1,024 · COMPUTED IN YOUR BROWSER
        - paragraph [ref=e577]: "ANALYTIC INDICES (WHITE BARS): S1 0.314 · 0.442 · 0.000 · TOTAL 0.558 · 0.442 · 0.244. x3 HAS NO FIRST-ORDER SHARE AND A LARGE TOTAL: IT MATTERS ONLY THROUGH x1."
      - paragraph [ref=e578]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · ISHIGAMI AND HOMMA (1990) · SALTELLI ET AL. (2008) · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e581]:
      - paragraph [ref=e582]: S07 · SEVEN OBJECTIONS
      - heading "How we know." [level=2] [ref=e583]
      - generic [ref=e584]:
        - generic [ref=e585]:
          - paragraph [ref=e586]: Are the numbers checked?
          - paragraph [ref=e588]: "71 of 71 checks pass. Failures recorded: none."
        - generic [ref=e589]:
          - paragraph [ref=e590]: Is any of this real?
          - paragraph [ref=e592]: Only the German applicants and the NSW and PSID earnings are observed. Every other future on this site is synthetic and seeded.
        - generic [ref=e593]:
          - paragraph [ref=e594]: Who made the data?
          - paragraph [ref=e596]: "LaLonde, R. (1986). Evaluating the Econometric Evaluations of Training Programs. AER 76, 604-620. Dehejia, R. and Wahba, S. (1999). Causal Effects in Non-Experimental Studies. JASA 94(448), 1053-1062. Dehejia, R. and Wahba, S. (2002). Propensity Score Matching Methods for Non-Experimental Causal Studies. REStat 84, 151-161. Credit data: Hofmann (1994), UCI, CC BY 4.0."
      - paragraph [ref=e597]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e601]:
      - generic [ref=e602]:
        - paragraph [ref=e603]: THE LAB · TEN INSTRUMENTS
        - heading "Ten instruments, in your browser." [level=2] [ref=e604]
      - generic [ref=e605]:
        - generic [ref=e606]:
          - text: SEED
          - textbox "SEED" [ref=e607]: "20261011"
        - radiogroup "DECISION" [ref=e608]:
          - generic [aria-hidden] [ref=e609]: DECISION
          - generic [ref=e610]:
            - radio "BUILD NOW" [checked] [ref=e611] [cursor=pointer]
            - radio "PHASED" [ref=e612] [cursor=pointer]
            - radio "DELAY ONE YEAR" [ref=e613] [cursor=pointer]
        - generic [ref=e614]:
          - generic [ref=e615]: INVESTMENT MEDIAN 100 M USD
          - slider "INVESTMENT MEDIAN 100 M USD" [ref=e616]: "100"
        - generic [ref=e617]:
          - generic [ref=e618]: REVENUE MULTIPLIER 1.00
          - slider "REVENUE MULTIPLIER 1.00" [ref=e619]: "1"
        - generic [ref=e620]:
          - generic [ref=e621]: DELAY 0 YEARS
          - slider "DELAY 0 YEARS" [ref=e622]: "0"
        - generic [ref=e623]:
          - button "RUN ALL TEN" [ref=e624] [cursor=pointer]
          - button "RESET" [ref=e625] [cursor=pointer]
        - generic [ref=e626]:
          - generic [ref=e627]:
            - generic [ref=e628]: THREAD, SORTED BY FINAL NPV
            - slider "THREAD, SORTED BY FINAL NPV" [ref=e629]: "0"
          - paragraph [ref=e630]: LIGHTS ONE WORLD IN EVERY TURN.
        - paragraph [ref=e631]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
      - list [ref=e632]:
        - listitem [ref=e633]:
          - generic [ref=e634]:
            - generic [ref=e635]: 1 · DISTRIBUTIONS
            - generic [ref=e636]: DERIVED
            - button "RUN IN YOUR BROWSER" [ref=e638] [cursor=pointer]
          - paragraph [ref=e639]: DETERMINISTIC · NO SEED
        - listitem [ref=e640]:
          - generic [ref=e641]:
            - generic [ref=e642]: 2 · SAMPLING
            - generic [ref=e643]: SYNTHETIC
            - button "RUN IN YOUR BROWSER" [ref=e645] [cursor=pointer]
          - paragraph [ref=e646]: DRIVEN BY THE SEED FIELD
        - listitem [ref=e647]:
          - generic [ref=e648]:
            - generic [ref=e649]: 3 · MONTE CARLO
            - generic [ref=e650]: SYNTHETIC
            - button "RUN IN YOUR BROWSER" [ref=e652] [cursor=pointer]
          - paragraph [ref=e653]: DRIVEN BY THE SEED FIELD
        - listitem [ref=e654]:
          - generic [ref=e655]:
            - generic [ref=e656]: 4 · CONJUGATE BAYES
            - generic [ref=e657]: SYNTHETIC
            - button "RUN IN YOUR BROWSER" [ref=e659] [cursor=pointer]
          - paragraph [ref=e660]: DRIVEN BY THE SEED FIELD
        - listitem [ref=e661]:
          - generic [ref=e662]:
            - generic [ref=e663]: 5 · FORECAST INTERVALS
            - generic [ref=e664]:
              - text: SYNTHETIC
              - generic [ref=e666]: · PREDICTED
            - button "RUN IN YOUR BROWSER" [ref=e667] [cursor=pointer]
          - paragraph [ref=e668]: DETERMINISTIC · NO SEED
        - listitem [ref=e669]:
          - generic [ref=e670]:
            - generic [ref=e671]: 6 · COST-SENSITIVE THRESHOLDS
            - generic [ref=e672]:
              - text: OBSERVED
              - generic [ref=e674]: · PREDICTED
            - button "RUN IN YOUR BROWSER" [ref=e675] [cursor=pointer]
          - paragraph [ref=e676]: DETERMINISTIC · NO SEED
        - listitem [ref=e677]:
          - generic [ref=e678]:
            - generic [ref=e679]: 7 · LP AND PARETO
            - generic [ref=e680]:
              - text: SYNTHETIC
              - generic [ref=e682]: · DERIVED
            - button "RUN IN YOUR BROWSER" [ref=e683] [cursor=pointer]
          - paragraph [ref=e684]: DETERMINISTIC · NO SEED
        - listitem [ref=e685]:
          - generic [ref=e686]:
            - generic [ref=e687]: 8 · SENSITIVITY
            - generic [ref=e688]: DERIVED
            - button "RUN IN YOUR BROWSER" [ref=e690] [cursor=pointer]
          - paragraph [ref=e691]: DRIVEN BY THE SEED FIELD
        - listitem [ref=e692]:
          - generic [ref=e693]:
            - generic [ref=e694]: 9 · COUNTERFACTUALS
            - generic [ref=e695]:
              - text: OBSERVED
              - generic [ref=e697]: · PREDICTED
            - button "RUN IN YOUR BROWSER" [ref=e698] [cursor=pointer]
          - paragraph [ref=e699]: DETERMINISTIC · NO SEED
        - listitem [ref=e700]:
          - generic [ref=e701]:
            - generic [ref=e702]: 10 · CAUSAL
            - generic [ref=e703]:
              - text: OBSERVED
              - generic [ref=e705]: · DERIVED
            - button "RUN IN YOUR BROWSER" [ref=e706] [cursor=pointer]
          - paragraph [ref=e707]: DRIVEN BY THE SEED FIELD
      - paragraph [ref=e708]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e711]:
      - heading "Every decision creates a different future." [level=2] [ref=e712]:
        - generic [ref=e713]: Every
        - generic [ref=e714]: decision
        - generic [ref=e715]: creates
        - generic [ref=e716]: a
        - generic [ref=e717]: different
        - generic [ref=e718]: future.
      - paragraph [ref=e719]: "YOUR DECISION: BUILD NOW · SEED 20261011 · 62% CLOSE THE TURN"
      - generic [ref=e720]:
        - button "REPLAY" [ref=e721] [cursor=pointer]
        - button "RESET" [ref=e722] [cursor=pointer]
      - list [ref=e723]:
        - listitem [ref=e724]:
          - link "SOURCE" [ref=e725] [cursor=pointer]:
            - /url: https://github.com/mrrishit909/decision-universe
        - listitem [ref=e726]:
          - link "LIMITATIONS" [ref=e727] [cursor=pointer]:
            - /url: https://github.com/mrrishit909/decision-universe/blob/main/docs/LIMITATIONS.md
      - paragraph [ref=e729]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
```

# Test source

```ts
  213 |   await goScene(page, "unchosen", 0.97);
  214 |   await expect(page.locator("#unchosen [data-argstack] .ex")).toHaveCount(3);
  215 |   await ctx.close();
  216 | });
  217 | 
  218 | test("THE LAB: all ten match at the published seed; another seed says NO PUBLISHED VECTOR and PRECOMPUTED rows do not move", async ({ browser }) => {
  219 |   const { ctx, page } = await at(browser, VP(1440, 900));
  220 |   await openSite(page);
  221 |   await goScene(page, "lab", 0);
  222 |   await page.getByRole("button", { name: "RUN ALL TEN" }).click();
  223 |   await expect(page.locator("#lab [data-parity=match]")).toHaveCount(10, { timeout: 90000 });
  224 |   const before = await page.locator("#lab [data-module=m06] .inst-out").innerText();
  225 |   const input = page.locator("#lab input.rail-input");
  226 |   await input.fill("7");
  227 |   await input.press("Enter");
  228 |   await page.waitForTimeout(500);
  229 |   await page.getByRole("button", { name: "RUN ALL TEN" }).click();
  230 |   await expect(page.locator("#lab [data-module=m03] [data-parity=novector]")).toContainText("NO PUBLISHED VECTOR FOR SEED 7", { timeout: 60000 });
  231 |   await expect(page.locator("#lab [data-module=m06] .inst-out")).toContainText("PRECOMPUTED");
  232 |   const after = await page.locator("#lab [data-module=m06] .inst-out").innerText();
  233 |   expect(after.replace(/[\d.]+ MS/, "")).toBe(before.replace(/[\d.]+ MS/, ""));
  234 |   expect(await page.evaluate(() => (window as any).__du.view().seed)).toBe(7);
  235 |   // the seed changed the threads and the S08 line
  236 |   await goScene(page, "closing", 0.7);
  237 |   await expect(page.locator("#closing [data-yours]")).toContainText("SEED 7");
  238 |   await ctx.close();
  239 | });
  240 | 
  241 | test("worker failure: the same numbers are computed on the main thread and labelled", async ({ browser }) => {
  242 |   const { ctx, page } = await at(browser, VP(1440, 900));
  243 |   await page.goto("?fail=worker");
  244 |   await page.waitForFunction(() => (window as any).__du && (window as any).__du.view().packN > 0);
  245 |   await page.waitForTimeout(500);
  246 |   expect((await text(page))).toContain("RUNNING IN YOUR BROWSER (MAIN THREAD)");
  247 |   const p = await pack(page);
  248 |   expect(Math.abs(p.decisions[0].mean - J<any>("m03_montecarlo.json").run.mean)).toBeLessThan(1e-7);
  249 |   await ctx.close();
  250 | });
  251 | 
  252 | test("zero external requests and zero console errors across every scene", async ({ browser }) => {
  253 |   const { ctx, page } = await at(browser, VP(1440, 900));
  254 |   const ext: string[] = [], errs: string[] = [];
  255 |   page.on("request", (r) => { if (!r.url().startsWith("http://localhost:4401") && !r.url().startsWith("data:") && !r.url().startsWith("blob:")) ext.push(r.url()); });
  256 |   page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  257 |   page.on("pageerror", (e) => errs.push(String(e)));
  258 |   await openSite(page);
  259 |   for (const [id, p] of WALK) await goScene(page, id, p);
  260 |   expect(ext).toEqual([]);
  261 |   expect(errs).toEqual([]);
  262 |   await ctx.close();
  263 | });
  264 | 
  265 | test("route-blocked m04_bayes.json: error line with RETRY, then recovery", async ({ browser }) => {
  266 |   const { ctx, page } = await at(browser, VP(1440, 900));
  267 |   let block = true;
  268 |   await page.route("**/m04_bayes.json", (r) => (block ? r.fulfill({ status: 500, body: "x" }) : r.continue()));
  269 |   await openSite(page);
  270 |   await goScene(page, "learning", 0.3);
  271 |   await expect(page.locator("#learning")).toContainText(/COULD NOT LOAD/i, { timeout: 8000 });
  272 |   block = false;
  273 |   await page.locator("#learning").getByRole("button", { name: "RETRY" }).first().click();
  274 |   await expect(page.locator("#learning [data-live]")).toBeVisible({ timeout: 8000 });
  275 |   await expect(page.locator("#learning [data-row]").first()).toBeVisible({ timeout: 8000 });
  276 |   await ctx.close();
  277 | });
  278 | 
  279 | test("copy rules: no dash characters, no AI or smart or intelligent, in any scene", async ({ browser }) => {
  280 |   const { ctx, page } = await at(browser, VP(1440, 900));
  281 |   await openSite(page);
  282 |   let all = "";
  283 |   for (const [id, p] of WALK) { await goScene(page, id, p); all += "\n" + (await text(page)); }
  284 |   expect(all).not.toMatch(/[\u2014\u2015]/);
  285 |   expect(all).not.toMatch(/\b(AI|smart|intelligent)\b/i);
  286 |   expect(all).not.toMatch(/predicts the future/i);
  287 |   await ctx.close();
  288 | });
  289 | 
  290 | for (const vp of [VP(1440, 900), VP(1280, 720), VP(768, 1024), VP(390, 844), VP(375, 812), VP(360, 800)]) {
  291 |   test(`whole-document collision walk and text floor at ${vp.width}x${vp.height}`, async ({ browser }) => {
  292 |     const { ctx, page } = await at(browser, vp);
  293 |     await openSite(page);
  294 |     const bad: string[] = [];
  295 |     for (const [id, p] of WALK) {
  296 |       await goScene(page, id, p);
  297 |       for (const x of await collideAll(page)) bad.push(`${id}@${p}: ${x}`);
  298 |       const small = await page.evaluate(() => {
  299 |         const out: string[] = [], w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  300 |         for (let n = w.nextNode(); n; n = w.nextNode()) {
  301 |           const el = n.parentElement!;
  302 |           if (!n.textContent?.trim() || el.closest(".sr-only, script, style, [aria-hidden=true], svg")) continue;
  303 |           const r = el.getBoundingClientRect();
  304 |           if (r.width < 1 || r.bottom < 0 || r.top > innerHeight) continue;
  305 |           const cs = getComputedStyle(el);
  306 |           if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.3) continue;
  307 |           if (parseFloat(cs.fontSize) < 9.49) out.push(`${n.textContent!.trim().slice(0, 24)} ${cs.fontSize}`);
  308 |         }
  309 |         return out;
  310 |       });
  311 |       for (const s of small) bad.push(`${id}@${p} small: ${s}`);
  312 |     }
> 313 |     expect(bad).toEqual([]);
      |                 ^ Error: expect(received).toEqual(expected) // deep equality
  314 |     await ctx.close();
  315 |   });
  316 | }
  317 | 
  318 | test("no sideways scroll at 1440, 1024, 768, 390, 360 in every scene", async ({ browser }) => {
  319 |   const bad: string[] = [];
  320 |   for (const w of [1440, 1024, 768, 390, 360]) {
  321 |     const { ctx, page } = await at(browser, VP(w, w < 768 ? 800 : 900));
  322 |     await openSite(page);
  323 |     for (const [id, p] of WALK) {
  324 |       await goScene(page, id, p);
  325 |       const sw = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
  326 |       if (sw > w) bad.push(`${w} ${id}@${p}: ${sw}`);
  327 |     }
  328 |     await ctx.close();
  329 |   }
  330 |   expect(bad).toEqual([]);
  331 | });
  332 | 
  333 | const CONTRAST_SCENES: [string, number][] = [["turn", 0.8], ["another", 0.65], ["real", 0.45], ["enough", 0.5], ["learning", 0.5], ["unroll", 0.8], ["line", 0.2], ["line", 0.85], ["trade", 0.2], ["trade", 0.8], ["unchosen", 0.3], ["unchosen", 0.97], ["lab", 0], ["closing", 0.95]];
  334 | test("pixel contrast >= 4.5:1 (3:1 large) for visible text at 1440 and 390", async ({ browser }) => {
  335 |   const bad: string[] = [];
  336 |   for (const vp of [VP(1440, 900), VP(390, 844)]) {
  337 |     const { ctx, page } = await at(browser, vp);
  338 |     await openSite(page);
  339 |     for (const [id, p] of CONTRAST_SCENES) {
  340 |       await goScene(page, id, p);
  341 |       for (const f of await contrastFails(page)) bad.push(`${vp.width} ${id}@${p}: ${f}`);
  342 |     }
  343 |     await ctx.close();
  344 |   }
  345 |   expect(bad).toEqual([]);
  346 | });
  347 | 
  348 | test("axe: no serious or critical violations, motion and reduced motion", async ({ browser }) => {
  349 |   for (const reduced of [false, true]) {
  350 |     const { ctx, page } = await at(browser, VP(1440, 900), { reduced });
  351 |     await openSite(page);
  352 |     for (const [id, p] of CONTRAST_SCENES) {
  353 |       await goScene(page, id, p);
  354 |       const r = await new AxeBuilder({ page }).analyze();
  355 |       const bad = r.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${id} ${v.id}: ${v.nodes.slice(0, 2).map((n) => n.target.join(" ")).join(" | ")}`);
  356 |       expect(bad, `reduced=${reduced}`).toEqual([]);
  357 |     }
  358 |     await ctx.close();
  359 |   }
  360 | });
  361 | 
  362 | test("reduced motion: scenes render in flow with their content and no intro", async ({ browser }) => {
  363 |   const { ctx, page } = await at(browser, VP(1440, 900), { reduced: true });
  364 |   await openSite(page);
  365 |   expect(await page.evaluate(() => document.documentElement.dataset.motion)).toBe("off");
  366 |   expect(await text(page)).toContain("Every decision creates a different future.");
  367 |   for (const id of ["another", "real", "enough", "learning", "unroll", "line", "trade", "unchosen", "lab", "closing"]) expect(await page.locator(`#${id}`).count()).toBe(1);
  368 |   await ctx.close();
  369 | });
  370 | 
```