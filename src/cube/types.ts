/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FaceName = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export type CubeColor = 'white' | 'red' | 'green' | 'yellow' | 'orange' | 'blue';

export interface ColorDef {
  id: CubeColor;
  name: string;
  face: FaceName;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

export const COLOR_DEFS: Record<FaceName, ColorDef> = {
  U: { id: 'white', name: '白 (Top/U)', face: 'U', hex: '#FFFFFF', bgClass: 'bg-white', borderClass: 'border-slate-300', textClass: 'text-slate-900' },
  R: { id: 'red', name: '红 (Right/R)', face: 'R', hex: '#DC2626', bgClass: 'bg-red-600', borderClass: 'border-red-700', textClass: 'text-white' },
  F: { id: 'green', name: '绿 (Front/F)', face: 'F', hex: '#16A34A', bgClass: 'bg-green-600', borderClass: 'border-green-700', textClass: 'text-white' },
  D: { id: 'yellow', name: '黄 (Bottom/D)', face: 'D', hex: '#FACC15', bgClass: 'bg-yellow-400', borderClass: 'border-yellow-500', textClass: 'text-slate-900' },
  L: { id: 'orange', name: '橙 (Left/L)', face: 'L', hex: '#EA580C', bgClass: 'bg-orange-500', borderClass: 'border-orange-600', textClass: 'text-white' },
  B: { id: 'blue', name: '蓝 (Back/B)', face: 'B', hex: '#2563EB', bgClass: 'bg-blue-600', borderClass: 'border-blue-700', textClass: 'text-white' },
};

// 54 Facelets ordering standard in Kociemba solver:
// U1..U9 (0..8), R1..R9 (9..17), F1..F9 (18..26), D1..D9 (27..35), L1..L9 (36..44), B1..B9 (45..53)
export const FACELET_ORDER: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];

export type FaceletState = FaceName[]; // Array of 54 FaceNames

export type Move = 
  | 'U' | "U'" | 'U2'
  | 'R' | "R'" | 'R2'
  | 'F' | "F'" | 'F2'
  | 'D' | "D'" | 'D2'
  | 'L' | "L'" | 'L2'
  | 'B' | "B'" | 'B2';

export interface ValidationResult {
  isValid: boolean;
  colorCounts: Record<FaceName, number>;
  errorMessage?: string;
  errorType?: 'COUNT' | 'CORNER_PARITY' | 'EDGE_PARITY' | 'PERM_PARITY' | 'CENTER_MISMATCH' | 'CORNER_COLOR' | 'EDGE_COLOR';
  fixSuggestion?: string;
}

export interface SolveResult {
  solutionMoves: Move[];
  scrambleMoves: Move[];
  solutionString: string;
  scrambleString: string;
  stepCount: number;
  timeMs: number;
  phases?: {
    phase1: string;
    phase2: string;
  };
}
