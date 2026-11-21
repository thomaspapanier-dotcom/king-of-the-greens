// Where the painted Realm map (assets/realm-map.webp) and the state outlines line up.
// Built by tools/fit_realm_map.py. MATRIX turns outline (Albers) coordinates into painting pixels:
// one for the lower 48, one each for Alaska and Hawaii. CUT is each Realm's cut-out: x, y, width, height.
export const SIZE = [1200, 675];
export const MATRIX = {"pacific": [1.37315, -0.00292, -0.036, 0.98345, 41.79934, 27.01614], "peaks": [1.0328, 0.00378, -0.02744, 0.95016, 94.67941, 18.2619], "plains": [1.51675, -0.15289, -0.08209, 0.96221, -77.47795, 87.30232], "desert": [1.08402, -0.07657, 0.00841, 1.17429, 43.87519, -28.14395], "magnolia": [1.26382, 0.01267, -0.01542, 1.18428, -40.07054, -69.49159], "ivy": [1.32811, -0.00902, 0.00818, 1.12809, -105.95325, 12.11152], "AK": [1.36066, 0.01444, -0.23595, 1.19571, 103.17643, -101.27021], "HI": [1.5, 0.0, 0.0, 1.395, -114.0, -243.81]};
export const CUT = {"pacific": [41, 42, 330, 562], "peaks": [180, 60, 316, 283], "plains": [462, 75, 601, 288], "desert": [209, 327, 433, 288], "magnolia": [621, 268, 420, 366], "ivy": [885, 60, 268, 272]};
