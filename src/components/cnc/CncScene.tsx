"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  ContactShadows,
  Grid,
  Line,
  Environment,
  Lightformer,
  Html,
  Edges,
} from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useSimStore } from "@/lib/cnc/store";
import { useViewStore } from "@/lib/cnc/viewStore";
import {
  createTopSurface,
  buildCumulativeHeightmaps,
  applyPartialCut,
  buildToolpathLines,
  type TopSurface,
} from "@/lib/cnc/carve";
import { toolRadius, getToolByNumber, type CncTool } from "@/lib/cnc/tools";
import { getMaterialById } from "@/lib/cnc/materials";
import type { Move } from "@/lib/cnc/types";

const TOOL_FALLBACK: CncTool = {
  number: 1,
  name: "End Mill Ø6",
  type: "end_mill",
  diameter: 6,
  length: 20,
  flutes: 3,
  shankDiameter: 6,
  color: "#e8c878",
  surfaceSpeed: 250,
  chipLoad: 0.05,
  description: "Default end mill",
};

// ---------- material helper ----------
function useMetal(color: string, rough = 0.35, metal = 0.9) {
  return useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: rough,
        metalness: metal,
      }),
    [color, rough, metal],
  );
}

// ---------- Tool geometry (renders per tool type) ----------

// ---------- Toolpath lines ----------
function Toolpath() {
  const parseResult = useSimStore((s) => s.parseResult);
  const show = useViewStore((s) => s.showToolpath);
  const { feedPoints, rapidPoints } = useMemo(() => {
    if (!parseResult)
      return { feedPoints: [] as THREE.Vector3[], rapidPoints: [] as THREE.Vector3[] };
    return buildToolpathLines(parseResult.moves);
  }, [parseResult]);

  if (!show) return null;
  return (
    <group>
      {feedPoints.length >= 2 && (
        <Line
          points={feedPoints}
          color="#22d3ee"
          lineWidth={2}
          transparent
          opacity={0.9}
        />
      )}
      {rapidPoints.length >= 2 && (
        <Line
          points={rapidPoints}
          color="#f59e0b"
          lineWidth={1.2}
          dashed
          dashSize={3}
          gapSize={2}
          transparent
          opacity={0.55}
        />
      )}
    </group>
  );
}

// ---------- Tool geometry (renders per tool type) ----------
function ToolGeometry({ tool, toolLen, mat }: { tool: CncTool; toolLen: number; mat: THREE.Material }) {
  const r = tool.diameter / 2;
  switch (tool.type) {
    case "end_mill":
      return (
        <group>
          {/* shank */}
          <mesh position={[0, toolLen * 0.7, 0]} castShadow>
            <cylinderGeometry args={[tool.shankDiameter / 2, tool.shankDiameter / 2, toolLen * 0.6, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* flutes (slightly tapered) */}
          <mesh position={[0, toolLen * 0.25, 0]} castShadow>
            <cylinderGeometry args={[r + 0.2, r, toolLen * 0.5, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* flat tip */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[r, r, 0.4, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
        </group>
      );
    case "ball_nose":
      return (
        <group>
          <mesh position={[0, toolLen * 0.6, 0]} castShadow>
            <cylinderGeometry args={[tool.shankDiameter / 2, tool.shankDiameter / 2, toolLen * 0.6, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          <mesh position={[0, toolLen * 0.25, 0]} castShadow>
            <cylinderGeometry args={[r, r, toolLen * 0.5, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* ball tip */}
          <mesh position={[0, 0, 0]} castShadow>
            <sphereGeometry args={[r, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <primitive object={mat} attach="material" />
          </mesh>
        </group>
      );
    case "drill":
    case "reamer":
      return (
        <group>
          <mesh position={[0, toolLen * 0.6, 0]} castShadow>
            <cylinderGeometry args={[tool.shankDiameter / 2, tool.shankDiameter / 2, toolLen * 0.5, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          <mesh position={[0, toolLen * 0.25, 0]} castShadow>
            <cylinderGeometry args={[r, r, toolLen * 0.55, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* pointed tip */}
          <mesh position={[0, 0.5, 0]} castShadow>
            <coneGeometry args={[r, r * 1.6, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
        </group>
      );
    case "chamfer":
    case "spot_drill":
      return (
        <group>
          <mesh position={[0, toolLen * 0.65, 0]} castShadow>
            <cylinderGeometry args={[tool.shankDiameter / 2, tool.shankDiameter / 2, toolLen * 0.5, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* 90° chamfer body */}
          <mesh position={[0, toolLen * 0.2, 0]} castShadow>
            <cylinderGeometry args={[r, 1, toolLen * 0.4, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          <mesh position={[0, 0.5, 0]} castShadow>
            <coneGeometry args={[r, r * 1.5, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
        </group>
      );
    case "face_mill":
      return (
        <group>
          <mesh position={[0, toolLen * 0.6, 0]} castShadow>
            <cylinderGeometry args={[tool.shankDiameter / 2, tool.shankDiameter / 2, toolLen * 0.6, 16]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* big body */}
          <mesh position={[0, toolLen * 0.2, 0]} castShadow>
            <cylinderGeometry args={[r, r, toolLen * 0.3, 24]} />
            <primitive object={mat} attach="material" />
          </mesh>
          {/* insert cutters (5) */}
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * r * 0.8, 0.1, Math.sin(a) * r * 0.8]} castShadow>
                <boxGeometry args={[3, 1, 2]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.95} />
              </mesh>
            );
          })}
        </group>
      );
    default:
      return (
        <mesh position={[0, toolLen / 2, 0]} castShadow>
          <cylinderGeometry args={[r, r, toolLen, 16]} />
          <primitive object={mat} attach="material" />
        </mesh>
      );
  }
}

// ---------- Spindle head (gantry, moving) ----------
function SpindleHead() {
  const workpiece = useSimStore((s) => s.workpiece);
  const pos = useSimStore((s) => s.position);
  const spindleOn = useSimStore((s) => s.spindleOn);
  const spindleDir = useSimStore((s) => s.spindleDir);
  const spindleRpm = useSimStore((s) => s.spindleRpm);
  const coolant = useSimStore((s) => s.coolant);
  const toolNum = useSimStore((s) => s.tool);

  const bridgeY = workpiece.height + 70;

  const toolRef = useRef<THREE.Group>(null);
  const quillRef = useRef<THREE.Mesh>(null);
  const bridgeRef = useRef<THREE.Group>(null);
  const carriageRef = useRef<THREE.Group>(null);
  const spinAccum = useRef(0);

  const toolDef = useMemo(
    () => getToolByNumber(toolNum) ?? TOOL_FALLBACK,
    [toolNum],
  );
  const toolLen = Math.max(14, Math.min(36, toolDef.length));

  const housingMat = useMetal("#3a3f47", 0.4, 0.8);
  const motorMat = useMetal("#22262c", 0.5, 0.7);
  const quillMat = useMetal("#b8bec7", 0.25, 0.95);
  const toolMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: toolDef.color,
        roughness: 0.25,
        metalness: 0.95,
        emissive: new THREE.Color(toolDef.color).multiplyScalar(0.15),
        emissiveIntensity: 0.4,
      }),
    [toolDef.color],
  );

  useFrame((_, dt) => {
    if (bridgeRef.current) bridgeRef.current.position.z = -pos.y;
    if (carriageRef.current) carriageRef.current.position.x = pos.x;
    const length = Math.max(4, bridgeY - pos.z - toolLen);
    if (quillRef.current) {
      quillRef.current.scale.y = length;
      quillRef.current.position.y = -length / 2;
    }
    if (toolRef.current && spindleOn) {
      const visibleSpeed = Math.min(spindleRpm, 3000) / 3000;
      spinAccum.current += dt * spindleDir * (4 + visibleSpeed * 14);
      toolRef.current.rotation.y = spinAccum.current;
    }
  });

  // tool group local Y (relative to carriage) so tip lands at world Y = pos.z
  const tipLocalY = pos.z - bridgeY;

  return (
    <group ref={bridgeRef} position={[0, bridgeY, 0]}>
      {/* bridge beam */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[280, 16, 22]} />
        <primitive object={housingMat} attach="material" />
      </mesh>
      <mesh position={[-140, 0, 0]} castShadow>
        <boxGeometry args={[26, 30, 40]} />
        <primitive object={motorMat} attach="material" />
      </mesh>
      <mesh position={[140, 0, 0]} castShadow>
        <boxGeometry args={[26, 30, 40]} />
        <primitive object={motorMat} attach="material" />
      </mesh>

      {/* carriage (moves in X) */}
      <group ref={carriageRef} position={[0, 0, 0]}>
        {/* spindle motor housing (fixed at bridge level) */}
        <mesh position={[0, 18, 0]} castShadow>
          <cylinderGeometry args={[16, 16, 22, 24]} />
          <primitive object={motorMat} attach="material" />
        </mesh>
        <mesh position={[0, 30, 0]} castShadow>
          <cylinderGeometry args={[10, 12, 8, 20]} />
          <primitive object={motorMat} attach="material" />
        </mesh>
        {/* carriage clamp body */}
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[48, 22, 30]} />
          <primitive object={housingMat} attach="material" />
        </mesh>

        {/* quill (scales with z) */}
        <mesh ref={quillRef} position={[0, -10, 0]} castShadow>
          <cylinderGeometry args={[7, 7, 1, 20]} />
          <primitive object={quillMat} attach="material" />
        </mesh>

        {/* tool assembly — tip at world Y = pos.z */}
        <group position={[0, tipLocalY, 0]}>
          {/* chuck at tool top */}
          <mesh position={[0, toolLen, 0]}>
            <coneGeometry args={[8, 10, 16]} />
            <primitive object={quillMat} attach="material" />
          </mesh>
          <group ref={toolRef}>
            <ToolGeometry tool={toolDef} toolLen={toolLen} mat={toolMat} />
            <mesh position={[0, toolLen + 2, 0]}>
              <torusGeometry args={[5, 0.6, 8, 24]} />
              <meshStandardMaterial
                color="#22d3ee"
                emissive="#22d3ee"
                emissiveIntensity={0.7}
              />
            </mesh>
          </group>
          {/* coolant stream */}
          {coolant !== "off" && (
            <mesh position={[7, 6, 7]}>
              <cylinderGeometry args={[0.4, 0.2, 16, 8]} />
              <meshStandardMaterial
                color="#7dd3fc"
                transparent
                opacity={0.6}
                emissive="#0ea5e9"
                emissiveIntensity={0.3}
              />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

// ---------- Workpiece (carved) ----------
function Workpiece() {
  const workpiece = useSimStore((s) => s.workpiece);
  const originDatum = useSimStore((s) => s.originDatum);
  const parseResult = useSimStore((s) => s.parseResult);
  const materialId = useSimStore((s) => s.materialId);
  const machineMode = useSimStore((s) => s.machineMode);
  const N = 120; // high-resolution smooth surface (120x120 grid)

  const top = useMemo<TopSurface>(
    () => createTopSurface(workpiece.width, workpiece.depth, N, originDatum),
    [workpiece.width, workpiece.depth, originDatum],
  );

  const cumulative = useMemo(() => {
    if (!parseResult || parseResult.moves.length === 0) return null;
    if (machineMode !== "run") return null;
    return buildCumulativeHeightmaps(parseResult.moves, workpiece, N, toolRadius, originDatum);
  }, [parseResult, workpiece, machineMode, originDatum]);

  const liveRef = useRef<Float32Array | null>(null);
  if (liveRef.current == null) {
    liveRef.current = new Float32Array((N + 1) * (N + 1));
  }
  const lastApplied = useRef<{ idx: number; t: number }>({ idx: -1, t: -1 });

  const currentMoveIndex = useSimStore((s) => s.currentMoveIndex);
  const currentT = useSimStore((s) => s.currentT);

  useEffect(() => {
    lastApplied.current = { idx: -1, t: -1 };
    top.reset();
  }, [cumulative, top]);

  useFrame(() => {
    if (!cumulative || !parseResult || parseResult.moves.length === 0) {
      return;
    }
    const idx = currentMoveIndex;
    const t = currentT;
    if (
      lastApplied.current.idx === idx &&
      Math.abs(lastApplied.current.t - t) < 1e-4
    ) {
      return;
    }
    lastApplied.current = { idx, t };
    const base =
      cumulative[idx] ?? cumulative[cumulative.length - 1];
    const live = liveRef.current!;
    const move: Move | undefined = parseResult.moves[idx];
    applyPartialCut(live, base, move, t, toolRadius, workpiece.width, workpiece.depth, N, originDatum);
    top.applyHeightmap(live);
  });

  const bodyGeom = useMemo(
    () => new THREE.BoxGeometry(workpiece.width, workpiece.height, workpiece.depth),
    [workpiece.width, workpiece.height, workpiece.depth],
  );

  const mat = useMemo(() => getMaterialById(materialId), [materialId]);

  const bodyMats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({
      color: mat.sideColor,
      roughness: 0.45,
      metalness: 0.7,
    });
    const topHidden = new THREE.MeshStandardMaterial({ visible: false });
    const bottom = new THREE.MeshStandardMaterial({
      color: mat.sideColor,
      roughness: 0.5,
      metalness: 0.8,
      side: THREE.DoubleSide,
    });
    return [side, side, topHidden, bottom, side, side]; // px,nx,py,ny,pz,nz
  }, [mat.sideColor]);

  const topMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: mat.color,
        roughness: 0.35,
        metalness: 0.85,
        side: THREE.DoubleSide,
      }),
    [mat.color],
  );

  const bodyPos: [number, number, number] =
    originDatum === "front_left"
      ? [workpiece.width / 2, -workpiece.height / 2, -workpiece.depth / 2]
      : [0, -workpiece.height / 2, 0];

  return (
    <group>
      <mesh
        geometry={bodyGeom}
        material={bodyMats}
        position={bodyPos}
        castShadow
        receiveShadow
      >
        <Edges threshold={5} color="#a0aec0" />
      </mesh>
      <mesh geometry={top.geometry} material={topMat} receiveShadow castShadow />
    </group>
  );
}

// ---------- Machine frame (100% OPEN VIEW — NO SOLID WALLS) ----------
function MachineFrame() {
  const workpiece = useSimStore((s) => s.workpiece);
  const originDatum = useSimStore((s) => s.originDatum);
  const showEnclosure = useViewStore((s) => s.showEnclosure);
  const baseMat = useMetal("#2b2f36", 0.55, 0.6);
  const pillarMat = useMetal("#3b4049", 0.4, 0.8);
  const tableMat = useMetal("#5a6068", 0.5, 0.7);
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#9fdcff",
        roughness: 0.05,
        metalness: 0.1,
        transmission: 0.95,
        thickness: 0.2,
        transparent: true,
        opacity: 0.08,
        ior: 1.4,
      }),
    [],
  );
  const accentMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#f97316",
        roughness: 0.4,
        metalness: 0.4,
        emissive: "#f97316",
        emissiveIntensity: 0.2,
      }),
    [],
  );

  const h = workpiece.height;
  const baseTopY = -h - 18;

  const cx = originDatum === "front_left" ? workpiece.width / 2 : 0;
  const cz = originDatum === "front_left" ? -workpiece.depth / 2 : 0;

  const wOut = Math.max(300, workpiece.width + 120);
  const dOut = Math.max(260, workpiece.depth + 120);

  return (
    <group position={[cx, 0, cz]}>
      {/* open frame base plate */}
      <mesh position={[0, baseTopY - 30, 0]} receiveShadow castShadow>
        <boxGeometry args={[wOut, 20, dOut]} />
        <primitive object={baseMat} attach="material" />
      </mesh>
      {/* T-slot machining bed table */}
      <mesh position={[0, baseTopY - 6, 0]} receiveShadow castShadow>
        <boxGeometry args={[Math.max(240, workpiece.width + 60), 12, Math.max(200, workpiece.depth + 60)]} />
        <primitive object={tableMat} attach="material" />
      </mesh>
      {[-90, -45, 0, 45, 90].map((x) => (
        <mesh key={x} position={[x, baseTopY + 1, 0]}>
          <boxGeometry args={[4, 2, Math.max(194, workpiece.depth + 50)]} />
          <meshStandardMaterial color="#2b2f36" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}

      {/* 4 SLIM CORNER STRUCTURAL POSTS (OPEN 360 VIEW) */}
      {[
        [-wOut / 2 + 12, -dOut / 2 + 12],
        [wOut / 2 - 12, -dOut / 2 + 12],
        [-wOut / 2 + 12, dOut / 2 - 12],
        [wOut / 2 - 12, dOut / 2 - 12],
      ].map(([px, pz], idx) => (
        <mesh key={idx} position={[px, 70, pz]} castShadow receiveShadow>
          <boxGeometry args={[16, 220, 16]} />
          <primitive object={pillarMat} attach="material" />
        </mesh>
      ))}

      {/* top perimeter structural ring (NO SOLID WALLS) */}
      <mesh position={[0, 175, -dOut / 2 + 12]} castShadow>
        <boxGeometry args={[wOut, 16, 16]} />
        <primitive object={pillarMat} attach="material" />
      </mesh>
      <mesh position={[0, 175, dOut / 2 - 12]} castShadow>
        <boxGeometry args={[wOut, 16, 16]} />
        <primitive object={pillarMat} attach="material" />
      </mesh>
      <mesh position={[-wOut / 2 + 12, 175, 0]} castShadow>
        <boxGeometry args={[16, 16, dOut]} />
        <primitive object={pillarMat} attach="material" />
      </mesh>
      <mesh position={[wOut / 2 - 12, 175, 0]} castShadow>
        <boxGeometry args={[16, 16, dOut]} />
        <primitive object={pillarMat} attach="material" />
      </mesh>

      {/* linear guide rail accents */}
      <mesh position={[0, 70, -dOut / 2 + 25]}>
        <boxGeometry args={[wOut - 40, 4, 4]} />
        <primitive object={accentMat} attach="material" />
      </mesh>

      {/* optional see-through safety glass panels */}
      {showEnclosure && (
        <mesh position={[0, 75, dOut / 2 - 6]}>
          <boxGeometry args={[wOut - 30, 200, 2]} />
          <primitive object={glassMat} attach="material" />
        </mesh>
      )}
    </group>
  );
}

// ---------- tool tip marker ----------
function ToolMarker() {
  const pos = useSimStore((s) => s.position);
  const isCutting = useSimStore((s) => s.isCutting);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.position.set(pos.x, pos.z, -pos.y);
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[isCutting ? 3.5 : 2.5, 16, 16]} />
      <meshStandardMaterial
        color={isCutting ? "#f43f5e" : "#22d3ee"}
        emissive={isCutting ? "#f43f5e" : "#22d3ee"}
        emissiveIntensity={0.9}
      />
    </mesh>
  );
}

// ---------- camera preset controller ----------
function CameraController() {
  const { camera, controls } = useThree() as { camera: THREE.Camera; controls: { target: THREE.Vector3; update: () => void } | null };
  const preset = useViewStore((s) => s.cameraPreset);
  const nonce = useViewStore((s) => s.cameraNonce);
  const target = useSimStore((s) => s.workpiece);
  const originDatum = useSimStore((s) => s.originDatum);

  const cx = originDatum === "front_left" ? target.width / 2 : 0;
  const cz = originDatum === "front_left" ? -target.depth / 2 : 0;

  useEffect(() => {
    if (!preset) return;
    const cam = camera as THREE.PerspectiveCamera;
    let pos: [number, number, number] = [cx + 230, 190, cz + 250];
    switch (preset) {
      case "iso":
        pos = [cx + 230, 190, cz + 250];
        break;
      case "top":
        pos = [cx, 420, cz + 0.01];
        break;
      case "bottom":
        pos = [cx, -350, cz + 0.01];
        break;
      case "front":
        pos = [cx, 60, cz + 420];
        break;
      case "right":
        pos = [cx + 420, 60, cz];
        break;
      case "reset":
        pos = [cx + 230, 190, cz + 250];
        break;
    }
    cam.position.set(pos[0], pos[1], pos[2]);
    cam.lookAt(cx, 0, cz);
    if (controls) {
      controls.target.set(cx, 0, cz);
      controls.update();
    }
  }, [preset, nonce, cx, cz]);

  return null;
}

// ---------- scene ----------
function SceneContents() {
  const workpiece = useSimStore((s) => s.workpiece);
  const originDatum = useSimStore((s) => s.originDatum);
  const showGrid = useViewStore((s) => s.showGrid);

  const cx = originDatum === "front_left" ? workpiece.width / 2 : 0;
  const cz = originDatum === "front_left" ? -workpiece.depth / 2 : 0;

  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight
        position={[cx + 140, 220, cz + 140]}
        intensity={2.0}
        castShadow
        shadow-bias={-0.0005}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-240}
        shadow-camera-right={240}
        shadow-camera-top={240}
        shadow-camera-bottom={-240}
        shadow-camera-near={1}
        shadow-camera-far={700}
      />
      <directionalLight position={[cx - 120, 90, cz - 70]} intensity={0.6} color="#9fdcff" />
      <pointLight position={[cx, 150, cz + 90]} intensity={0.6} color="#fff7ed" />
      {/* Underside Light for crystal clear bottom inspection */}
      <pointLight position={[cx, -180, cz]} intensity={1.8} color="#ffffff" />

      <Environment resolution={256}>
        <Lightformer intensity={2} position={[cx, 130, cz]} scale={[220, 220, 1]} color="#ffffff" />
        <Lightformer intensity={1.2} position={[cx - 130, 70, cz + 90]} scale={[80, 130, 1]} color="#bcd4ff" />
        <Lightformer intensity={1.2} position={[cx + 130, 70, cz - 90]} scale={[80, 130, 1]} color="#ffd9b3" />
      </Environment>

      <MachineFrame />
      <Workpiece />
      <Toolpath />
      <SpindleHead />
      <ToolMarker />

      <ContactShadows
        position={[cx, -workpiece.height - 12, cz]}
        opacity={0.4}
        scale={420}
        blur={2.4}
        far={130}
        resolution={1024}
      />

      <Grid
        position={[cx, -workpiece.height - 12.5, cz]}
        args={[700, 700]}
        cellSize={10}
        cellThickness={0.6}
        cellColor="#3b4049"
        sectionSize={50}
        sectionThickness={1.2}
        sectionColor="#f97316"
        fadeDistance={460}
        fadeStrength={1}
        infiniteGrid
        visible={showGrid}
      />

      <OrbitControls
        makeDefault
        target={[cx, 0, cz]}
        minDistance={10}
        maxDistance={1000}
        minPolarAngle={0.01}
        maxPolarAngle={Math.PI * 0.98}
        enableDamping
        dampingFactor={0.08}
      />
      <CameraController />
    </>
  );
}

export default function CncScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 3]}
      camera={{ position: [230, 190, 250], fov: 38, near: 1, far: 3000 }}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    >
      <color attach="background" args={["#0b0d10"]} />
      <fog attach="fog" args={["#0b0d10", 400, 820]} />
      <SceneContents />
      <ViewportHint />
    </Canvas>
  );
}

function ViewportHint() {
  const { camera } = useThree();
  void camera;
  return (
    <Html position={[0, -90, 0]} center distanceFactor={280} occlude={false}>
      <div
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          color: "#64748b",
          whiteSpace: "nowrap",
          transform: "translateY(46px)",
          pointerEvents: "none",
          letterSpacing: 1,
        }}
      >
        ◆ DRAG TO ORBIT · SCROLL TO ZOOM ◆
      </div>
    </Html>
  );
}
