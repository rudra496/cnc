// CNC Simulator Pro — Machine Architectures & Specifications

export type MachineType = "vmc_3axis" | "lathe_cnc" | "hmc_4axis" | "gantry_router";

export interface CncMachineSpec {
  id: MachineType;
  name: string;
  shortName: string;
  category: "Milling" | "Turning" | "Routing";
  description: string;
  spindleMaxRpm: number;
  rapidFeed: number; // mm/min
  maxTravel: { x: number; y: number; z: number }; // mm
  toolChangerCapacity: number;
  supportedGCode: string[];
  iconName: string;
}

export const MACHINE_CATALOG: CncMachineSpec[] = [
  {
    id: "vmc_3axis",
    name: "Vertical Machining Center (3-Axis VMC)",
    shortName: "3-Axis VMC",
    category: "Milling",
    description: "Standard Fanuc-style 3-axis vertical CNC milling machine with rigid box column and automatic tool changer.",
    spindleMaxRpm: 12000,
    rapidFeed: 24000,
    maxTravel: { x: 600, y: 400, z: 400 },
    toolChangerCapacity: 24,
    supportedGCode: ["G00", "G01", "G02", "G03", "G81", "G82", "G83", "G73", "G90", "G91"],
    iconName: "Cpu",
  },
  {
    id: "lathe_cnc",
    name: "CNC Turning Center (Lathe NC)",
    shortName: "CNC Lathe",
    category: "Turning",
    description: "Slant-bed CNC lathe with 8-station tool turret, 3-jaw hydraulic chuck, and tailstock for rotational turning operations.",
    spindleMaxRpm: 4500,
    rapidFeed: 18000,
    maxTravel: { x: 200, y: 0, z: 500 },
    toolChangerCapacity: 8,
    supportedGCode: ["G00", "G01", "G02", "G03", "G33", "G70", "G71", "G76", "G96", "G97"],
    iconName: "RotateCw",
  },
  {
    id: "hmc_4axis",
    name: "Horizontal Machining Center (HMC)",
    shortName: "4-Axis HMC",
    category: "Milling",
    description: "High-productivity horizontal spindle CNC mill with B-axis rotary index table and tombstone workholding fixture.",
    spindleMaxRpm: 15000,
    rapidFeed: 30000,
    maxTravel: { x: 500, y: 500, z: 500 },
    toolChangerCapacity: 40,
    supportedGCode: ["G00", "G01", "G02", "G03", "G81", "G83", "G90", "G91", "G00 B..."],
    iconName: "Layers",
  },
  {
    id: "gantry_router",
    name: "High-Speed CNC Gantry Router",
    shortName: "CNC Router",
    category: "Routing",
    description: "Open-format high-speed CNC router for aluminum, plastics, composites, and wood with vacuum bed table.",
    spindleMaxRpm: 24000,
    rapidFeed: 36000,
    maxTravel: { x: 1200, y: 800, z: 200 },
    toolChangerCapacity: 10,
    supportedGCode: ["G00", "G01", "G02", "G03", "G90", "G91"],
    iconName: "Box",
  },
];

export function getMachineById(id: MachineType): CncMachineSpec {
  return MACHINE_CATALOG.find((m) => m.id === id) ?? MACHINE_CATALOG[0];
}
