// CNC Simulator Pro — view/UI options store (separate from sim state)
"use client";

import { create } from "zustand";

export type CameraPreset = "iso" | "top" | "front" | "right" | "reset";

export interface ViewState {
  showToolpath: boolean;
  showGrid: boolean;
  showEnclosure: boolean;
  showAxes: boolean;
  resetKey: number; // bump to remount canvas (resets camera)
  cameraPreset: CameraPreset | null; // set to trigger camera move
  cameraNonce: number; // bump to re-apply same preset
  resetView: () => void;
  setCameraPreset: (p: CameraPreset) => void;
  toggle: (k: "showToolpath" | "showGrid" | "showEnclosure" | "showAxes") => void;
}

export const useViewStore = create<ViewState>((set) => ({
  showToolpath: true,
  showGrid: true,
  showEnclosure: true,
  showAxes: true,
  resetKey: 0,
  cameraPreset: null,
  cameraNonce: 0,
  resetView: () => set((s) => ({ resetKey: s.resetKey + 1 })),
  setCameraPreset: (p) =>
    set((s) => ({ cameraPreset: p, cameraNonce: s.cameraNonce + 1 })),
  toggle: (k) => set((s) => ({ [k]: !s[k] }) as Partial<ViewState>),
}));
