/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaceName, Move, SolveResult } from './cube/types';
import { SOLVED_FACELETS, validateCubeState, CubeSolver } from './cube/solver';
import {
  applyMove,
  applyMoves,
  generateRandomScramble,
  getPatternFacelets,
  PRESET_PATTERNS,
} from './cube/cubeState';
import { soundFx } from './cube/audio';
import { Cube3D } from './components/Cube3D';
import { FaceletNet } from './components/FaceletNet';
import { ColorPalette } from './components/ColorPalette';
import { SolutionViewer } from './components/SolutionViewer';
import { NotationGuide } from './components/NotationGuide';
import {
  Box,
  LayoutGrid,
  Zap,
  BookOpen,
  Sparkles,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Info,
  Wand2,
} from 'lucide-react';

export default function App() {
  // Current 54 facelet state
  const [facelets, setFacelets] = useState<FaceName[]>([...SOLVED_FACELETS]);
  // Selected brush color (U, R, F, D, L, B)
  const [selectedBrush, setSelectedBrush] = useState<FaceName>('U');
  // Sound toggle
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  // View mode: 'split' | '3d' | '2d'
  const [viewTab, setViewTab] = useState<'both' | '3d' | '2d'>('both');
  // Notation guide modal
  const [isNotationModalOpen, setIsNotationModalOpen] = useState(false);

  // Solution and Scramble Calculation State
  const [solveResult, setSolveResult] = useState<SolveResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Step-by-Step Playback State
  const [playbackMode, setPlaybackMode] = useState<'scramble' | 'solution'>('scramble');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1); // -1 = initial state before steps
  // Base snapshot state before playback
  const [baseFaceletsSnapshot, setBaseFaceletsSnapshot] = useState<FaceName[]>([...SOLVED_FACELETS]);

  // Validation
  const validation = useMemo(() => {
    return validateCubeState(facelets);
  }, [facelets]);

  // Calculate solve and scramble formulas whenever facelets change (if valid)
  const calculateFormulas = useCallback((currentFacelets: FaceName[]) => {
    const val = validateCubeState(currentFacelets);
    if (!val.isValid) {
      setSolveResult(null);
      return;
    }

    setIsCalculating(true);
    // Use setTimeout so UI remains silky smooth
    setTimeout(() => {
      try {
        const res = CubeSolver.solve(currentFacelets);
        setSolveResult(res);
        setBaseFaceletsSnapshot([...currentFacelets]);
        setCurrentStepIndex(-1);
        soundFx.playSuccessSound();
      } catch (err) {
        console.error('Solve error:', err);
        setSolveResult(null);
      } finally {
        setIsCalculating(false);
      }
    }, 20);
  }, []);

  // Initial calculation on mount
  useEffect(() => {
    CubeSolver.initTables();
    calculateFormulas(SOLVED_FACELETS);
  }, [calculateFormulas]);

  // Auto recalculate when facelets change and valid
  const handleUpdateFacelets = (newFacelets: FaceName[]) => {
    setFacelets(newFacelets);
    calculateFormulas(newFacelets);
  };

  // Color a single facelet
  const handleFaceletClick = (index: number) => {
    // Prevent changing center pieces (4, 13, 22, 31, 40, 49)
    const centerIndices = [4, 13, 22, 31, 40, 49];
    if (centerIndices.includes(index)) return;

    if (facelets[index] === selectedBrush) return;

    const next = [...facelets];
    next[index] = selectedBrush;
    soundFx.playPaintSound();
    handleUpdateFacelets(next);
  };

  // Reset to solved
  const handleResetSolved = () => {
    soundFx.playTurnSound();
    handleUpdateFacelets([...SOLVED_FACELETS]);
  };

  // Random Scramble
  const handleRandomScramble = () => {
    soundFx.playTurnSound();
    const { facelets: scrambled } = generateRandomScramble(20);
    handleUpdateFacelets(scrambled);
  };

  // Apply Pattern Preset
  const handleApplyPattern = (patternId: string) => {
    soundFx.playTurnSound();
    const patternFacelets = getPatternFacelets(patternId);
    handleUpdateFacelets(patternFacelets);
  };

  // Manual Face Turn (e.g. "R", "U'", "F2")
  const handleManualMove = (move: string) => {
    soundFx.playTurnSound();
    const next = applyMove(facelets, move as Move);
    handleUpdateFacelets(next);
  };

  // Step-by-step playback step change
  const handleStepChange = (targetStep: number | ((prev: number) => number)) => {
    const nextStep = typeof targetStep === 'function' ? targetStep(currentStepIndex) : targetStep;
    setCurrentStepIndex(nextStep);

    if (!solveResult) return;

    soundFx.playTurnSound();

    if (playbackMode === 'scramble') {
      // Scramble starts from SOLVED state and applies scramble moves up to nextStep
      let s = [...SOLVED_FACELETS];
      for (let i = 0; i <= nextStep; i++) {
        if (solveResult.scrambleMoves[i]) {
          s = applyMove(s, solveResult.scrambleMoves[i]);
        }
      }
      setFacelets(s);
    } else {
      // Solution starts from base snapshot and applies solution moves up to nextStep
      let s = [...baseFaceletsSnapshot];
      for (let i = 0; i <= nextStep; i++) {
        if (solveResult.solutionMoves[i]) {
          s = applyMove(s, solveResult.solutionMoves[i]);
        }
      }
      setFacelets(s);
    }
  };

  // Auto-fix minor issues if possible (e.g. fill missing colors)
  const handleAutoFixColors = () => {
    const counts = { ...validation.colorCounts };
    const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];
    const next = [...facelets];

    // Collect faces that need colors
    for (let i = 0; i < 54; i++) {
      const centerIndices = [4, 13, 22, 31, 40, 49];
      if (centerIndices.includes(i)) continue;

      const currentColor = next[i];
      if (counts[currentColor] > 9) {
        // Find a color that has < 9
        const neededFace = faces.find(f => counts[f] < 9);
        if (neededFace) {
          counts[currentColor]--;
          counts[neededFace]++;
          next[i] = neededFace;
        }
      }
    }

    soundFx.playSuccessSound();
    handleUpdateFacelets(next);
  };

  return (
    <div id="rubiks-app" className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500/20 font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-600 rounded-xl shadow-xs text-white flex items-center justify-center">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                魔方填色与最短打乱公式生成器
                <span className="hidden md:inline text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                  Kociemba 两阶段最优算法
                </span>
              </h1>
              <p className="text-[11px] text-slate-500">
                任意填色状态 • 实时校验 • 生成最短复原与打乱公式 • 3D逐帧演练
              </p>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-2">
            <button
              id="btn-open-notation"
              type="button"
              onClick={() => setIsNotationModalOpen(true)}
              className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 transition-colors shadow-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">公式符号表</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: 3D Cube & 2D Net & Color Palette (7 cols on lg) */}
        <section id="section-cube-editor" className="lg:col-span-7 flex flex-col gap-4">
          {/* View Tab Switcher for Cube Area */}
          <div className="flex items-center justify-between bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewTab('both')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewTab === 'both'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>3D与2D协同</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewTab === '3d'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>仅看3D立体</span>
              </button>
              <button
                type="button"
                onClick={() => setViewTab('2d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewTab === '2d'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>仅看2D展开图</span>
              </button>
            </div>

            <div className="text-[11px] font-semibold px-2 hidden sm:flex items-center gap-1">
              {validation.isValid ? (
                <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  状态合法
                </span>
              ) : (
                <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  待补齐
                </span>
              )}
            </div>
          </div>

          {/* Interactive Cube Display Cards */}
          <div className="grid grid-cols-1 gap-4">
            {/* 3D WebGL Canvas Card */}
            {(viewTab === 'both' || viewTab === '3d') && (
              <div className="relative bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-h-[350px] flex items-center justify-center">
                <Cube3D
                  facelets={facelets}
                  selectedBrush={selectedBrush}
                  onFaceletClick={handleFaceletClick}
                  isInteractive={true}
                />
              </div>
            )}

            {/* 2D Unfolded Net Card */}
            {(viewTab === 'both' || viewTab === '2d') && (
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <FaceletNet
                  facelets={facelets}
                  selectedBrush={selectedBrush}
                  onFaceletClick={handleFaceletClick}
                />
              </div>
            )}
          </div>

          {/* Palette & Presets Toolbar */}
          <ColorPalette
            selectedBrush={selectedBrush}
            onSelectBrush={setSelectedBrush}
            colorCounts={validation.colorCounts}
            onResetSolved={handleResetSolved}
            onRandomScramble={handleRandomScramble}
            onApplyPattern={handleApplyPattern}
            onManualMove={handleManualMove}
            soundEnabled={soundEnabled}
            onToggleSound={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundFx.setEnabled(next);
            }}
          />
        </section>

        {/* Right Column: Shortest Scramble & Solution Results (5 cols on lg) */}
        <section id="section-solution-panel" className="lg:col-span-5 flex flex-col gap-4">
          <SolutionViewer
            solveResult={solveResult}
            validation={validation}
            isCalculating={isCalculating}
            currentStepIndex={currentStepIndex}
            playbackMode={playbackMode}
            onSetPlaybackMode={setPlaybackMode}
            onStepChange={handleStepChange}
            onApplyMoveStep={handleManualMove}
            onOpenNotationGuide={() => setIsNotationModalOpen(true)}
            onCalculate={() => calculateFormulas(facelets)}
          />

          {/* Intelligent Fix Helper when color counts are skewed */}
          {!validation.isValid && validation.errorType === 'COUNT' && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <Wand2 className="w-4 h-4 text-emerald-600" />
                <span>色块数量不均？可一键自动平衡补全</span>
              </div>
              <button
                type="button"
                onClick={handleAutoFixColors}
                className="text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors shrink-0 cursor-pointer"
              >
                自动平衡各色数量
              </button>
            </div>
          )}

          {/* Tips Card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-slate-500 flex flex-col gap-2 shadow-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-blue-600" />
              <span>使用指南与技巧</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 leading-relaxed text-[11px]">
              <li>
                <strong className="text-slate-800">最短打乱公式</strong>：即从复原魔方转动出当前填色状态的最短步骤（通常在20步以内）。
              </li>
              <li>
                <strong className="text-slate-800">填色方式</strong>：可在调色盘点击选中某种颜色画笔，然后在2D展开图或3D模型上直接点击/按住涂抹。
              </li>
              <li>
                <strong className="text-slate-800">中心块固定</strong>：魔方的6个中心块决定了面的标准朝向（白色朝顶，绿色朝前）。
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* Notation Guide Modal */}
      <NotationGuide
        isOpen={isNotationModalOpen}
        onClose={() => setIsNotationModalOpen(false)}
      />
    </div>
  );
}
