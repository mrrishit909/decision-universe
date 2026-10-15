# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: qa.spec.ts >> whole-document collision walk and text floor at 1440x900
- Location: e2e/qa.spec.ts:291:3

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 16

- Array []
+ Array [
+   "another@0.1: pinned: \"SYNTHETIC\" x \"BUILD NOW\"",
+   "another@0.1: pinned: \"SYNTHETIC\" x \"PHASED\"",
+   "another@0.1: pinned: \"SYNTHETIC\" x \"DELAY ONE YEAR\"",
+   "another@0.1: pinned: \"SYNTHETIC\" x \"Controls and readouts\"",
+   "another@0.1: pinned: \"BUILD NOW\" x \"SYNTHETIC\"",
+   "another@0.1: pinned: \"PHASED\" x \"SYNTHETIC\"",
+   "another@0.1: pinned: \"DELAY ONE YEAR\" x \"SYNTHETIC\"",
+   "another@0.45: pinned: \"SYNTHETIC\" x \"BUILD NOW\"",
+   "another@0.45: pinned: \"SYNTHETIC\" x \"PHASED\"",
+   "another@0.45: pinned: \"SYNTHETIC\" x \"DELAY ONE YEAR\"",
+   "another@0.45: pinned: \"SYNTHETIC\" x \"Controls and readouts\"",
+   "another@0.45: pinned: \"BUILD NOW\" x \"SYNTHETIC\"",
+   "another@0.45: pinned: \"PHASED\" x \"SYNTHETIC\"",
+   "another@0.45: pinned: \"DELAY ONE YEAR\" x \"SYNTHETIC\"",
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
        - paragraph [ref=e65]: EACH LINE IS ONE SIMULATED WORLD. UNDER BOTH DECISIONS IT MEETS THE SAME LUCK; ONLY THE CHOICE DIFFERS.
        - generic [ref=e66]: SYNTHETIC
      - group "Controls and readouts" [ref=e68]:
        - radiogroup "DECISION B" [ref=e69]:
          - generic [aria-hidden] [ref=e70]: DECISION B
          - generic [ref=e71]:
            - radio "BUILD NOW" [ref=e72] [cursor=pointer]
            - radio "PHASED" [checked] [ref=e73] [cursor=pointer]
            - radio "DELAY ONE YEAR" [ref=e74] [cursor=pointer]
        - list [ref=e75]:
          - listitem [ref=e76]:
            - generic [ref=e77]: A · BUILD NOW
            - generic [ref=e78]: MEAN NPV 11.1 M USD · P(LOSS) 38.0% · MEDIAN PAYBACK YEAR 6.2
            - img "95% confidence interval of the mean 10.64 to 11.54" [ref=e79]
            - generic [ref=e80]: 95% CONFIDENCE INTERVAL OF THE MEAN 10.64 TO 11.54
          - listitem [ref=e81]:
            - generic [ref=e82]: B · PHASED
            - generic [ref=e83]: MEAN NPV 13.4 M USD · P(LOSS) 29.9% · MEDIAN PAYBACK YEAR 6.0
            - img "95% confidence interval of the mean 13.04 to 13.71" [ref=e84]
            - generic [ref=e85]: 95% CONFIDENCE INTERVAL OF THE MEAN 13.04 TO 13.71
        - paragraph [ref=e86]: THE PROCEDURE BEHIND THE BRACKETS COVERS THE TRUE MEAN IN 95% OF REPEATED RUNS.
        - paragraph [ref=e87]: "COMMON RANDOM NUMBERS: SAME 20,000 WORLDS, SAME SEED 20261011"
        - generic [ref=e88]:
          - generic [ref=e89]:
            - generic [ref=e90]: THREAD, SORTED BY FINAL NPV
            - slider "THREAD, SORTED BY FINAL NPV" [ref=e91]: "0"
          - paragraph [ref=e92]: LIGHTS ONE WORLD IN EVERY TURN.
        - button "RESET" [ref=e93] [cursor=pointer]
        - paragraph [ref=e94]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
      - paragraph [ref=e95]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e98]:
      - paragraph [ref=e99]: S02 · WHAT IS REAL, WHAT IS INVENTED
      - heading "What is real, what is invented." [level=2] [ref=e100]
      - generic [ref=e101]:
        - article [ref=e102]:
          - generic [ref=e103]: THE SEED
          - heading "The seed" [level=3] [ref=e113]
          - generic [ref=e115]:
            - paragraph [ref=e116]: xoshiro128** · splitmix32 · SEED 20261011
            - list "First eight u32 values, recomputed in your browser" [ref=e117]:
              - listitem [ref=e118]:
                - text: "3595447901"
                - generic [ref=e119]: ✓
              - listitem [ref=e120]:
                - text: "1865114723"
                - generic [ref=e121]: ✓
              - listitem [ref=e122]:
                - text: "2071441898"
                - generic [ref=e123]: ✓
              - listitem [ref=e124]:
                - text: "2576159172"
                - generic [ref=e125]: ✓
              - listitem [ref=e126]:
                - text: "126340258"
                - generic [ref=e127]: ✓
              - listitem [ref=e128]:
                - text: "2954739012"
                - generic [ref=e129]: ✓
              - listitem [ref=e130]:
                - text: "2461620194"
                - generic [ref=e131]: ✓
              - listitem [ref=e132]:
                - text: "2498548250"
                - generic [ref=e133]: ✓
            - 'img "64 seeded samples as bridges: sampling error pinned at both ends, widest at 50%" [ref=e134]'
            - paragraph [ref=e199]: SAMPLING ERROR IS WIDEST AT 50%
          - generic [ref=e200]: EVERY RANDOM NUMBER ON THIS SITE COMES FROM ONE GENERATOR AND ONE PUBLISHED SEED.
          - generic [ref=e201]: SYNTHETIC
        - article [ref=e204]:
          - generic [ref=e205]: SHAPES OF CHANCE
          - heading "Shapes of chance" [level=3] [ref=e215]
          - generic [ref=e217]:
            - img "normal density" [ref=e218]
            - img "lognormal density" [ref=e220]
            - img "beta density" [ref=e222]
            - img "gamma density" [ref=e224]
            - paragraph [ref=e226]: INTEGRATES TO 1 WITHIN 5.7E-12 ACROSS 14 CASES
          - generic [ref=e227]: FIVE DISTRIBUTIONS, COMPUTED FROM FIRST PRINCIPLES AND CHECKED AGAINST THE REFERENCE.
          - generic [ref=e228]: DERIVED
        - article [ref=e231]:
          - generic [ref=e232]: REAL APPLICANTS
          - heading "Real applicants" [level=3] [ref=e242]
          - generic [ref=e244]:
            - paragraph [ref=e245]: 1,000 ROWS · 600 TRAIN · 150 CALIBRATE · 250 TEST
            - table [ref=e246]:
              - rowgroup [ref=e247]:
                - row [ref=e248]:
                  - rowheader "APPROVE A BAD LOAN" [ref=e249]
                  - cell "5" [ref=e250]
                - row [ref=e251]:
                  - rowheader "REJECT A GOOD LOAN" [ref=e252]
                  - cell "1" [ref=e253]
                - row [ref=e254]:
                  - rowheader "APPROVE GOOD / REJECT BAD" [ref=e255]
                  - cell "0" [ref=e256]
            - paragraph [ref=e257]:
              - text: UCI · CC BY 4.0 · HOFMANN (1994) ·
              - link "DOI 10.24432/C5NC77" [ref=e258] [cursor=pointer]:
                - /url: https://doi.org/10.24432/C5NC77
          - generic [ref=e259]: 1,000 REAL LOAN APPLICATIONS FROM A GERMAN BANK, WITH A PUBLISHED COST FOR EACH KIND OF MISTAKE.
          - generic [ref=e260]: OBSERVED
        - article [ref=e263]:
          - generic [ref=e264]: REAL EARNINGS
          - tablist "Story progress" [ref=e265]:
            - tab "Card 1 of 4" [ref=e266] [cursor=pointer]
            - tab "Card 2 of 4" [ref=e268] [cursor=pointer]
            - tab "Card 3 of 4" [ref=e270] [cursor=pointer]
            - tab "Card 4 of 4" [selected] [ref=e272] [cursor=pointer]
          - heading "Real earnings" [level=3] [ref=e274]
          - generic [ref=e276]:
            - paragraph [ref=e277]: NSW 445 (185 TREATED, 260 CONTROL) · PSID 2,490
            - paragraph [ref=e278]:
              - link "NBER · ATTRIBUTABLE NON-COMMERCIAL USE" [ref=e279] [cursor=pointer]:
                - /url: https://users.nber.org/~rdehejia/nswdata2.html
            - list [ref=e280]:
              - listitem [ref=e281]: LaLonde, R. (1986). Evaluating the Econometric Evaluations of Training Programs. AER 76, 604-620.
              - listitem [ref=e282]: Dehejia, R. and Wahba, S. (1999). Causal Effects in Non-Experimental Studies. JASA 94(448), 1053-1062.
              - listitem [ref=e283]: Dehejia, R. and Wahba, S. (2002). Propensity Score Matching Methods for Non-Experimental Causal Studies. REStat 84, 151-161.
            - paragraph [ref=e284]: 15 EXACT DUPLICATE ROWS ARE REAL AND KEPT
          - generic [ref=e285]: A 1970s TRAINING EXPERIMENT AND A SURVEY OF PEOPLE WHO DID NOT TAKE PART.
          - generic [ref=e286]: OBSERVED
      - paragraph [ref=e289]: EVERYTHING ELSE ON THIS SITE IS SYNTHETIC AND SEEDED · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e292]:
      - generic [ref=e293]:
        - paragraph [ref=e294]: S03a · HOW MANY FUTURES ARE ENOUGH
        - heading "More futures do not make the future less uncertain. They make the average less uncertain." [level=2] [ref=e295]:
          - generic [ref=e296]: More
          - generic [ref=e297]: futures
          - generic [ref=e298]: do
          - generic [ref=e299]: not
          - generic [ref=e300]: make
          - generic [ref=e301]: the
          - generic [ref=e302]: future
          - generic [ref=e303]: less
          - generic [ref=e304]: uncertain.
          - generic [ref=e305]: They
          - generic [ref=e306]: make
          - generic [ref=e307]: the
          - generic [ref=e308]: average
          - generic [ref=e309]: less
          - generic [ref=e310]: uncertain.
        - generic [ref=e311]: SYNTHETIC
      - group "Controls and readouts" [ref=e313]:
        - radiogroup "FUTURES n" [ref=e314]:
          - generic [aria-hidden] [ref=e315]: FUTURES n
          - generic [ref=e316]:
            - radio "100" [ref=e317] [cursor=pointer]
            - radio "1,000" [ref=e318] [cursor=pointer]
            - radio "10,000" [ref=e319] [cursor=pointer]
            - radio "20,000" [checked] [ref=e320] [cursor=pointer]
            - radio "100,000" [ref=e321] [cursor=pointer]
        - generic [ref=e322]:
          - paragraph [ref=e323]: RUNNING IN YOUR BROWSER · SEED 20261011 · 129 MS · 1,200 DRAWN · STATISTICS FROM ALL 20,000
          - img "95% confidence interval of the mean 10.64 to 11.54" [ref=e324]
          - paragraph [ref=e325]: MEAN NPV 11.09 M USD · SE 0.229 · 95% CI 10.64 TO 11.54 · P(LOSS) 38.0% · SPREAD OF FUTURES (SD) 32.4
          - paragraph [ref=e326]: 100 X THE FUTURES · 10.1 X NARROWER (STANDARD ERROR, n 1,000 TO 100,000). THE SPREAD OF FUTURES DOES NOT SHRINK.
          - paragraph [ref=e327]: CONFIDENCE INTERVAL OF THE MEAN, NOT A RANGE FOR A SINGLE OUTCOME
        - button "RESET" [ref=e328] [cursor=pointer]
        - paragraph [ref=e329]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
      - paragraph [ref=e330]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e333]:
      - generic [ref=e334]:
        - paragraph [ref=e335]: S03b · LEARNING NARROWS A BELIEF
        - heading "Evidence narrows a belief." [level=2] [ref=e336]:
          - generic [ref=e337]: Evidence
          - generic [ref=e338]: narrows
          - generic [ref=e339]: a
          - generic [ref=e340]: belief.
        - generic [ref=e341]: SYNTHETIC
        - generic [ref=e343]:
          - paragraph [ref=e344]: "95% CREDIBLE INTERVAL · BAYESIAN CREDIBLE INTERVAL: P(PARAMETER IN INTERVAL | DATA, PRIOR) = 0.95"
          - paragraph [ref=e346]: "95% CONFIDENCE INTERVAL · FREQUENTIST CONFIDENCE INTERVAL: THE PROCEDURE COVERS THE TRUE VALUE IN 95% OF REPEATED SAMPLES"
      - generic [ref=e348]:
        - paragraph [ref=e349]: EXACT COVERAGE AT n 20, TRUE RATE 0.05 · 0.1 · 0.2 · 0.3 · 0.5
        - paragraph [ref=e350]: CREDIBLE (UNIFORM PRIOR) 92.5% · 95.7% · 95.6% · 97.5% · 95.9%
        - paragraph [ref=e351]: WILSON CONFIDENCE 92.5% · 95.7% · 95.6% · 97.5% · 95.9%
        - paragraph [ref=e352]: CREDIBLE, BETA(2,8) PRIOR 92.5% · 95.7% · 97.8% · 96.3% · 86.8%
        - paragraph [ref=e353]: "AT n 20 THE TWO PROCEDURES COVER THE SAME SET OF OUTCOMES, SO THE NUMBERS ARE EQUAL. THE STATEMENTS ARE STILL DIFFERENT: ONE IS A PROBABILITY GIVEN THE DATA, THE OTHER A LONG-RUN RATE."
        - paragraph [ref=e354]: AVERAGE CREDIBLE COVERAGE OVER A UNIFORM PRIOR 95.2% · PRECOMPUTED · PYTHON REFERENCE
      - group "Controls and readouts" [ref=e355]:
        - generic [ref=e356]:
          - generic [ref=e357]:
            - generic [ref=e358]: PRIOR
            - combobox "PRIOR" [ref=e359]:
              - option "BETA(1,1) UNIFORM" [selected]
              - option "BETA(0.5,0.5)"
              - option "BETA(2,8)"
              - option "BETA(5,5)"
              - option "BETA(20,20)"
          - button "SUCCESS" [ref=e360] [cursor=pointer]
          - button "FAILURE" [ref=e361] [cursor=pointer]
          - button "RESET" [ref=e362] [cursor=pointer]
        - generic [ref=e363]:
          - 'img "Belief column: time runs downward, each row one stage of evidence" [ref=e364]':
            - generic [ref=e365]: RATE 0
            - generic [ref=e366]: "1"
            - generic [ref=e367]: YOURS
          - paragraph [ref=e371]: "YOUR EVIDENCE: 0 SUCCESS IN 0 · POSTERIOR BETA(1, 1) · CREDIBLE 0.025 TO 0.975 · CONFIDENCE (WILSON) 0.000 TO 1.000 · RUNNING IN YOUR BROWSER"
      - paragraph [ref=e372]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e375]:
      - generic [ref=e376]:
        - paragraph [ref=e377]: S04 · THE TURN UNROLLS
        - heading "A forecast band is a promise. Count how often it keeps it." [level=2] [ref=e378]:
          - generic [ref=e379]: A
          - generic [ref=e380]: forecast
          - generic [ref=e381]: band
          - generic [ref=e382]: is
          - generic [ref=e383]: a
          - generic [ref=e384]: promise.
          - generic [ref=e385]: Count
          - generic [ref=e386]: how
          - generic [ref=e387]: often
          - generic [ref=e388]: it
          - generic [ref=e389]: keeps
          - generic [ref=e390]: it.
        - generic [ref=e391]:
          - generic [ref=e392]: SYNTHETIC
          - generic [ref=e394]: PREDICTED
          - generic [ref=e396]:
            - text: SIMULATED
            - generic [ref=e398]: · COVERAGE STUDY
      - generic:
        - 'img "Forecast: time runs downward; the series falls to now, then forecast paths with dashed prediction interval hairlines" [ref=e399]':
          - generic [ref=e456]: NOW
        - paragraph [ref=e457]: 95% INTERVAL COVERED 12 OF 12 HOLD-OUT VALUES (100%)
      - group "Controls and readouts" [ref=e458]:
        - generic [ref=e459]:
          - radiogroup "LEVEL" [ref=e460]:
            - generic [aria-hidden] [ref=e461]: LEVEL
            - generic [ref=e462]:
              - radio "80%" [ref=e463] [cursor=pointer]
              - radio "95%" [checked] [ref=e464] [cursor=pointer]
          - radiogroup "METHOD" [ref=e465]:
            - generic [aria-hidden] [ref=e466]: METHOD
            - generic [ref=e467]:
              - radio "AR(1)" [checked] [ref=e468] [cursor=pointer]
              - radio "SES" [ref=e469] [cursor=pointer]
        - paragraph [ref=e470]: 95% PREDICTION INTERVAL · A PREDICTION INTERVAL IS THE RANGE IN WHICH ONE SINGLE FUTURE OBSERVATION IS EXPECTED TO FALL WITH THE STATED PROBABILITY, IF THE MODEL IS RIGHT; IT IS WIDER THAN A CONFIDENCE INTERVAL FOR A MEAN AND IS NOT A CREDIBLE INTERVAL.
        - paragraph [ref=e471]: 95% INTERVAL COVERED 91.6% TO 94.5% OF 2,000 SIMULATED SERIES, HORIZONS 1 TO 12 · PRECOMPUTED · PYTHON REFERENCE
        - paragraph [ref=e472]: 40 SEEDED PATHS FROM THE FITTED AR(1) MODEL · SEED 20261018 · RUNNING IN YOUR BROWSER
        - paragraph [ref=e473]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
      - paragraph [ref=e474]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e477]:
      - generic [ref=e478]:
        - paragraph [ref=e479]: S05 · WHAT WOULD FLIP THE MODEL
        - heading "What would flip the model?" [level=2] [ref=e480]:
          - generic [ref=e481]: What
          - generic [ref=e482]: would
          - generic [ref=e483]: flip
          - generic [ref=e484]: the
          - generic [ref=e485]: model?
        - paragraph [ref=e486]: SMALLEST CHANGE TO THE INPUTS THAT FLIPS THE MODEL'S DECISION.
        - generic [ref=e487]:
          - generic [ref=e488]: OBSERVED
          - generic [ref=e490]: PREDICTED
      - generic [ref=e492]:
        - radiogroup "Applicant" [ref=e493]:
          - listitem [ref=e494]:
            - radio "APPLICANT 8" [checked] [ref=e495] [cursor=pointer]
          - listitem [ref=e496]:
            - radio "APPLICANT 16" [ref=e497] [cursor=pointer]
          - listitem [ref=e498]:
            - radio "APPLICANT 19" [ref=e499] [cursor=pointer]
          - listitem [ref=e500]:
            - radio "APPLICANT 55" [ref=e501] [cursor=pointer]
          - listitem [ref=e502]:
            - radio "APPLICANT 63" [ref=e503] [cursor=pointer]
          - listitem [ref=e504]:
            - radio "APPLICANT 77" [ref=e505] [cursor=pointer]
          - listitem [ref=e506]:
            - radio "APPLICANT 158" [ref=e507] [cursor=pointer]
          - listitem [ref=e508]:
            - radio "APPLICANT 167" [ref=e509] [cursor=pointer]
        - paragraph [ref=e510]: 36 MONTHS · 6,948 DM · 0 TO UNDER 200 DM · SAVINGS UNDER 100 DM
        - generic [ref=e511]:
          - paragraph [ref=e512]: TARGET 0.500 · P(BAD) 0.640 TO 0.499
          - list [ref=e513]:
            - listitem [ref=e514]: "SAVINGS ACCOUNT OR BONDS: UNDER 100 DM → 500 TO UNDER 1000 DM"
        - generic [ref=e515]:
          - paragraph [ref=e516]: TARGET 0.167 · P(BAD) 0.640 TO 0.148
          - list [ref=e517]:
            - listitem [ref=e518]: "CHECKING ACCOUNT: 0 TO UNDER 200 DM → NO CHECKING ACCOUNT"
            - listitem [ref=e519]: "LOAN DURATION (MONTHS): 36 → 30"
            - listitem [ref=e520]: "SAVINGS ACCOUNT OR BONDS: UNDER 100 DM → 1000 DM OR MORE"
        - paragraph [ref=e521]: "CANNOT CHANGE: AGE (YEARS) 35 · CREDIT HISTORY EXISTING CREDITS PAID BACK DULY SO FAR · PRESENT EMPLOYMENT 1 TO UNDER 4 YEARS · HOUSING RENT · EXISTING CREDITS AT THIS BANK 1"
        - paragraph [ref=e522]: MODEL COUNTERFACTUAL · NOT A CAUSAL CLAIM · WHAT FLIPS THIS MODEL, NOT WHAT CHANGES A LIFE
      - group "Controls and readouts" [ref=e523]
      - paragraph [ref=e524]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · UCI GERMAN CREDIT · CC BY 4.0 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e527]:
      - generic [ref=e528]:
        - paragraph [ref=e529]: S06 · WHAT MATTERS
        - heading "Some trade-offs are efficient. Most inputs are not what matters." [level=2] [ref=e530]:
          - generic [ref=e531]: Some
          - generic [ref=e532]: trade-offs
          - generic [ref=e533]: are
          - generic [ref=e534]: efficient.
          - generic [ref=e535]: Most
          - generic [ref=e536]: inputs
          - generic [ref=e537]: are
          - generic [ref=e538]: not
          - generic [ref=e539]: what
          - generic [ref=e540]: matters.
        - generic [ref=e541]:
          - generic [ref=e542]: DERIVED
          - generic [ref=e544]: SIMULATED
      - img "Variance split of the Ishigami function into first-order shares and interactions" [ref=e546]:
        - generic [ref=e547]:
          - generic [ref=e550]: S1 x1 0.314
          - generic [ref=e552]: 10 REPLICATES · MEAN 0.29
        - generic [ref=e553]:
          - generic [ref=e556]: S2 x2 0.442
          - generic [ref=e558]: 10 REPLICATES · MEAN 0.47
        - generic [ref=e559]:
          - generic [ref=e561]: S3 x3 0.000
          - generic [ref=e563]: 10 REPLICATES · MEAN -0.00
        - generic [ref=e564]: INTERACTIONS 0.244
      - group "Controls and readouts" [ref=e568]:
        - generic [ref=e569]:
          - radiogroup "N" [ref=e570]:
            - generic [aria-hidden] [ref=e571]: "N"
            - generic [ref=e572]:
              - radio "256" [ref=e573] [cursor=pointer]
              - radio "1,024" [checked] [ref=e574] [cursor=pointer]
              - radio "4,096" [ref=e575] [cursor=pointer]
              - radio "16,384" [ref=e576] [cursor=pointer]
          - button "RESET" [ref=e577] [cursor=pointer]
        - paragraph [ref=e578]: RUNNING IN YOUR BROWSER · SEED 20261011 · N 1,024 · 1 MS · S1 0.234 · 0.514 · -0.031 · TOTAL 0.520 · 0.450 · 0.273 · NO PUBLISHED VECTOR FOR SEED 20261011 AT N 1,024 · COMPUTED IN YOUR BROWSER
        - paragraph [ref=e579]: "ANALYTIC INDICES (WHITE BARS): S1 0.314 · 0.442 · 0.000 · TOTAL 0.558 · 0.442 · 0.244. x3 HAS NO FIRST-ORDER SHARE AND A LARGE TOTAL: IT MATTERS ONLY THROUGH x1."
      - paragraph [ref=e580]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · ISHIGAMI AND HOMMA (1990) · SALTELLI ET AL. (2008) · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e583]:
      - paragraph [ref=e584]: S07 · SEVEN OBJECTIONS
      - heading "How we know." [level=2] [ref=e585]
      - generic [ref=e586]:
        - generic [ref=e587]:
          - paragraph [ref=e588]: Are the numbers checked?
          - paragraph [ref=e590]: "71 of 71 checks pass. Failures recorded: none."
        - generic [ref=e591]:
          - paragraph [ref=e592]: Is any of this real?
          - paragraph [ref=e594]: Only the German applicants and the NSW and PSID earnings are observed. Every other future on this site is synthetic and seeded.
        - generic [ref=e595]:
          - paragraph [ref=e596]: Who made the data?
          - paragraph [ref=e598]: "LaLonde, R. (1986). Evaluating the Econometric Evaluations of Training Programs. AER 76, 604-620. Dehejia, R. and Wahba, S. (1999). Causal Effects in Non-Experimental Studies. JASA 94(448), 1053-1062. Dehejia, R. and Wahba, S. (2002). Propensity Score Matching Methods for Non-Experimental Causal Studies. REStat 84, 151-161. Credit data: Hofmann (1994), UCI, CC BY 4.0."
      - paragraph [ref=e599]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e603]:
      - generic [ref=e604]:
        - paragraph [ref=e605]: THE LAB · TEN INSTRUMENTS
        - heading "Ten instruments, in your browser." [level=2] [ref=e606]
      - generic [ref=e607]:
        - generic [ref=e608]:
          - text: SEED
          - textbox "SEED" [ref=e609]: "20261011"
        - radiogroup "DECISION" [ref=e610]:
          - generic [aria-hidden] [ref=e611]: DECISION
          - generic [ref=e612]:
            - radio "BUILD NOW" [checked] [ref=e613] [cursor=pointer]
            - radio "PHASED" [ref=e614] [cursor=pointer]
            - radio "DELAY ONE YEAR" [ref=e615] [cursor=pointer]
        - generic [ref=e616]:
          - generic [ref=e617]: INVESTMENT MEDIAN 100 M USD
          - slider "INVESTMENT MEDIAN 100 M USD" [ref=e618]: "100"
        - generic [ref=e619]:
          - generic [ref=e620]: REVENUE MULTIPLIER 1.00
          - slider "REVENUE MULTIPLIER 1.00" [ref=e621]: "1"
        - generic [ref=e622]:
          - generic [ref=e623]: DELAY 0 YEARS
          - slider "DELAY 0 YEARS" [ref=e624]: "0"
        - generic [ref=e625]:
          - button "RUN ALL TEN" [ref=e626] [cursor=pointer]
          - button "RESET" [ref=e627] [cursor=pointer]
        - generic [ref=e628]:
          - generic [ref=e629]:
            - generic [ref=e630]: THREAD, SORTED BY FINAL NPV
            - slider "THREAD, SORTED BY FINAL NPV" [ref=e631]: "0"
          - paragraph [ref=e632]: LIGHTS ONE WORLD IN EVERY TURN.
        - paragraph [ref=e633]: OUTWARD = YEARS · ONE FULL TURN = MONEY BACK · 1,200 OF 20,000 FUTURES DRAWN · SEED 20261011
      - list [ref=e634]:
        - listitem [ref=e635]:
          - generic [ref=e636]:
            - generic [ref=e637]: 1 · DISTRIBUTIONS
            - generic [ref=e638]: DERIVED
            - button "RUN IN YOUR BROWSER" [ref=e640] [cursor=pointer]
          - paragraph [ref=e641]: DETERMINISTIC · NO SEED
        - listitem [ref=e642]:
          - generic [ref=e643]:
            - generic [ref=e644]: 2 · SAMPLING
            - generic [ref=e645]: SYNTHETIC
            - button "RUN IN YOUR BROWSER" [ref=e647] [cursor=pointer]
          - paragraph [ref=e648]: DRIVEN BY THE SEED FIELD
        - listitem [ref=e649]:
          - generic [ref=e650]:
            - generic [ref=e651]: 3 · MONTE CARLO
            - generic [ref=e652]: SYNTHETIC
            - button "RUN IN YOUR BROWSER" [ref=e654] [cursor=pointer]
          - paragraph [ref=e655]: DRIVEN BY THE SEED FIELD
        - listitem [ref=e656]:
          - generic [ref=e657]:
            - generic [ref=e658]: 4 · CONJUGATE BAYES
            - generic [ref=e659]: SYNTHETIC
            - button "RUN IN YOUR BROWSER" [ref=e661] [cursor=pointer]
          - paragraph [ref=e662]: DRIVEN BY THE SEED FIELD
        - listitem [ref=e663]:
          - generic [ref=e664]:
            - generic [ref=e665]: 5 · FORECAST INTERVALS
            - generic [ref=e666]:
              - text: SYNTHETIC
              - generic [ref=e668]: · PREDICTED
            - button "RUN IN YOUR BROWSER" [ref=e669] [cursor=pointer]
          - paragraph [ref=e670]: DETERMINISTIC · NO SEED
        - listitem [ref=e671]:
          - generic [ref=e672]:
            - generic [ref=e673]: 6 · COST-SENSITIVE THRESHOLDS
            - generic [ref=e674]:
              - text: OBSERVED
              - generic [ref=e676]: · PREDICTED
            - button "RUN IN YOUR BROWSER" [ref=e677] [cursor=pointer]
          - paragraph [ref=e678]: DETERMINISTIC · NO SEED
        - listitem [ref=e679]:
          - generic [ref=e680]:
            - generic [ref=e681]: 7 · LP AND PARETO
            - generic [ref=e682]:
              - text: SYNTHETIC
              - generic [ref=e684]: · DERIVED
            - button "RUN IN YOUR BROWSER" [ref=e685] [cursor=pointer]
          - paragraph [ref=e686]: DETERMINISTIC · NO SEED
        - listitem [ref=e687]:
          - generic [ref=e688]:
            - generic [ref=e689]: 8 · SENSITIVITY
            - generic [ref=e690]: DERIVED
            - button "RUN IN YOUR BROWSER" [ref=e692] [cursor=pointer]
          - paragraph [ref=e693]: DRIVEN BY THE SEED FIELD
        - listitem [ref=e694]:
          - generic [ref=e695]:
            - generic [ref=e696]: 9 · COUNTERFACTUALS
            - generic [ref=e697]:
              - text: OBSERVED
              - generic [ref=e699]: · PREDICTED
            - button "RUN IN YOUR BROWSER" [ref=e700] [cursor=pointer]
          - paragraph [ref=e701]: DETERMINISTIC · NO SEED
        - listitem [ref=e702]:
          - generic [ref=e703]:
            - generic [ref=e704]: 10 · CAUSAL
            - generic [ref=e705]:
              - text: OBSERVED
              - generic [ref=e707]: · DERIVED
            - button "RUN IN YOUR BROWSER" [ref=e708] [cursor=pointer]
          - paragraph [ref=e709]: DRIVEN BY THE SEED FIELD
      - paragraph [ref=e710]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
    - generic [ref=e713]:
      - heading "Every decision creates a different future." [level=2] [ref=e714]:
        - generic [ref=e715]: Every
        - generic [ref=e716]: decision
        - generic [ref=e717]: creates
        - generic [ref=e718]: a
        - generic [ref=e719]: different
        - generic [ref=e720]: future.
      - paragraph [ref=e721]: "YOUR DECISION: BUILD NOW · SEED 20261011 · 62% CLOSE THE TURN"
      - generic [ref=e722]:
        - button "REPLAY" [ref=e723] [cursor=pointer]
        - button "RESET" [ref=e724] [cursor=pointer]
      - list [ref=e725]:
        - listitem [ref=e726]:
          - link "SOURCE" [ref=e727] [cursor=pointer]:
            - /url: https://github.com/mrrishit909/decision-universe
        - listitem [ref=e728]:
          - link "LIMITATIONS" [ref=e729] [cursor=pointer]:
            - /url: https://github.com/mrrishit909/decision-universe/blob/main/docs/LIMITATIONS.md
      - paragraph [ref=e731]: NSW/PSID data are distributed by NBER for attributable non-commercial use (CC by NC). This non-monetized portfolio publishes derived results only and never the raw or row-level data. German Credit is CC BY 4.0. · SEED 20261011 · Seeded environments are SYNTHETIC and illustrate method, not any real project, series or population.
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