# Engineering audit
The video shows a conceptual conversion of CSS graphics/animations to an ESP32. For simple transitions, LVGL 8.x supports explicit native animation APIs; no CSS runtime or costly frame buffer sequence is needed. For complex CSS/3D effects, a future OFFLINE renderer may rasterize keyframes to tiles/RGB565 and budget flash/RAM. Neither arbitrary CSS parsing nor a 3D engine is implemented here. Assets/music from the uploaded video are not copied. No connected boards were read, compiled, flashed or measured.

Motion state is optional for backwards-compatible `ab-screenlab-v1` JSON and constrained to named built-ins, integer duration 200–5000ms. Browser preview runs only on explicit button click and honors reduced-motion preference. One-pass LVGL entry animation uses LVGL 8.4 APIs, must be integrated with the correct LVGL BSP/driver, tested and reviewed before hardware use.

The generated UI-only header still needs a real display/touch driver, tick, buffers and hardware compiler run. Browser preview is not pixel-equivalence evidence or a hardware performance guarantee.
