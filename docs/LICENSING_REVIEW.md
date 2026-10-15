# Licensing review: NSW / PSID data in S07 (2026-10-14)

Status: KEEP PROVISIONALLY (owner decision 2026-10-14). No restricted row-level content is shipped.

## Source and exact terms
- Page: https://users.nber.org/~rdehejia/nswdata2.html (Rajeev Dehejia's page hosted by NBER; fetched 2026-10-14).
- Verbatim: "These data are distributed for attributable non-commercial use ( CC by NC )." and "If creating a web page, please link to this web page."
- Citation required: Dehejia and Wahba (1999, JASA 94(448)); Dehejia and Wahba (2002, REStat 84); Lalonde (1986, AER 76).
- Provenance note on the page: drawn "with his permission from data originally constructed by Lalonde".
- No licence deed, version number or contact for licensing questions is given beyond "CC by NC". The wider nber.org Terms and Conditions (https://www.nber.org/terms-and-conditions) grant "personal, non-commercial use" of nber.org Content and exclude derivative uses of the Site and Content; the data page is on a personal faculty page, and it is not stated which terms govern it.

## What this site does
- Publishes derived results only: estimates, balance tables, aggregates. Microdata is not shipped (raw files gitignored, fetched into `data/raw`).
- Links the host page and cites all three papers in S07 and README. Non-commercial notice is in the page footer.
- Non-monetized: no ads, no paid tier, not a product.

## Findings
1. Attribution: met (link, three citations, source named, change indicated by "derived results"; the footer does not use the word "adapted", consider adding it).
2. Redistribution: no row-level data is redistributed; the only redistributed material is derived statistics.
3. Derived aggregates are not assumed exempt. Under a CC BY-NC reading, adapted material is allowed with attribution, so derived statistics are covered, but only for NonCommercial use.
4. NonCommercial fit: a non-monetized, public, career-oriented portfolio is a reasonable but not certain reading of "non-commercial". CC's own definition turns on being "primarily intended for commercial advantage or monetary compensation". Residual risk: the stated terms are a one-line notice, not a formal licence, so there is no authoritative text to confirm the reading.
5. Conclusion: on the face of the stated terms the use appears permitted; it is not verified by the rights holder. Not flagged for removal. If the owner wants certainty, ask the page owner (contact page: https://users.nber.org/~rdehejia/contact.html, postal address only, NYU Wagner) to confirm. If a rights holder objects, S07 and module 10 are self-contained and can be removed or replaced by the simulated DGP benchmark.
