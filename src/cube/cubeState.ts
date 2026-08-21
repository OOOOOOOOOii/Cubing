/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FaceName, Move } from './types';
import { SOLVED_FACELETS } from './solver';

// 54 Facelet indices grouped by face:
// U: 0..8   (top row: 0 1 2, mid: 3 4 5, bot: 6 7 8)
// R: 9..17  (top row: 9 10 11, mid: 12 13 14, bot: 15 16 17)
// F: 18..26 (top row: 18 19 20, mid: 21 22 23, bot: 24 25 26)
// D: 27..35 (top row: 27 28 29, mid: 30 31 32, bot: 33 34 35)
// L: 36..44 (top row: 36 37 38, mid: 39 40 41, bot: 42 43 44)
// B: 45..53 (top row: 45 46 47, mid: 48 49 50, bot: 51 52 53)

export const FACE_OFFSET: Record<FaceName, number> = {
  U: 0,
  R: 9,
  F: 18,
  D: 27,
  L: 36,
  B: 45,
};

// Facelet cycle permutations for base clockwise 90 degree face turns:
const MOVE_PERMUTATIONS: Record<FaceName, number[]> = {
  // U turn: rotate U face clockwise (0->2->8->6, 1->5->7->3) + cycle adjacent top row of B, R, F, L
  U: [
    // U face rotation
    6, 3, 0, 7, 4, 1, 8, 5, 2,
    // R (9..17): R top row (9,10,11) comes from B top row (45,46,47)
    45, 46, 47, 12, 13, 14, 15, 16, 17,
    // F (18..26): F top row (18,19,20) comes from R top row (9,10,11)
    9, 10, 11, 21, 22, 23, 24, 25, 26,
    // D (27..35): unchanged
    27, 28, 29, 30, 31, 32, 33, 34, 35,
    // L (36..44): L top row (36,37,38) comes from F top row (18,19,20)
    18, 19, 20, 39, 40, 41, 42, 43, 44,
    // B (45..53): B top row (45,46,47) comes from L top row (36,37,38)
    36, 37, 38, 48, 49, 50, 51, 52, 53,
  ],

  // R turn: rotate R face clockwise + cycle right col of U, B, D, F
  R: [
    // U (0..8): U right col (2,5,8) comes from F right col (20,23,26)
    0, 1, 20, 3, 4, 23, 6, 7, 26,
    // R face rotation (9..17)
    15, 12, 9, 16, 13, 10, 17, 14, 11,
    // F (18..26): F right col (20,23,26) comes from D right col (29,32,35)
    18, 19, 29, 21, 22, 32, 24, 25, 35,
    // D (27..35): D right col (29,32,35) comes from B left col inverted (51,48,45) -> (51, 48, 45)
    27, 28, 51, 30, 31, 48, 33, 34, 45,
    // L (36..44): unchanged
    36, 37, 38, 39, 40, 41, 42, 43, 44,
    // B (45..53): B left col (45,48,51) comes from U right col inverted (8,5,2) -> (8, 5, 2)
    8, 46, 47, 5, 49, 50, 2, 52, 53,
  ],

  // F turn: rotate F face clockwise + cycle U bot row, R left col, D top row, L right col
  F: [
    // U (0..8): U bot row (6,7,8) comes from L right col inverted (44,41,38)
    0, 1, 2, 3, 4, 5, 44, 41, 38,
    // R (9..17): R left col (9,12,15) comes from U bot row (6,7,8)
    6, 10, 11, 7, 13, 14, 8, 16, 17,
    // F face rotation (18..26)
    24, 21, 18, 25, 22, 19, 26, 23, 20,
    // D (27..35): D top row (27,28,29) comes from R left col inverted (15,12,9)
    15, 12, 9, 30, 31, 32, 33, 34, 35,
    // L (36..44): L right col (38,41,44) comes from D top row (27,28,29)
    36, 37, 27, 39, 40, 28, 42, 43, 29,
    // B (45..53): unchanged
    45, 46, 47, 48, 49, 50, 51, 52, 53,
  ],

  // D turn: rotate D face clockwise + cycle bottom rows of F, R, B, L
  D: [
    // U (0..8): unchanged
    0, 1, 2, 3, 4, 5, 6, 7, 8,
    // R (9..17): R bot row (15,16,17) comes from F bot row (24,25,26)
    9, 10, 11, 12, 13, 14, 24, 25, 26,
    // F (18..26): F bot row (24,25,26) comes from L bot row (42,43,44)
    18, 19, 20, 21, 22, 23, 42, 43, 44,
    // D face rotation (27..35)
    33, 30, 27, 34, 31, 28, 35, 32, 29,
    // L (36..44): L bot row (42,43,44) comes from B bot row (51,52,53)
    36, 37, 38, 39, 40, 41, 51, 52, 53,
    // B (45..53): B bot row (51,52,53) comes from R bot row (15,16,17)
    45, 46, 47, 48, 49, 50, 15, 16, 17,
  ],

  // L turn: rotate L face clockwise + cycle left col of U, F, D, B
  L: [
    // U (0..8): U left col (0,3,6) comes from B right col inverted (53,50,47)
    53, 1, 2, 50, 4, 5, 47, 7, 8,
    // R (9..17): unchanged
    9, 10, 11, 12, 13, 14, 15, 16, 17,
    // F (18..26): F left col (18,21,24) comes from U left col (0,3,6)
    0, 19, 20, 3, 22, 23, 6, 25, 26,
    // D (27..35): D left col (27,30,33) comes from F left col (18,21,24)
    18, 28, 29, 21, 31, 32, 24, 34, 35,
    // L face rotation (36..44)
    42, 39, 36, 43, 40, 37, 44, 41, 38,
    // B (45..53): B right col (47,50,53) comes from D left col inverted (33,30,27)
    45, 46, 33, 48, 49, 30, 51, 52, 27,
  ],

  // B turn: rotate B face clockwise + cycle U top row, L left col, D bot row, R right col
  B: [
    // U (0..8): U top row (0,1,2) comes from R right col (11,14,17)
    11, 14, 17, 3, 4, 5, 6, 7, 8,
    // R (9..17): R right col (11,14,17) comes from D bot row inverted (35,34,33)
    9, 10, 35, 12, 13, 34, 15, 16, 33,
    // F (18..26): unchanged
    18, 19, 20, 21, 22, 23, 24, 25, 26,
    // D (27..35): D bot row (33,34,35) comes from L left col (36,39,42)
    27, 28, 29, 30, 31, 32, 36, 39, 42,
    // L (36..44): L left col (36,39,42) comes from U top row inverted (2,1,0)
    2, 37, 38, 1, 40, 41, 0, 43, 44,
    // B face rotation (45..53)
    51, 48, 45, 52, 49, 46, 53, 50, 47,
  ],
};

/**
 * Applies a single move (e.g. "R", "U'", "F2") to a 54-facelet array.
 */
export function applyMove(facelets: FaceName[], move: Move): FaceName[] {
  const baseFace = move[0] as FaceName;
  const isPrime = move.endsWith("'");
  const isDouble = move.endsWith('2');

  const perm = MOVE_PERMUTATIONS[baseFace];
  let res = [...facelets];

  const times = isDouble ? 2 : isPrime ? 3 : 1;

  for (let t = 0; t < times; t++) {
    const next = new Array(54);
    for (let i = 0; i < 54; i++) {
      next[i] = res[perm[i]];
    }
    res = next;
  }

  return res;
}

/**
 * Applies a sequence of moves to a 54-facelet array.
 */
export function applyMoves(facelets: FaceName[], moves: Move[] | string): FaceName[] {
  const moveArray = typeof moves === 'string'
    ? moves.trim().split(/\s+/).filter(Boolean) as Move[]
    : moves;

  let current = [...facelets];
  for (const m of moveArray) {
    if (m) {
      current = applyMove(current, m);
    }
  }
  return current;
}

/**
 * Generate a standard random 20-move WCA scramble
 */
export function generateRandomScramble(moveCount = 20): { moves: Move[]; scrambleString: string; facelets: FaceName[] } {
  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
  const modifiers = ['', "'", '2'];
  const moves: Move[] = [];
  let lastFace: FaceName | null = null;
  let secondLastFace: FaceName | null = null;

  for (let i = 0; i < moveCount; i++) {
    let face: FaceName;
    do {
      face = faces[Math.floor(Math.random() * faces.length)];
    } while (
      face === lastFace ||
      (secondLastFace && isOppositeFaceName(face, lastFace!) && face === secondLastFace)
    );

    const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
    const move = `${face}${mod}` as Move;
    moves.push(move);

    secondLastFace = lastFace;
    lastFace = face;
  }

  const facelets = applyMoves(SOLVED_FACELETS, moves);
  return {
    moves,
    scrambleString: moves.join(' '),
    facelets,
  };
}

function isOppositeFaceName(a: FaceName, b: FaceName): boolean {
  return (
    (a === 'U' && b === 'D') || (a === 'D' && b === 'U') ||
    (a === 'R' && b === 'L') || (a === 'L' && b === 'R') ||
    (a === 'F' && b === 'B') || (a === 'B' && b === 'F')
  );
}

// Preset patterns
export interface PresetPattern {
  id: string;
  name: string;
  enName: string;
  formula: string;
  description: string;
}

export const PRESET_PATTERNS: PresetPattern[] = [
  {
    id: 'checkerboard',
    name: '六面棋盘格 (Checkerboard)',
    enName: 'Checkerboard',
    formula: "M2 E2 S2", // or standard: "U2 D2 R2 L2 F2 B2"
    description: '经典的黑白/六色相间棋盘图案',
  },
  {
    id: 'cube_in_cube',
    name: '大中有小 (Cube in a Cube)',
    enName: 'Cube in a Cube',
    formula: "F L F U' R U F2 L2 U' L' B D' B' L2 U",
    description: '角块嵌套的2x2微缩魔方视觉图案',
  },
  {
    id: 'superflip',
    name: '超级翻转 (Superflip)',
    enName: 'Superflip',
    formula: "U R2 F B R B2 R U2 L B2 R U' D' R2 F R' L B2 U2 F2",
    description: '12个棱块全原地翻转，上帝之数20步极限状态',
  },
  {
    id: 'six_dots',
    name: '六面回字/点状心 (Six Spots / Dots)',
    enName: 'Six Spots',
    formula: "U D' R L' F B' U D'",
    description: '六面中心块与外圈颜色互换，呈现经典点心图',
  },
  {
    id: 'anaconda',
    name: '蛇形缠绕 (Anaconda)',
    enName: 'Anaconda',
    formula: "L U B' U' R L' B R' F B' D R D' F'",
    description: '色带如蛇一般连续缠绕魔方各面',
  },
  {
    id: 'cross',
    name: '六面十字 (Six Crosses)',
    enName: 'Six Crosses',
    formula: "U2 R2 L2 F2 B2 D2 L2 R2 F2 B2",
    description: '每个面呈现十字架造型',
  },
];

export function getPatternFacelets(patternId: string): FaceName[] {
  if (patternId === 'checkerboard') {
    return applyMoves(SOLVED_FACELETS, "U2 D2 R2 L2 F2 B2");
  }
  const pattern = PRESET_PATTERNS.find(p => p.id === patternId);
  if (pattern) {
    return applyMoves(SOLVED_FACELETS, pattern.formula);
  }
  return [...SOLVED_FACELETS];
}
