# Blog Hero Image Context

Use this treatment when turning an existing screenshot, logo, or project image
into a blog hero. The reference implementation is
`images/sonarqube_plugin/allowed-dependencies-1-0-hero.png`.

## Canvas and composition

- Use a wide landscape canvas at approximately 1.9:1 (around 1730 x 910 px).
- Keep a narrow saturated accent rail against the far left edge.
- Use a very pale cool-gray or white background with a restrained ambient glow.
- Place the source artwork prominently near the center of the composition.
- Leave generous clear space around the artwork for responsive crops.
- Preserve the source artwork faithfully. Do not invent UI, text, nodes, or
  other details that change its meaning.
- Treat cards, panels, borders, and shadows as source content rather than part
  of the standard hero treatment.

## Decoration

- Add sparse dot-grid clusters near two or three outer corners.
- Add thin angular connector lines inspired by circuits, dependency graphs, or
  API paths. Keep them near the canvas edges and away from the main artwork.
- Use small circular terminals at selected connector endpoints and bends.
- Derive accent colors from the source artwork, with blue as the default
  technical accent and one restrained secondary color.
- Keep all decoration subtle and secondary to the source artwork.

## Style constraints

- Aim for a clean developer-tooling editorial graphic with precise,
  vector-like geometry.
- Keep the image bright, calm, modern, and uncluttered.
- Do not add titles, captions, letters, watermarks, photorealistic objects,
  dark-theme styling, or neon/cyberpunk effects.
- Do not overuse gradients, shadows, connector lines, or dot patterns.

## Prompt template

```text
Create a polished wide blog hero using the supplied [screenshot/logo/artwork]
as the central subject. Preserve the source content faithfully.

Use a 1.9:1 landscape canvas with a pale cool-gray-to-white technical
background and a narrow saturated accent rail at the far left. Place the source
artwork prominently near the center with generous clear space around it.

Add sparse dot-grid clusters and thin angular circuit/graph/API-path connector
lines around the outer edges. Derive the restrained accent palette from the
source artwork, using blue as the default technical accent. Keep decorations
subtle and preserve generous safe margins.

Do not add a card, panel, border, or shadow unless it is already part of the
source artwork. No text, watermark, invented UI, extra central icons, dark
theme, photorealism, or busy background.
```
