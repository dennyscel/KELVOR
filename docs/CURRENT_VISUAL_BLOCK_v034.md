# Visual block — RC39 v034-v035 REOPENED

Scope: Main Menu + World Map + mobile navigation in secondary menus.

Promotion rule: `docs/QA_VISUAL_9_OF_10_GATE.md`.

## Current status

**REOPENED / FAIL — prior 9.2/10 promotion revoked by Owner QA**

Reason: the previous automated gate did not require repeated portrait + landscape mobile evidence. Owner physical testing on a real phone, repeated in both orientations, still found the Main Menu and World Map below the required visual quality.

The previous technical results remain useful but are not sufficient for promotion:
- Windows/Chrome technical smoke: 10.0/10 PASS
- Options touch Back: functional
- camera/background gameplay fix: independently validated
- no crash in the menu/map flow

However, visual/UX promotion is blocked until the new repeated-orientation gate passes.

## Mandatory evidence before re-promotion
For Main Menu and World Map, each must have:
- 3 portrait captures including reload/resize/re-entry;
- 3 landscape captures including reload/resize/re-entry;
- 1 extreme small viewport capture;
- 1 wide desktop capture;
- no clipping, overlap, dead space or awkward composition;
- buttons and focal art positioned intentionally in both orientations;
- visual score >=9.0/10 separately in portrait and landscape;
- no unresolved Owner QA objection.

## Consequence
W01-L01 Visual & Interaction Rebuild is temporarily **frozen from promotion**. Candidate work may remain in GitHub, but no W01-L01 visual rebuild is promoted to Pages until Main Menu + World Map pass the strengthened gate.
