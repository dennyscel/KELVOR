# W01 living map v046 - asset provenance

- Date: 2026-09-07
- Creation: built-in image_gen imagegen tool; new image, not an edit.
- Use case: stylized-concept / production overworld background.
- Pixel size: 1536 x 1024, RGB PNG.
- SHA-256: `1F6F04857B9E4A3FF6176BD955A60438FA8250A390F433235BDFB8F4261CD0CD`.
- Workspace asset: `assets/world-map/w01-living-map-v046.png`.
- Original generated file: `C:\Users\Meu Computador\.codex\generated_images\01a07b69-a259-78e3-bd01-11da1e792cc7\exec-8038cbb2-e4af-4bde-85eb-9a148b281e6f.png`.
- Original preserved. Selected image copied without resizing, editing, cropping, or transcoding.
- Existing `assets/campaign-map/world01_map.png` was inspected for artistic continuity: forest, blue roof, green stone portal, left river and waterfalls. It was not supplied as an edit target.
- Generation output visually inspected at full composition. Runtime animation, nodes, hero, camera and UI are separate code work.
- This is an implementation candidate; visual quality is not yet signed off as >=9/10 in-game.

## Composition and runtime anchors

Coordinates are normalized x/y from image top-left. They are estimates from visual inspection and should be checked with the hero feet rendered in game. Background art is edge-to-edge terrain; no alpha cutout, border, title, HUD, hero or runtime destination markers.

| Location | Suggested destination feet | Landmark center | Notes |
| --- | --- | --- | --- |
| Beginning / northern bridge exit | 0.374, 0.750 | 0.319, 0.814 | Walk toward the fork above the large lower stone bridge. |
| Central meadow / western trail | 0.356, 0.550 | 0.489, 0.592 | Node is on sandy trail, avoiding the decorative flower center. |
| Village approach | 0.756, 0.532 | 0.818, 0.391 | Node is on the trail in front of the blue-roof cottage. |
| Portal approach | 0.599, 0.278 | 0.628, 0.135 | Node is below portal stairs, not inside the arch. |
| Secret grove approach | 0.234, 0.400 | 0.215, 0.298 | Node is in the grove beyond the small wooden bridge. |

### Suggested route polylines

These points follow painted walking ground. Do not use direct straight-line node-to-node movement across trees, houses or cliffs.

- Beginning -> meadow: [0.374,0.750], [0.387,0.720], [0.382,0.681], [0.359,0.644], [0.350,0.603], [0.356,0.550].
- Meadow -> village (northern half of painted loop): [0.356,0.550], [0.379,0.506], [0.425,0.478], [0.481,0.474], [0.545,0.477], [0.578,0.508], [0.607,0.563], [0.643,0.594], [0.686,0.599], [0.723,0.581], [0.756,0.532].
- Village -> portal: reverse village path until [0.545,0.477], then [0.559,0.442], [0.553,0.415], [0.539,0.383], [0.549,0.349], [0.570,0.313], [0.599,0.278].
- Meadow -> secret: [0.356,0.550], [0.358,0.517], [0.332,0.485], [0.308,0.466], [0.285,0.449], [0.260,0.432], [0.239,0.420], [0.234,0.400].

The generator introduced a coherent loop around the central meadow. The above routes use its northern and western sides. The southern half may remain environmental until intentionally assigned a route.

## Prompt

```text
Use case: stylized-concept.
Asset type: Production background texture for a fullscreen scrolling overworld map in KELVOR, a refined pixel-art platform adventure. Generate one brand-new landscape image, 1536x1024 or larger, ideally 2304x1536, aspect 3:2.
Primary request: An exceptionally beautiful, inviting and richly detailed first-world forest and meadow overworld, intended to be explored with a close camera following the character. An aspirational premium adventure game map, clear and coherent at close scale.
Style: Hand-crafted refined pixel-art illustration, sharp intentional pixel clusters, controlled color ramps, readable small details, crisp contours; top-down with mild oblique elevation so tree crowns, fronts of buildings and rock ledges are visible. Lush but organized, no blur, no depth-of-field. Consistent sunlight from upper-left; warm honey-colored walking trails, saturated emerald and moss grass, turquoise flowing water, blue slate cottage roofs, mossy carved gray stone.
Composition: The landscape fills the image edge to edge. This is an expansive playable environment, NOT a tiny miniature diorama floating in a black void. Broad grassy land with forest stands and layered rocky rises, a river on the left that descends over two beautiful small waterfalls and flows out at lower-left, crossings supported by stone/wood bridges. The outermost edges continue through forest and grass or water naturally. The terrain itself is large and detailed, with open clearings between richly varied trees, ferns, flowers, layered cliffs, reeds and rock groups. No empty uniform border.
Layout for implementation (all coordinates expressed as percent from left/top): a generous beginning clearing and little bridge near (30%,75%); a sunlit circular central meadow near (43%,53%); a tiny woodland village with two charming cottages, one with prominent blue slate roof, around (70%,43%); a magnificent ancient moss-covered stone arch containing a glowing green swirling portal, elevated on broad steps, around (66%,20%); a quieter secret grove and ancient rune stone at (22%,40%). Keep each of these five locations visually legible and accessible, with a little empty walking ground in front of buildings, portal and stone. No icons or circular stage pedestals.
Route: ONE clearly visible continuous honey-beige sandy footpath main route begins near (30%,75%), curves gently to central meadow (43%,53%), then curves east through the village (70%,43%), and then climbs northwest to portal approach (66%,20%). A single thinner branch from central meadow leads northwest over a small bridge to secret grove (22%,40%). Every path is physically walkable, solid and continuous. Trails have ground contact and consistent width, do not run through buildings/trees, do not disappear into cliffs or end in water. The village-front trail stays visible. Gentle bends and varied views make following these routes enjoyable. No extra maze of paths. Curbs, low grass and flowers clarify trail edges.
Materials and detail: tree trunks visibly support canopies, bridges have coherent ends meeting the trails, cliff shadows sit below ledges, waterfalls flow downward from higher water to lower pools, water ripples and white spray, individual tufts and flowers. Add discreet signs of nature: lily pads, fallen log, mushroom groups and ruin vine strands, all secondary to route readability. Build variation in scale rather than uniform repeated stamps.
Constraints: Environment art only. Absolutely no people, no hero, no animals, no enemies, no treasure chests, no hearts, no labels, no letters, no digits, no text, no HUD, no UI, no watermark, no symbols hovering over route, no map markers, no decorative border. Keep paths free for a runtime character and five runtime destination markers. No faux screenshots, no logos. No soft painting, no photorealism, no tilted miniature world or plastic 3D toy aesthetic.
```
