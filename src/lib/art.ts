/**
 * Seed artwork.
 *
 * The reference mockups use licensed illustration we can't ship, so the seed
 * project uses generated SVG plates instead — same shapes, same weight on the
 * page. Uploading a real image replaces them.
 */

type Plate = {
  w: number;
  h: number;
  sky: [string, string];
  ground: string;
  accent: string;
  motif: "peaks" | "gate" | "falls" | "forest" | "moon" | "portrait";
};

let plateSeq = 0;

function svg(p: Plate): string {
  const { w, h, sky, ground, accent, motif } = p;
  const id = `p${plateSeq++}`; // deterministic — these strings get persisted
  let art = "";

  if (motif === "peaks") {
    art = `
      <path d="M0 ${h * 0.72} L${w * 0.22} ${h * 0.38} L${w * 0.38} ${h * 0.6} L${w * 0.56} ${h * 0.28} L${w * 0.78} ${h * 0.62} L${w} ${h * 0.44} L${w} ${h} L0 ${h} Z" fill="${ground}"/>
      <path d="M${w * 0.56} ${h * 0.28} L${w * 0.64} ${h * 0.4} L${w * 0.48} ${h * 0.4} Z" fill="${accent}" opacity=".5"/>`;
  } else if (motif === "gate") {
    const gx = w * 0.5;
    art = `
      <ellipse cx="${gx}" cy="${h * 0.86}" rx="${w * 0.6}" ry="${h * 0.16}" fill="${ground}" opacity=".7"/>
      <rect x="${gx - w * 0.19}" y="${h * 0.4}" width="${w * 0.035}" height="${h * 0.42}" fill="${accent}"/>
      <rect x="${gx + w * 0.155}" y="${h * 0.4}" width="${w * 0.035}" height="${h * 0.42}" fill="${accent}"/>
      <rect x="${gx - w * 0.28}" y="${h * 0.36}" width="${w * 0.56}" height="${h * 0.035}" rx="4" fill="${accent}"/>
      <rect x="${gx - w * 0.23}" y="${h * 0.46}" width="${w * 0.46}" height="${h * 0.028}" fill="${accent}"/>`;
  } else if (motif === "falls") {
    art = `
      <path d="M0 ${h * 0.34} L${w * 0.34} ${h * 0.3} L${w * 0.4} ${h} L0 ${h} Z" fill="${ground}"/>
      <path d="M${w} ${h * 0.3} L${w * 0.68} ${h * 0.26} L${w * 0.62} ${h} L${w} ${h} Z" fill="${ground}"/>
      <rect x="${w * 0.4}" y="${h * 0.3}" width="${w * 0.22}" height="${h * 0.62}" fill="${accent}" opacity=".55"/>
      <rect x="${w * 0.34}" y="${h * 0.42}" width="${w * 0.34}" height="${h * 0.035}" fill="${accent}" opacity=".9"/>`;
  } else if (motif === "forest") {
    const trees = Array.from({ length: 9 }, (_, i) => {
      const x = (w / 9) * i + w / 18;
      const t = h * (0.3 + ((i * 37) % 11) / 40);
      return `<path d="M${x} ${t} L${x + w * 0.055} ${h * 0.9} L${x - w * 0.055} ${h * 0.9} Z" fill="${i % 3 === 0 ? accent : ground}" opacity="${0.5 + (i % 4) * 0.12}"/>`;
    }).join("");
    art = `<rect x="0" y="${h * 0.86}" width="${w}" height="${h * 0.14}" fill="${ground}"/>${trees}`;
  } else if (motif === "moon") {
    art = `
      <circle cx="${w * 0.5}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.2}" fill="none" stroke="${accent}" stroke-width="2.5" opacity=".85"/>
      <circle cx="${w * 0.5}" cy="${h * 0.42}" r="${Math.min(w, h) * 0.13}" fill="${accent}" opacity=".22"/>
      <path d="M0 ${h * 0.78} L${w * 0.3} ${h * 0.6} L${w * 0.55} ${h * 0.75} L${w * 0.8} ${h * 0.58} L${w} ${h * 0.74} L${w} ${h} L0 ${h} Z" fill="${ground}"/>`;
  } else {
    // portrait — a figure silhouette, deliberately abstract
    art = `
      <circle cx="${w * 0.5}" cy="${h * 0.36}" r="${Math.min(w, h) * 0.15}" fill="${ground}"/>
      <path d="M${w * 0.5} ${h * 0.5} C${w * 0.2} ${h * 0.52} ${w * 0.16} ${h * 0.78} ${w * 0.14} ${h} L${w * 0.86} ${h} C${w * 0.84} ${h * 0.78} ${w * 0.8} ${h * 0.52} ${w * 0.5} ${h * 0.5} Z" fill="${ground}"/>
      <path d="M${w * 0.5} ${h * 0.5} L${w * 0.5} ${h}" stroke="${accent}" stroke-width="2" opacity=".5"/>`;
  }

  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
<defs><linearGradient id="g${id}" x1="0" y1="0" x2="0" y2="1">
<stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/>
</linearGradient></defs>
<rect width="${w}" height="${h}" fill="url(#g${id})"/>
${art}
<rect width="${w}" height="${h}" fill="#000" opacity=".12"/>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;
}

export const PLATES = {
  haven: () =>
    svg({
      w: 900,
      h: 540,
      sky: ["#2b3f7a", "#7b5fa8"],
      ground: "#16233f",
      accent: "#7fd8ff",
      motif: "falls",
    }),
  havenDusk: () =>
    svg({
      w: 900,
      h: 540,
      sky: ["#3a2340", "#7d3350"],
      ground: "#1d1220",
      accent: "#ff9ec4",
      motif: "forest",
    }),
  havenDawn: () =>
    svg({
      w: 900,
      h: 540,
      sky: ["#48364f", "#c78ba0"],
      ground: "#241a2b",
      accent: "#ffd2e0",
      motif: "peaks",
    }),
  gate: () =>
    svg({
      w: 900,
      h: 600,
      sky: ["#2f3a3c", "#6d7c7a"],
      ground: "#1a2122",
      accent: "#0d1214",
      motif: "gate",
    }),
  eclipse: () =>
    svg({
      w: 900,
      h: 560,
      sky: ["#101318", "#2a3038"],
      ground: "#0a0c0f",
      accent: "#cfe6ff",
      motif: "moon",
    }),
  shrine: () =>
    svg({
      w: 900,
      h: 560,
      sky: ["#3d2b2b", "#8a3a35"],
      ground: "#1b1010",
      accent: "#ff6b5e",
      motif: "peaks",
    }),
  hero: () =>
    svg({
      w: 700,
      h: 900,
      sky: ["#1e242e", "#3d4653"],
      ground: "#0d1117",
      accent: "#7fd8ff",
      motif: "portrait",
    }),
  elder: () =>
    svg({
      w: 700,
      h: 820,
      sky: ["#2a2118", "#5a4632"],
      ground: "#140f0a",
      accent: "#ffcf8f",
      motif: "portrait",
    }),
  knight: () =>
    svg({
      w: 700,
      h: 940,
      sky: ["#20222b", "#454a5c"],
      ground: "#0e0f14",
      accent: "#b8c4ff",
      motif: "portrait",
    }),
  rival: () =>
    svg({
      w: 700,
      h: 780,
      sky: ["#2b1a24", "#6b2f45"],
      ground: "#130b10",
      accent: "#ff9ec4",
      motif: "portrait",
    }),
};
