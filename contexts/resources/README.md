# Vibe Planners Designs

## Package Contents

- [Screen index](index.html): browse the 232 exported artboards, grouped as supplied by the design package.
- [Design reference](design-reference.md): consolidated flows, visual conventions, limitations, discrepancies and unresolved decisions.
- `paginas/`: standalone HTML mockups. No server is required. Plus Jakarta Sans is downloaded from the internet; a generic font is used when unavailable.
- `fuente-lienzo/`: original `.dc.html` files and `canvas.json`, retained as a canvas backup rather than standalone browser pages.
- [Component inventory](documentacion/componentes-vibe-planners.md): 71 estimated entries with variants and states, not a requirement to implement 71 separate components.

## Limitations

- Bracketed values such as `[PRECIO]` are placeholders. Names, prices, ratings, commissions and business claims are not production data.
- These are static mockups, not working application flows. Buttons and fields do not establish API or service integrations.
- Mobile artboards are usually condensed snapshots, not complete responsive pages. Index groups do not guarantee platform parity.
- Maps are illustrations; their provider and attribution remain undecided.
- Legal text, policies and fiscal calculations require the appropriate legal, business and accounting review.
- Card fields must be implemented with hosted/tokenized payment-provider elements, not copied as raw card-data inputs.
- Spanish-first screens and emails still need reviewed translations; SMS and push boards already include Spanish and English.

All 232 index links resolved to existing local HTML files when checked on 2026-11-01. This check does not certify visual rendering, accessibility or functionality. See the design reference for known discrepancies and the initial implementation boundary.
