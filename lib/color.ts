function toRgb(hex: string): [number, number, number] {
  let s = hex.replace("#", "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hex: string, target: number, weight: number): string {
  return (
    "#" +
    toRgb(hex)
      .map((v) => Math.round(v + (target - v) * weight).toString(16).padStart(2, "0"))
      .join("")
  );
}

function luminance(hex: string): number {
  const [r, g, b] = toRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** CSS variables derived from one brand color, readable on dark and light backgrounds. */
export function accentVars(accent: string): Record<string, string> {
  const isLight = luminance(accent) > 0.35;
  return {
    "--accent": accent,
    "--accent-text": isLight ? "#0B0B0C" : "#FFFFFF",
    "--accent-light": mix(accent, 255, 0.35),
    "--accent-dark": isLight ? mix(accent, 0, 0.45) : mix(accent, 0, 0.1),
  };
}
