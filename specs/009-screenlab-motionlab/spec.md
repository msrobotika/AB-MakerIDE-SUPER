# AB ScreenLab MotionLab — native motion presets

## Requirements
- **FR-001**: Optional motion field on existing ScreenLab widgets with valid presets none, fade-in, slide-in and pulse and durations from 200 through 5000ms; backwards-compatible JSON v1.
- **FR-002**: Browser visual preview only on explicit user action, reduced-motion OS preference respected, no web CSS imported or executed.
- **FR-003**: Export real LVGL 8.x animation calls on existing UI widgets, no firmware, pins, drivers or external assets invented.
- **FR-004**: Test serialization validation, malicious motion rejection, native code and Chromium UI; preserve existing physical honesty and repo/CI gates.
- **FR-005**: Document what the video inspires (CSS-style animation) vs unsupported arbitrary CSS/3D-to-RGB565 conversion.
