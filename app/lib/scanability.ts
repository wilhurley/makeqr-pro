// Pure, client-safe scan-ability checks for a generated QR code.
// No DOM or network access — just math on the chosen colors, size, content
// length, margin and error-correction level. Results are plain-English so the
// UI can surface them next to the preview before the user downloads.

export type ECLevel = "L" | "M" | "Q" | "H";

export type ScanIssue = {
  level: "error" | "warning";
  message: string;
};

export type ScanReport = {
  contrastRatio: number; // WCAG contrast ratio, 1–21
  inverted: boolean;     // light modules on a dark background
  issues: ScanIssue[];   // worst first
};

// Parse "#rgb" / "#rrggbb" into 0–255 channels. Returns null if unparseable.
function parseHex(hex: string): { r: number; g: number; b: number } | null {
  let h = hex.trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 || /[^0-9a-f]/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// Relative luminance per WCAG 2.1.
function luminance(c: { r: number; g: number; b: number }): number {
  const chan = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(c.r) + 0.7152 * chan(c.g) + 0.0722 * chan(c.b);
}

// Contrast ratio between two colors (1 = identical, 21 = black vs white).
export function contrastRatio(fg: string, bg: string): number {
  const a = parseHex(fg);
  const b = parseHex(bg);
  if (!a || !b) return 1;
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// Approximate byte-mode capacity per QR version (1–40) at each EC level.
// Used only to estimate the module grid size for the print-size check — the
// real version is chosen by the encoder, this just needs to be close.
const BYTE_CAPACITY: Record<ECLevel, number[]> = {
  L: [17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2809, 2953],
  M: [14, 26, 42, 62, 84, 106, 122, 152, 180, 213, 251, 287, 331, 362, 412, 450, 504, 560, 624, 666, 711, 779, 857, 911, 997, 1059, 1125, 1190, 1264, 1370, 1452, 1538, 1628, 1722, 1809, 1911, 1989, 2099, 2213, 2331],
  Q: [11, 20, 32, 46, 60, 74, 86, 108, 130, 151, 177, 203, 241, 258, 292, 322, 364, 394, 442, 482, 509, 565, 611, 661, 715, 751, 805, 868, 908, 982, 1030, 1112, 1168, 1228, 1283, 1351, 1423, 1499, 1579, 1663],
  H: [7, 14, 24, 34, 44, 58, 64, 84, 98, 119, 137, 155, 177, 194, 220, 250, 280, 310, 338, 382, 403, 439, 461, 511, 535, 593, 625, 658, 698, 742, 790, 842, 898, 958, 983, 1051, 1093, 1139, 1219, 1273],
};

// Smallest QR version that can hold `bytes` at the given EC level → module count.
// Module count per version is 17 + 4*version (version 1 = 21×21).
function estimateModuleCount(bytes: number, ec: ECLevel): number {
  const caps = BYTE_CAPACITY[ec];
  for (let v = 0; v < caps.length; v++) {
    if (bytes <= caps[v]) return 17 + 4 * (v + 1);
  }
  return 17 + 4 * 40; // maxed out — use the largest grid
}

export type ScanInput = {
  fg: string;
  bg: string;
  size: number;          // output pixels (width = height)
  contentLength: number; // UTF-8-ish byte length of the encoded data
  margin: number;        // quiet-zone width in modules
  ec: ECLevel;
};

export function checkScanability({ fg, bg, size, contentLength, margin, ec }: ScanInput): ScanReport {
  const issues: ScanIssue[] = [];
  const ratio = contrastRatio(fg, bg);

  const fgLum = parseHex(fg) ? luminance(parseHex(fg)!) : 0;
  const bgLum = parseHex(bg) ? luminance(parseHex(bg)!) : 1;
  const inverted = fgLum > bgLum;

  // Contrast — scanners need dark modules to stand out from the background.
  if (ratio < 3) {
    issues.push({
      level: "error",
      message: `The QR color and background are too similar (contrast ${ratio.toFixed(1)}:1). Many phones will fail to scan this. Use a darker code on a lighter background.`,
    });
  } else if (ratio < 7) {
    issues.push({
      level: "warning",
      message: `The contrast between the code and background is a bit low (${ratio.toFixed(1)}:1). It will scan better with a darker code on a lighter background.`,
    });
  }

  // Inverted colors — light code on a dark background confuses many scanners.
  if (inverted) {
    issues.push({
      level: "warning",
      message: "Your code is lighter than its background. Some phone cameras only read dark codes on a light background — test before printing.",
    });
  }

  // Print size vs content length — tiny modules smear when printed.
  const modules = estimateModuleCount(contentLength, ec);
  const modulesWithQuietZone = modules + 2 * margin;
  const pxPerModule = size / modulesWithQuietZone;
  if (pxPerModule < 3) {
    issues.push({
      level: "error",
      message: `This much content needs a bigger image. At ${size}px each square is under ${pxPerModule.toFixed(1)}px — shorten the content or increase the size so it prints clearly.`,
    });
  } else if (pxPerModule < 5) {
    issues.push({
      level: "warning",
      message: `Each square is only about ${pxPerModule.toFixed(1)}px at ${size}px. For reliable printing, increase the size or shorten the content.`,
    });
  }

  // Quiet zone — the blank margin scanners rely on to find the code.
  if (margin < 2) {
    issues.push({
      level: "error",
      message: "There is almost no blank margin around the code. Scanners need a quiet zone of at least 4 squares — add more margin.",
    });
  } else if (margin < 4) {
    issues.push({
      level: "warning",
      message: "The blank margin around the code is smaller than recommended (4 squares). Leave extra white space around it when placing it on a design.",
    });
  }

  // Worst (errors) first so the UI can lead with the most important message.
  issues.sort((a, b) => (a.level === b.level ? 0 : a.level === "error" ? -1 : 1));
  return { contrastRatio: ratio, inverted, issues };
}
