// CNC Simulator Pro — Material library
// Provides recommended cutting parameters per material (aluminum baseline).

export interface CncMaterial {
  id: string;
  name: string;
  color: string; // workpiece color in 3D
  sideColor: string;
  density: number; // g/cm³
  // cutting parameters (for Ø6 carbide end mill baseline)
  surfaceSpeed: number; // Vc m/min
  chipLoad: number; // fz mm/tooth
  maxDepthOfCut: number; // axial Ae mm
  maxStepover: number; // radial % of diameter
  coolant: "flood" | "mist" | "air" | "none";
  notes: string;
}

export const MATERIAL_LIBRARY: CncMaterial[] = [
  {
    id: "aluminum-6061",
    name: "Aluminum 6061-T6",
    color: "#c8ced6",
    sideColor: "#9aa3ad",
    density: 2.7,
    surfaceSpeed: 250,
    chipLoad: 0.05,
    maxDepthOfCut: 6,
    maxStepover: 50,
    coolant: "flood",
    notes: "Soft, gummy. Use sharp carbide, generous chip load, flood coolant. Avoid rubbing.",
  },
  {
    id: "aluminum-7075",
    name: "Aluminum 7075-T6",
    color: "#c0c6cf",
    sideColor: "#929aa3",
    density: 2.81,
    surfaceSpeed: 200,
    chipLoad: 0.045,
    maxDepthOfCut: 5,
    maxStepover: 45,
    coolant: "flood",
    notes: "Harder than 6061, machines beautifully. Aerospace alloy.",
  },
  {
    id: "steel-mild",
    name: "Mild Steel 1018",
    color: "#8a8f96",
    sideColor: "#6c7077",
    density: 7.87,
    surfaceSpeed: 90,
    chipLoad: 0.04,
    maxDepthOfCut: 3,
    maxStepover: 30,
    coolant: "flood",
    notes: "Tough. Lower speeds, rigid setup. Watch for work-hardening.",
  },
  {
    id: "steel-stainless",
    name: "Stainless 304",
    color: "#aab0b6",
    sideColor: "#84898f",
    density: 8.0,
    surfaceSpeed: 70,
    chipLoad: 0.03,
    maxDepthOfCut: 2,
    maxStepover: 25,
    coolant: "flood",
    notes: "Work-hardens fast. Keep chip load up, don't dwell. Sharp tool mandatory.",
  },
  {
    id: "brass",
    name: "Brass C360",
    color: "#d4af37",
    sideColor: "#b8962e",
    density: 8.5,
    surfaceSpeed: 300,
    chipLoad: 0.06,
    maxDepthOfCut: 6,
    maxStepover: 50,
    coolant: "air",
    notes: "Free-machining brass. Beautiful finish, no coolant needed (air blast).",
  },
  {
    id: "copper",
    name: "Copper C110",
    color: "#b87333",
    sideColor: "#9c622b",
    density: 8.96,
    surfaceSpeed: 150,
    chipLoad: 0.04,
    maxDepthOfCut: 4,
    maxStepover: 35,
    coolant: "flood",
    notes: "Soft & gummy. Sharp polished tools, low rubbing. Flood coolant.",
  },
  {
    id: "delrin",
    name: "Delrin (POM)",
    color: "#f0f0f0",
    sideColor: "#d4d4d4",
    density: 1.42,
    surfaceSpeed: 200,
    chipLoad: 0.08,
    maxDepthOfCut: 8,
    maxStepover: 60,
    coolant: "air",
    notes: "Engineering plastic. High chip load, air blast. Melts if too slow.",
  },
  {
    id: "wood-oak",
    name: "Oak (hardwood)",
    color: "#9b6e3a",
    sideColor: "#7d5629",
    density: 0.75,
    surfaceSpeed: 400,
    chipLoad: 0.1,
    maxDepthOfCut: 10,
    maxStepover: 50,
    coolant: "none",
    notes: "Hardwood. High speed, sharp tool. Dust extraction over coolant.",
  },
];

export function getMaterialById(id: string): CncMaterial {
  return MATERIAL_LIBRARY.find((m) => m.id === id) ?? MATERIAL_LIBRARY[0];
}
