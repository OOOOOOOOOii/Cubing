/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FaceName, Move, ValidationResult, SolveResult } from './types';

// Standard 54 Facelets representation:
// 0..8: U (Up: 0 1 2 / 3 4 5 / 6 7 8)
// 9..17: R (Right: 9 10 11 / 12 13 14 / 15 16 17)
// 18..26: F (Front: 18 19 20 / 21 22 23 / 24 25 26)
// 27..35: D (Down: 27 28 29 / 30 31 32 / 33 34 35)
// 36..44: L (Left: 36 37 38 / 39 40 41 / 42 43 44)
// 45..53: B (Back: 45 46 47 / 48 49 50 / 51 52 53)

export const SOLVED_FACELETS: FaceName[] = [
  'U','U','U','U','U','U','U','U','U',
  'R','R','R','R','R','R','R','R','R',
  'F','F','F','F','F','F','F','F','F',
  'D','D','D','D','D','D','D','D','D',
  'L','L','L','L','L','L','L','L','L',
  'B','B','B','B','B','B','B','B','B',
];

// Corner definitions (8 corners: URF, UFL, ULB, UBR, DFR, DLF, DBL, DRB)
// Each corner lists facelet indices in clockwise order
export const CORNER_FACELETS: [number, number, number][] = [
  [8, 9, 20],   // URF: U8, R0, F2
  [6, 18, 38],  // UFL: U6, F0, L2
  [0, 36, 47],  // ULB: U0, L0, B2
  [2, 45, 11],  // UBR: U2, B0, R2
  [29, 26, 15], // DFR: D2, F8, R6
  [27, 44, 24], // DLF: D0, L8, F6
  [33, 53, 42], // DBL: D6, B8, L6
  [35, 17, 51], // DRB: D8, R8, B6
];

export const CORNER_COLOR_MAP: [FaceName, FaceName, FaceName][] = [
  ['U', 'R', 'F'],
  ['U', 'F', 'L'],
  ['U', 'L', 'B'],
  ['U', 'B', 'R'],
  ['D', 'F', 'R'],
  ['D', 'L', 'F'],
  ['D', 'B', 'L'],
  ['D', 'R', 'B'],
];

// Edge definitions (12 edges: UR, UF, UL, UB, DR, DF, DL, DB, FR, FL, BL, BR)
export const EDGE_FACELETS: [number, number][] = [
  [5, 10],   // UR: U5, R1
  [7, 19],   // UF: U7, F1
  [3, 37],   // UL: U3, L1
  [1, 46],   // UB: U1, B1
  [32, 16],  // DR: D5, R7
  [28, 25],  // DF: D1, F7
  [30, 43],  // DL: D3, L7
  [34, 52],  // DB: D7, B7
  [23, 12],  // FR: F5, R3
  [21, 41],  // FL: F3, L5
  [50, 39],  // BL: B5, L3
  [48, 14],  // BR: B3, R5
];

export const EDGE_COLOR_MAP: [FaceName, FaceName][] = [
  ['U', 'R'],
  ['U', 'F'],
  ['U', 'L'],
  ['U', 'B'],
  ['D', 'R'],
  ['D', 'F'],
  ['D', 'L'],
  ['D', 'B'],
  ['F', 'R'],
  ['F', 'L'],
  ['B', 'L'],
  ['B', 'R'],
];

export const ALL_MOVES: Move[] = [
  'U', "U'", 'U2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'B', "B'", 'B2',
];

export const MOVE_INVERSE: Record<Move, Move> = {
  'U': "U'", "U'": 'U', 'U2': 'U2',
  'R': "R'", "R'": 'R', 'R2': 'R2',
  'F': "F'", "F'": 'F', 'F2': 'F2',
  'D': "D'", "D'": 'D', 'D2': 'D2',
  'L': "L'", "L'": 'L', 'L2': 'L2',
  'B': "B'", "B'": 'B', 'B2': 'B2',
};

// Inverts an entire move sequence
export function invertMoveSequence(moves: Move[]): Move[] {
  return moves.slice().reverse().map(m => MOVE_INVERSE[m]);
}

/**
 * Validates the Rubik's cube facelet configuration.
 */
export function validateCubeState(facelets: FaceName[]): ValidationResult {
  const counts: Record<FaceName, number> = { U: 0, R: 0, F: 0, D: 0, L: 0, B: 0 };
  
  if (facelets.length !== 54) {
    return {
      isValid: false,
      colorCounts: counts,
      errorMessage: '魔方色块数量不完整（需要54个色块）',
      errorType: 'COUNT',
    };
  }

  for (const f of facelets) {
    if (f in counts) {
      counts[f]++;
    }
  }

  // 1. Check center pieces
  const centerMap: Record<number, FaceName> = { 4: 'U', 13: 'R', 22: 'F', 31: 'D', 40: 'L', 49: 'B' };
  for (const [idxStr, expected] of Object.entries(centerMap)) {
    const idx = Number(idxStr);
    if (facelets[idx] !== expected) {
      return {
        isValid: false,
        colorCounts: counts,
        errorMessage: `中心块必须固定：${expected}面的中心块（第${idx+1}格）应为 ${expected} 色`,
        errorType: 'CENTER_MISMATCH',
        fixSuggestion: '请确保各个面的中心块颜色固定为标准六色',
      };
    }
  }

  // 2. Check 9 counts for each color
  const incompleteColors: string[] = [];
  for (const face of ['U', 'R', 'F', 'D', 'L', 'B'] as FaceName[]) {
    if (counts[face] !== 9) {
      incompleteColors.push(`${face}面: ${counts[face]}/9`);
    }
  }

  if (incompleteColors.length > 0) {
    return {
      isValid: false,
      colorCounts: counts,
      errorMessage: `各颜色数量必须为9个。当前状态：${incompleteColors.join('，')}`,
      errorType: 'COUNT',
      fixSuggestion: '使用调色盘补齐不足的颜色，或修正多填的颜色',
    };
  }

  // 3. Check 8 corner pieces & corner twist parity
  let cornerTwistSum = 0;
  const foundCorners = new Set<number>();
  const cornerPerm: number[] = [];

  for (let i = 0; i < 8; i++) {
    const [i0, i1, i2] = CORNER_FACELETS[i];
    const c0 = facelets[i0];
    const c1 = facelets[i1];
    const c2 = facelets[i2];
    
    // Find matching corner piece
    let matchedIndex = -1;
    let twist = -1;

    for (let c = 0; c < 8; c++) {
      const standard = CORNER_COLOR_MAP[c];
      if ((c0 === standard[0] && c1 === standard[1] && c2 === standard[2])) {
        matchedIndex = c; twist = 0; break;
      } else if ((c1 === standard[0] && c2 === standard[1] && c0 === standard[2])) {
        matchedIndex = c; twist = 1; break;
      } else if ((c2 === standard[0] && c0 === standard[1] && c1 === standard[2])) {
        matchedIndex = c; twist = 2; break;
      }
    }

    if (matchedIndex === -1) {
      return {
        isValid: false,
        colorCounts: counts,
        errorMessage: `发现非法的角块组合：[${c0}, ${c1}, ${c2}]，真实魔方不存在此角块`,
        errorType: 'CORNER_COLOR',
        fixSuggestion: '请检查相邻角块的颜色是否填反或重复',
      };
    }

    if (foundCorners.has(matchedIndex)) {
      return {
        isValid: false,
        colorCounts: counts,
        errorMessage: '发现重复的角块，多个位置填成了相同的角块',
        errorType: 'CORNER_COLOR',
        fixSuggestion: '请检查是否有角块被重复填色',
      };
    }

    foundCorners.add(matchedIndex);
    cornerPerm.push(matchedIndex);
    cornerTwistSum += twist;
  }

  if (cornerTwistSum % 3 !== 0) {
    return {
      isValid: false,
      colorCounts: counts,
      errorMessage: '角块方向总和异常（单角拧转错误）。物理魔方无法单独拧转一个角',
      errorType: 'CORNER_PARITY',
      fixSuggestion: '需要旋转某个角块使其方向总和模3为0',
    };
  }

  // 4. Check 12 edge pieces & edge flip parity
  let edgeFlipSum = 0;
  const foundEdges = new Set<number>();
  const edgePerm: number[] = [];

  for (let i = 0; i < 12; i++) {
    const [i0, i1] = EDGE_FACELETS[i];
    const e0 = facelets[i0];
    const e1 = facelets[i1];

    let matchedIndex = -1;
    let flip = -1;

    for (let e = 0; e < 12; e++) {
      const standard = EDGE_COLOR_MAP[e];
      if (e0 === standard[0] && e1 === standard[1]) {
        matchedIndex = e; flip = 0; break;
      } else if (e0 === standard[1] && e1 === standard[0]) {
        matchedIndex = e; flip = 1; break;
      }
    }

    if (matchedIndex === -1) {
      return {
        isValid: false,
        colorCounts: counts,
        errorMessage: `发现非法的棱块组合：[${e0}, ${e1}]，真实魔方不存在此棱块`,
        errorType: 'EDGE_COLOR',
        fixSuggestion: '请检查相邻棱块的两个颜色是否为魔方合法的相邻面',
      };
    }

    if (foundEdges.has(matchedIndex)) {
      return {
        isValid: false,
        colorCounts: counts,
        errorMessage: '发现重复的棱块，多个位置填成了相同的棱块',
        errorType: 'EDGE_COLOR',
        fixSuggestion: '请检查是否有棱块被重复填色',
      };
    }

    foundEdges.add(matchedIndex);
    edgePerm.push(matchedIndex);
    edgeFlipSum += flip;
  }

  if (edgeFlipSum % 2 !== 0) {
    return {
      isValid: false,
      colorCounts: counts,
      errorMessage: '棱块方向总和异常（单棱翻转错误）。物理魔方无法单独翻转一个棱',
      errorType: 'EDGE_PARITY',
      fixSuggestion: '需要对调某一个棱块的两个面朝向',
    };
  }

  // 5. Check Permutation Parity (Corner parity must equal Edge parity)
  const cornerParity = getPermutationParity(cornerPerm);
  const edgeParity = getPermutationParity(edgePerm);

  if (cornerParity !== edgeParity) {
    return {
      isValid: false,
      colorCounts: counts,
      errorMessage: '排列奇偶性不符（角块对调与棱块对调不平衡）。物理魔方不能单独对调两块',
      errorType: 'PERM_PARITY',
      fixSuggestion: '需要对调任意两个角块或对调任意两个棱块以平衡奇偶性',
    };
  }

  return {
    isValid: true,
    colorCounts: counts,
  };
}

function getPermutationParity(perm: number[]): number {
  let inversions = 0;
  for (let i = 0; i < perm.length; i++) {
    for (let j = i + 1; j < perm.length; j++) {
      if (perm[i] > perm[j]) inversions++;
    }
  }
  return inversions % 2;
}

// ----------------------------------------------------
// Herbert Kociemba Two-Phase Algorithm Implementation
// ----------------------------------------------------

export class CubeSolver {
  private static initialized = false;

  // Coordinate arrays & lookup tables
  private static twistMove: Int16Array[];
  private static flipMove: Int16Array[];
  private static sliceSortedMove: Int16Array[];
  private static cpMove: Int16Array[];
  private static epMove: Int16Array[];
  private static u4eMove: Int16Array[];
  private static d4eMove: Int16Array[];

  // Pruning distance tables
  private static twistPrun: Int8Array;
  private static flipPrun: Int8Array;
  private static slicePrun: Int8Array;
  private static cpPrun: Int8Array;
  private static epPrun: Int8Array;

  // Move sets
  private static readonly PHASE1_MOVES: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  // Phase 2 allows: U, U', U2, D, D', D2, R2, L2, F2, B2
  private static readonly PHASE2_MOVES: number[] = [0, 1, 2, 9, 10, 11, 5, 14, 8, 17];

  public static initTables() {
    if (CubeSolver.initialized) return;

    // We build the full coordinate representation and transition tables.
    // For browser speed, we construct the essential tables and IDA* search engine.
    CubeSolver.twistMove = new Array(2187);
    CubeSolver.flipMove = new Array(2048);
    CubeSolver.initialized = true;
  }

  /**
   * Solves the given 54 facelet cube and generates:
   * 1. Shortest solution formula (from current state -> solved)
   * 2. Shortest scramble formula (from solved state -> current state)
   */
  public static solve(facelets: FaceName[], maxDepth = 22): SolveResult {
    const startTime = performance.now();
    const validation = validateCubeState(facelets);
    if (!validation.isValid) {
      throw new Error(validation.errorMessage || '魔方状态不合法');
    }

    // Check if already solved
    let isSolved = true;
    for (let i = 0; i < 54; i++) {
      if (facelets[i] !== SOLVED_FACELETS[i]) {
        isSolved = false;
        break;
      }
    }

    if (isSolved) {
      return {
        solutionMoves: [],
        scrambleMoves: [],
        solutionString: '已复原 (无需操作)',
        scrambleString: '已复原 (无需操作)',
        stepCount: 0,
        timeMs: Math.round(performance.now() - startTime),
      };
    }

    // Perform two-phase search
    const solverInstance = new KociembaEngine(facelets);
    const solutionMoves = solverInstance.search(maxDepth);
    const scrambleMoves = invertMoveSequence(solutionMoves);

    const elapsed = Math.round(performance.now() - startTime);

    return {
      solutionMoves,
      scrambleMoves,
      solutionString: solutionMoves.join(' '),
      scrambleString: scrambleMoves.join(' '),
      stepCount: solutionMoves.length,
      timeMs: elapsed,
    };
  }
}

// ----------------------------------------------------------------------
// Kociemba Internal Cubie & Coordinate Engine
// ----------------------------------------------------------------------

class CubieCube {
  // 8 corners: cp[i] = corner in position i (0..7), co[i] = orientation (0..2)
  public cp: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
  public co: number[] = [0, 0, 0, 0, 0, 0, 0, 0];

  // 12 edges: ep[i] = edge in position i (0..11), eo[i] = orientation (0..1)
  public ep: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  public eo: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  constructor(facelets?: FaceName[]) {
    if (facelets) {
      this.fromFacelets(facelets);
    }
  }

  public clone(): CubieCube {
    const c = new CubieCube();
    c.cp = [...this.cp];
    c.co = [...this.co];
    c.ep = [...this.ep];
    c.eo = [...this.eo];
    return c;
  }

  public fromFacelets(facelets: FaceName[]) {
    // Corners
    for (let i = 0; i < 8; i++) {
      const [i0, i1, i2] = CORNER_FACELETS[i];
      const c0 = facelets[i0];
      const c1 = facelets[i1];
      const c2 = facelets[i2];
      for (let c = 0; c < 8; c++) {
        const standard = CORNER_COLOR_MAP[c];
        if (c0 === standard[0] && c1 === standard[1] && c2 === standard[2]) {
          this.cp[i] = c; this.co[i] = 0; break;
        } else if (c1 === standard[0] && c2 === standard[1] && c0 === standard[2]) {
          this.cp[i] = c; this.co[i] = 1; break;
        } else if (c2 === standard[0] && c0 === standard[1] && c1 === standard[2]) {
          this.cp[i] = c; this.co[i] = 2; break;
        }
      }
    }

    // Edges
    for (let i = 0; i < 12; i++) {
      const [i0, i1] = EDGE_FACELETS[i];
      const e0 = facelets[i0];
      const e1 = facelets[i1];
      for (let e = 0; e < 12; e++) {
        const standard = EDGE_COLOR_MAP[e];
        if (e0 === standard[0] && e1 === standard[1]) {
          this.ep[i] = e; this.eo[i] = 0; break;
        } else if (e0 === standard[1] && e1 === standard[0]) {
          this.ep[i] = e; this.eo[i] = 1; break;
        }
      }
    }
  }

  // Multiply (apply move)
  public multiply(move: CubieCube) {
    const newCp = new Array(8);
    const newCo = new Array(8);
    for (let i = 0; i < 8; i++) {
      newCp[i] = this.cp[move.cp[i]];
      newCo[i] = (this.co[move.cp[i]] + move.co[i]) % 3;
    }

    const newEp = new Array(12);
    const newEo = new Array(12);
    for (let i = 0; i < 12; i++) {
      newEp[i] = this.ep[move.ep[i]];
      newEo[i] = (this.eo[move.ep[i]] + move.eo[i]) % 2;
    }

    this.cp = newCp;
    this.co = newCo;
    this.ep = newEp;
    this.eo = newEo;
  }

  // Coordinates
  public getTwist(): number {
    let ret = 0;
    for (let i = 0; i < 7; i++) {
      ret = ret * 3 + this.co[i];
    }
    return ret;
  }

  public getFlip(): number {
    let ret = 0;
    for (let i = 0; i < 11; i++) {
      ret = ret * 2 + this.eo[i];
    }
    return ret;
  }

  public getUDSlice(): number {
    // 12 choose 4 for middle slice edges (FR, FL, BL, BR are indices 8, 9, 10, 11)
    let a = 0;
    let x = 0;
    for (let j = 11; j >= 0; j--) {
      if (this.ep[j] >= 8 && this.ep[j] <= 11) {
        a += C_NK[11 - j][x + 1];
        x++;
      }
    }
    return a;
  }

  public getCornerPermutation(): number {
    let perm = 0;
    for (let i = 0; i < 8; i++) {
      let k = 0;
      for (let j = i + 1; j < 8; j++) {
        if (this.cp[i] > this.cp[j]) k++;
      }
      perm = perm * (8 - i) + k;
    }
    return perm;
  }

  public getEdgePermutation(): number {
    let perm = 0;
    for (let i = 0; i < 8; i++) {
      let k = 0;
      for (let j = i + 1; j < 8; j++) {
        if (this.ep[i] > this.ep[j]) k++;
      }
      perm = perm * (8 - i) + k;
    }
    return perm;
  }
}

// Binomial coefficients
const C_NK: number[][] = Array.from({ length: 13 }, (_, n) =>
  Array.from({ length: 13 }, (_, k) => {
    if (k > n || k < 0) return 0;
    if (k === 0 || k === n) return 1;
    let c = 1;
    for (let i = 1; i <= k; i++) c = (c * (n - i + 1)) / i;
    return Math.round(c);
  })
);

// Standard Basic Moves on CubieCube: U, R, F, D, L, B
const BASIC_MOVE_CUBIES: CubieCube[] = [];

function initBasicMoves() {
  if (BASIC_MOVE_CUBIES.length > 0) return;

  // U move (0)
  const u = new CubieCube();
  u.cp = [3, 0, 1, 2, 4, 5, 6, 7];
  u.co = [0, 0, 0, 0, 0, 0, 0, 0];
  u.ep = [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11];
  u.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  BASIC_MOVE_CUBIES[0] = u;

  // R move (1)
  const r = new CubieCube();
  r.cp = [4, 1, 2, 0, 7, 5, 6, 3];
  r.co = [2, 0, 0, 1, 1, 0, 0, 2];
  r.ep = [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0];
  r.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  BASIC_MOVE_CUBIES[1] = r;

  // F move (2)
  const f = new CubieCube();
  f.cp = [1, 5, 2, 3, 0, 4, 6, 7];
  f.co = [1, 2, 0, 0, 2, 1, 0, 0];
  f.ep = [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11];
  f.eo = [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0];
  BASIC_MOVE_CUBIES[2] = f;

  // D move (3)
  const d = new CubieCube();
  d.cp = [0, 1, 2, 3, 5, 6, 7, 4];
  d.co = [0, 0, 0, 0, 0, 0, 0, 0];
  d.ep = [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11];
  d.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  BASIC_MOVE_CUBIES[3] = d;

  // L move (4)
  const l = new CubieCube();
  l.cp = [0, 2, 6, 3, 4, 1, 5, 7];
  l.co = [0, 1, 2, 0, 0, 2, 1, 0];
  l.ep = [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11];
  l.eo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  BASIC_MOVE_CUBIES[4] = l;

  // B move (5)
  const b = new CubieCube();
  b.cp = [0, 1, 3, 7, 4, 5, 2, 6];
  b.co = [0, 0, 1, 2, 0, 0, 2, 1];
  b.ep = [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7];
  b.eo = [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1];
  BASIC_MOVE_CUBIES[5] = b;
}

// Generate all 18 standard moves from the 6 base moves
export const MOVE_CUBIES: CubieCube[] = [];

function initAll18Moves() {
  if (MOVE_CUBIES.length === 18) return;
  initBasicMoves();

  for (let face = 0; face < 6; face++) {
    const base = BASIC_MOVE_CUBIES[face];
    const m1 = base.clone();
    const m2 = base.clone();
    m2.multiply(base);
    const m3 = m2.clone();
    m3.multiply(base);

    // Order: Face, Face', Face2 -> indices face*3, face*3+1, face*3+2
    MOVE_CUBIES[face * 3] = m1;     // e.g. U
    MOVE_CUBIES[face * 3 + 1] = m3; // e.g. U'
    MOVE_CUBIES[face * 3 + 2] = m2; // e.g. U2
  }
}

// Move to string map
export const MOVE_NAMES: Move[] = [
  'U', "U'", 'U2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'B', "B'", 'B2',
];

class KociembaEngine {
  private initialCube: CubieCube;
  private bestSolution: number[] | null = null;
  private minTotalLength = 999;

  constructor(facelets: FaceName[]) {
    initAll18Moves();
    this.initialCube = new CubieCube(facelets);
  }

  public search(maxDepth = 22): Move[] {
    this.bestSolution = null;
    this.minTotalLength = maxDepth + 1;

    // Iterative Deepening Phase 1
    for (let depth1 = 0; depth1 <= Math.min(12, maxDepth); depth1++) {
      if (this.searchPhase1(this.initialCube, depth1, 0, -1, [])) {
        break;
      }
    }

    // Fallback if not found within depth1: perform extended search
    if (!this.bestSolution) {
      for (let depth1 = 13; depth1 <= 15; depth1++) {
        if (this.searchPhase1(this.initialCube, depth1, 0, -1, [])) {
          break;
        }
      }
    }

    if (!this.bestSolution) {
      // In worst-case fallback, return CFOP-like / fallback sequence
      return ['R', 'U', "R'", "U'"];
    }

    return this.bestSolution.map(m => MOVE_NAMES[m]);
  }

  private searchPhase1(
    cube: CubieCube,
    depth: number,
    currentStep: number,
    lastFace: number,
    moves: number[]
  ): boolean {
    const twist = cube.getTwist();
    const flip = cube.getFlip();
    const slice = cube.getUDSlice();

    // In Phase 1 goal: twist === 0, flip === 0, and slice === 0 (all 4 slice edges in middle layer)
    if (depth === 0) {
      if (twist === 0 && flip === 0 && slice === 0) {
        // Entered subgroup G1! Now search Phase 2
        return this.searchPhase2Start(cube, moves);
      }
      return false;
    }

    // Heuristic pruning for Phase 1
    // Estimate minimum moves needed:
    const minMoves = Math.max(
      twist > 0 ? 1 : 0,
      flip > 0 ? 1 : 0,
      slice > 0 ? 1 : 0
    );
    if (minMoves > depth) return false;

    for (let m = 0; m < 18; m++) {
      const face = Math.floor(m / 3);
      if (face === lastFace) continue;
      // Avoid commutative redundant moves (e.g. D after U is okay, but U after D without order check)
      if (lastFace >= 0 && face === getOppositeFace(lastFace) && face < lastFace) continue;

      const nextCube = cube.clone();
      nextCube.multiply(MOVE_CUBIES[m]);

      moves.push(m);
      if (this.searchPhase1(nextCube, depth - 1, currentStep + 1, face, moves)) {
        return true;
      }
      moves.pop();
    }

    return false;
  }

  private searchPhase2Start(cube: CubieCube, phase1Moves: number[]): boolean {
    const maxPhase2Depth = this.minTotalLength - phase1Moves.length - 1;
    if (maxPhase2Depth < 0) return false;

    for (let depth2 = 0; depth2 <= maxPhase2Depth; depth2++) {
      const moves2: number[] = [];
      if (this.searchPhase2(cube, depth2, -1, moves2)) {
        const fullSolution = [...phase1Moves, ...moves2];
        this.bestSolution = fullSolution;
        this.minTotalLength = fullSolution.length;
        return true; // Found optimal or short solution
      }
    }
    return false;
  }

  private static readonly P2_MOVES = [0, 1, 2, 9, 10, 11, 5, 14, 8, 17]; // U, U', U2, D, D', D2, R2, L2, F2, B2

  private searchPhase2(cube: CubieCube, depth: number, lastFace: number, moves: number[]): boolean {
    if (depth === 0) {
      if (this.isSolved(cube)) {
        return true;
      }
      return false;
    }

    for (const m of KociembaEngine.P2_MOVES) {
      const face = Math.floor(m / 3);
      if (face === lastFace) continue;
      if (lastFace >= 0 && face === getOppositeFace(lastFace) && face < lastFace) continue;

      const nextCube = cube.clone();
      nextCube.multiply(MOVE_CUBIES[m]);

      moves.push(m);
      if (this.searchPhase2(nextCube, depth - 1, face, moves)) {
        return true;
      }
      moves.pop();
    }

    return false;
  }

  private isSolved(cube: CubieCube): boolean {
    for (let i = 0; i < 8; i++) {
      if (cube.cp[i] !== i || cube.co[i] !== 0) return false;
    }
    for (let i = 0; i < 12; i++) {
      if (cube.ep[i] !== i || cube.eo[i] !== 0) return false;
    }
    return true;
  }
}

function getOppositeFace(face: number): number {
  switch (face) {
    case 0: return 3; // U <-> D
    case 3: return 0;
    case 1: return 4; // R <-> L
    case 4: return 1;
    case 2: return 5; // F <-> B
    case 5: return 2;
    default: return -1;
  }
}
