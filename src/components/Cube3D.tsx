/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { FaceName, COLOR_DEFS } from '../cube/types';
import { RotateCw, RotateCcw, Eye, Sparkles } from 'lucide-react';

interface Cube3DProps {
  facelets: FaceName[];
  selectedBrush: FaceName | null;
  onFaceletClick?: (faceletIndex: number) => void;
  animatingMove?: string | null;
  animationProgress?: number; // 0 to 1
  isInteractive?: boolean;
}

// 54 Facelet to (x, y, z, faceDirection) mapping
// Coordinate system:
// X: Left (-1) to Right (+1)
// Y: Down (-1) to Up (+1)
// Z: Back (-1) to Front (+1)

interface Facelet3DMap {
  faceletIndex: number;
  x: number;
  y: number;
  z: number;
  dir: 'U' | 'R' | 'F' | 'D' | 'L' | 'B';
  materialIndex: number; // Three.js BoxGeometry material order: 0: +X(R), 1: -X(L), 2: +Y(U), 3: -Y(D), 4: +Z(F), 5: -Z(B)
}

const FACELET_MAP_3D: Facelet3DMap[] = [];

// Populate mapping
// U face (Y = +1): 3x3 grid (Z from -1 to +1, X from -1 to +1)
// Row 0: Z=-1, X=-1,0,1 -> 0, 1, 2
// Row 1: Z= 0, X=-1,0,1 -> 3, 4, 5
// Row 2: Z= 1, X=-1,0,1 -> 6, 7, 8
for (let r = 0; r < 3; r++) {
  const z = -1 + r;
  for (let c = 0; c < 3; c++) {
    const x = -1 + c;
    const idx = r * 3 + c; // 0..8
    FACELET_MAP_3D.push({ faceletIndex: idx, x, y: 1, z, dir: 'U', materialIndex: 2 });
  }
}

// R face (X = +1): 3x3 grid (Y from +1 to -1, Z from +1 to -1)
// Row 0: Y= 1, Z= 1,0,-1 -> 9, 10, 11
// Row 1: Y= 0, Z= 1,0,-1 -> 12, 13, 14
// Row 2: Y=-1, Z= 1,0,-1 -> 15, 16, 17
for (let r = 0; r < 3; r++) {
  const y = 1 - r;
  for (let c = 0; c < 3; c++) {
    const z = 1 - c;
    const idx = 9 + r * 3 + c;
    FACELET_MAP_3D.push({ faceletIndex: idx, x: 1, y, z, dir: 'R', materialIndex: 0 });
  }
}

// F face (Z = +1): 3x3 grid (Y from +1 to -1, X from -1 to +1)
// Row 0: Y= 1, X=-1,0,1 -> 18, 19, 20
// Row 1: Y= 0, X=-1,0,1 -> 21, 22, 23
// Row 2: Y=-1, X=-1,0,1 -> 24, 25, 26
for (let r = 0; r < 3; r++) {
  const y = 1 - r;
  for (let c = 0; c < 3; c++) {
    const x = -1 + c;
    const idx = 18 + r * 3 + c;
    FACELET_MAP_3D.push({ faceletIndex: idx, x, y, z: 1, dir: 'F', materialIndex: 4 });
  }
}

// D face (Y = -1): 3x3 grid (Z from +1 to -1, X from -1 to +1)
// Row 0: Z= 1, X=-1,0,1 -> 27, 28, 29
// Row 1: Z= 0, X=-1,0,1 -> 30, 31, 32
// Row 2: Z=-1, X=-1,0,1 -> 33, 34, 35
for (let r = 0; r < 3; r++) {
  const z = 1 - r;
  for (let c = 0; c < 3; c++) {
    const x = -1 + c;
    const idx = 27 + r * 3 + c;
    FACELET_MAP_3D.push({ faceletIndex: idx, x, y: -1, z, dir: 'D', materialIndex: 3 });
  }
}

// L face (X = -1): 3x3 grid (Y from +1 to -1, Z from -1 to +1)
// Row 0: Y= 1, Z=-1,0,1 -> 36, 37, 38
// Row 1: Y= 0, Z=-1,0,1 -> 39, 40, 41
// Row 2: Y=-1, Z=-1,0,1 -> 42, 43, 44
for (let r = 0; r < 3; r++) {
  const y = 1 - r;
  for (let c = 0; c < 3; c++) {
    const z = -1 + c;
    const idx = 36 + r * 3 + c;
    FACELET_MAP_3D.push({ faceletIndex: idx, x: -1, y, z, dir: 'L', materialIndex: 1 });
  }
}

// B face (Z = -1): 3x3 grid (Y from +1 to -1, X from +1 to -1)
// Row 0: Y= 1, X= 1,0,-1 -> 45, 46, 47
// Row 1: Y= 0, X= 1,0,-1 -> 48, 49, 50
// Row 2: Y=-1, X= 1,0,-1 -> 51, 52, 53
for (let r = 0; r < 3; r++) {
  const y = 1 - r;
  for (let c = 0; c < 3; c++) {
    const x = 1 - c;
    const idx = 45 + r * 3 + c;
    FACELET_MAP_3D.push({ faceletIndex: idx, x, y, z: -1, dir: 'B', materialIndex: 5 });
  }
}

const COLOR_MAP: Record<FaceName, number> = {
  U: 0xffffff, // White
  R: 0xdc2626, // Red
  F: 0x16a34a, // Green
  D: 0xfacc15, // Yellow
  L: 0xea580c, // Orange
  B: 0x2563eb, // Blue
};

const INNER_BLACK = 0x18181b; // Zinc 900 plastic core

export const Cube3D: React.FC<Cube3DProps> = ({
  facelets,
  selectedBrush,
  onFaceletClick,
  isInteractive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cubeGroupRef = useRef<THREE.Group | null>(null);
  const cubieMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const hoveredFaceletRef = useRef<number | null>(null);
  const [hoveredFacelet, setHoveredFacelet] = useState<number | null>(null);

  // Rotation control
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const cubeRotationRef = useRef({ x: 0.45, y: -0.65 });
  const targetRotationRef = useRef({ x: 0.45, y: -0.65 });

  // Init Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.1);
    dirLight1.position.set(5, 8, 7);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight2.position.set(-5, -6, -5);
    scene.add(dirLight2);

    // Master cube group
    const cubeGroup = new THREE.Group();
    cubeGroupRef.current = cubeGroup;
    scene.add(cubeGroup);

    // Create 27 cubies
    const cubieGeometry = new THREE.BoxGeometry(0.95, 0.95, 0.95);
    const cubieMeshes = new Map<string, THREE.Mesh>();

    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          // 6 materials for each box face
          const materials: THREE.MeshStandardMaterial[] = [];
          for (let m = 0; m < 6; m++) {
            materials.push(
              new THREE.MeshStandardMaterial({
                color: INNER_BLACK,
                roughness: 0.28,
                metalness: 0.1,
              })
            );
          }

          const mesh = new THREE.Mesh(cubieGeometry, materials);
          mesh.position.set(x * 0.98, y * 0.98, z * 0.98);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          mesh.userData = { x, y, z };

          cubeGroup.add(mesh);
          cubieMeshes.set(`${x},${y},${z}`, mesh);
        }
      }
    }
    cubieMeshesRef.current = cubieMeshes;

    // Render loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth damping on cube rotation
      cubeRotationRef.current.x += (targetRotationRef.current.x - cubeRotationRef.current.x) * 0.12;
      cubeRotationRef.current.y += (targetRotationRef.current.y - cubeRotationRef.current.y) * 0.12;

      if (cubeGroupRef.current) {
        cubeGroupRef.current.rotation.x = cubeRotationRef.current.x;
        cubeGroupRef.current.rotation.y = cubeRotationRef.current.y;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Update Facelet Colors whenever facelets array changes
  useEffect(() => {
    const cubieMeshes = cubieMeshesRef.current;
    if (!cubieMeshes || cubieMeshes.size === 0) return;

    // Reset outer face colors based on facelet map
    for (const mapping of FACELET_MAP_3D) {
      const { faceletIndex, x, y, z, materialIndex } = mapping;
      const mesh = cubieMeshes.get(`${x},${y},${z}`);
      if (!mesh) continue;

      const faceName = facelets[faceletIndex];
      const colorHex = COLOR_MAP[faceName] || 0xffffff;
      const materials = mesh.material as THREE.MeshStandardMaterial[];

      if (materials && materials[materialIndex]) {
        materials[materialIndex].color.setHex(colorHex);
        materials[materialIndex].needsUpdate = true;
      }
    }
  }, [facelets]);

  // Raycasting for Facelet Clicks and Hover
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - prevMousePosRef.current.x;
      const dy = e.clientY - prevMousePosRef.current.y;

      targetRotationRef.current.y += dx * 0.008;
      targetRotationRef.current.x += dy * 0.008;

      // Restrict pitch to avoid gimbal lock
      targetRotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotationRef.current.x));

      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    } else if (isInteractive && containerRef.current && cameraRef.current && sceneRef.current) {
      // Raycasting for hover
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      if (cubeGroupRef.current) {
        const intersects = raycaster.intersectObjects(cubeGroupRef.current.children);
        if (intersects.length > 0) {
          const hit = intersects[0];
          const mesh = hit.object as THREE.Mesh;
          const materialIndex = hit.face?.materialIndex;

          if (materialIndex !== undefined && mesh.userData) {
            const { x, y, z } = mesh.userData;
            const mapped = FACELET_MAP_3D.find(
              m => m.x === x && m.y === y && m.z === z && m.materialIndex === materialIndex
            );

            if (mapped && mapped.faceletIndex !== hoveredFaceletRef.current) {
              hoveredFaceletRef.current = mapped.faceletIndex;
              setHoveredFacelet(mapped.faceletIndex);
              return;
            }
          }
        }
      }

      if (hoveredFaceletRef.current !== null) {
        hoveredFaceletRef.current = null;
        setHoveredFacelet(null);
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const moved = Math.hypot(e.clientX - prevMousePosRef.current.x, e.clientY - prevMousePosRef.current.y);
    isDraggingRef.current = false;

    // If it was a quick click without drag
    if (moved < 5 && isInteractive && containerRef.current && cameraRef.current && cubeGroupRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      const intersects = raycaster.intersectObjects(cubeGroupRef.current.children);
      if (intersects.length > 0) {
        const hit = intersects[0];
        const mesh = hit.object as THREE.Mesh;
        const materialIndex = hit.face?.materialIndex;

        if (materialIndex !== undefined && mesh.userData) {
          const { x, y, z } = mesh.userData;
          const mapped = FACELET_MAP_3D.find(
            m => m.x === x && m.y === y && m.z === z && m.materialIndex === materialIndex
          );

          if (mapped && onFaceletClick) {
            onFaceletClick(mapped.faceletIndex);
          }
        }
      }
    }
  };

  const setViewPreset = useCallback((preset: 'iso' | 'front' | 'top' | 'back' | 'right') => {
    switch (preset) {
      case 'iso':
        targetRotationRef.current = { x: 0.45, y: -0.65 };
        break;
      case 'front':
        targetRotationRef.current = { x: 0, y: 0 };
        break;
      case 'top':
        targetRotationRef.current = { x: Math.PI / 2.2, y: 0 };
        break;
      case 'back':
        targetRotationRef.current = { x: 0, y: Math.PI };
        break;
      case 'right':
        targetRotationRef.current = { x: 0, y: -Math.PI / 2 };
        break;
    }
  }, []);

  return (
    <div id="cube-3d-wrapper" className="relative w-full h-full flex flex-col items-center justify-center select-none">
      {/* 3D WebGL Canvas Container */}
      <div
        id="cube-3d-canvas"
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing min-h-[300px] touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => {
          isDraggingRef.current = false;
          setHoveredFacelet(null);
        }}
      />

      {/* Floating View Controls */}
      <div id="cube-view-presets" className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm pointer-events-auto">
          <span className="text-[11px] font-medium text-slate-500 px-1 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            视角:
          </span>
          <button
            id="btn-view-iso"
            type="button"
            onClick={() => setViewPreset('iso')}
            className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            立体
          </button>
          <button
            id="btn-view-front"
            type="button"
            onClick={() => setViewPreset('front')}
            className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            前(F)
          </button>
          <button
            id="btn-view-top"
            type="button"
            onClick={() => setViewPreset('top')}
            className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            顶(U)
          </button>
          <button
            id="btn-view-right"
            type="button"
            onClick={() => setViewPreset('right')}
            className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            右(R)
          </button>
          <button
            id="btn-view-back"
            type="button"
            onClick={() => setViewPreset('back')}
            className="px-2 py-0.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            后(B)
          </button>
        </div>

        {/* Tip Badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm pointer-events-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>拖拽旋转视角 / 点击色块填色</span>
        </div>
      </div>

      {/* Hover Index Indicator */}
      {hoveredFacelet !== null && (
        <div className="absolute top-3 left-3 bg-white/95 text-slate-800 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 pointer-events-none shadow-sm">
          当前色块: <span className="font-mono font-bold text-emerald-600">#{hoveredFacelet + 1}</span> (面: {facelets[hoveredFacelet]})
        </div>
      )}
    </div>
  );
};
