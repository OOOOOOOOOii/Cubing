/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Move, SolveResult, ValidationResult } from '../cube/types';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Copy,
  Check,
  Zap,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SolutionViewerProps {
  solveResult: SolveResult | null;
  validation: ValidationResult;
  isCalculating: boolean;
  currentStepIndex: number; // -1: before start, 0..N-1: step in playback
  playbackMode: 'scramble' | 'solution';
  onSetPlaybackMode: (mode: 'scramble' | 'solution') => void;
  onStepChange: (stepIndex: number) => void;
  onApplyMoveStep: (move: Move) => void;
  onOpenNotationGuide: () => void;
  onCalculate: () => void;
}

export const SolutionViewer: React.FC<SolutionViewerProps> = ({
  solveResult,
  validation,
  isCalculating,
  currentStepIndex,
  playbackMode,
  onSetPlaybackMode,
  onStepChange,
  onOpenNotationGuide,
  onCalculate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1000); // ms per move
  const [copiedScramble, setCopiedScramble] = useState(false);
  const [copiedSolution, setCopiedSolution] = useState(false);

  const activeMoves = solveResult
    ? playbackMode === 'scramble'
      ? solveResult.scrambleMoves
      : solveResult.solutionMoves
    : [];

  const totalSteps = activeMoves.length;

  // Auto-play timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        onStepChange((prev) => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            if (playbackMode === 'solution') {
              try {
                confetti({
                  particleCount: 80,
                  spread: 60,
                  origin: { y: 0.7 },
                });
              } catch {
                // ignore
              }
            }
            return prev;
          }
          return prev + 1;
        });
      }, playSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playSpeed, totalSteps, playbackMode, onStepChange]);

  const copyToClipboard = async (text: string, type: 'scramble' | 'solution') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'scramble') {
        setCopiedScramble(true);
        setTimeout(() => setCopiedScramble(false), 2000);
      } else {
        setCopiedSolution(true);
        setTimeout(() => setCopiedSolution(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleTogglePlay = () => {
    if (currentStepIndex >= totalSteps - 1) {
      onStepChange(-1);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div id="solution-viewer-container" className="flex flex-col gap-4">
      {/* 1. Main Calculation Status Card */}
      {!validation.isValid ? (
        <div className="bg-rose-50/90 border border-rose-200 p-4 rounded-2xl flex flex-col gap-2.5 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-rose-900">魔方填色尚未完成或状态不合法</h3>
              <p className="text-xs text-rose-700/90 mt-1 leading-relaxed">
                {validation.errorMessage}
              </p>
              {validation.fixSuggestion && (
                <div className="mt-2 text-xs bg-white text-rose-800 px-3 py-1.5 rounded-lg border border-rose-200 flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>建议：{validation.fixSuggestion}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : isCalculating ? (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center shadow-xs">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-800">正在通过两阶段算法计算最短打乱与复原公式...</p>
        </div>
      ) : solveResult ? (
        <div className="flex flex-col gap-4">
          {/* Top Scramble Highlight Card (Shortest Scramble Formula) */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/30 border border-emerald-200 p-4 sm:p-5 rounded-2xl shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 shadow-2xs">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    最短打乱公式 (Scramble Formula)
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      最短仅需 {solveResult.stepCount} 步
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    从六面复原魔方开始，拧动以下公式即可得到您填色的状态
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>耗时 {solveResult.timeMs}ms</span>
              </div>
            </div>

            {/* Formula display box */}
            <div className="relative bg-white p-3.5 rounded-xl border border-emerald-200/80 shadow-inner group">
              <div className="text-base sm:text-lg font-mono font-bold tracking-wider text-emerald-950 select-all leading-relaxed break-words">
                {solveResult.scrambleString}
              </div>

              <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  总计 <span className="font-bold text-slate-900">{solveResult.stepCount}</span> 个动作步
                </span>
                <button
                  id="btn-copy-scramble"
                  type="button"
                  onClick={() => copyToClipboard(solveResult.scrambleString, 'scramble')}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer active:scale-98"
                >
                  {copiedScramble ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScramble ? '已复制公式!' : '一键复制打乱公式'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Solution Formula Card */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">⚡ 最优复原公式 (Solve Solution):</span>
                <span className="text-[11px] font-mono text-slate-500">{solveResult.stepCount} 步</span>
              </div>
              <button
                id="btn-copy-solution"
                type="button"
                onClick={() => copyToClipboard(solveResult.solutionString, 'solution')}
                className="flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                {copiedSolution ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSolution ? '已复制' : '复制复原公式'}</span>
              </button>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-xs text-slate-800 select-all break-words leading-relaxed">
              {solveResult.solutionString}
            </div>
          </div>

          {/* Step-by-Step 3D Playback Controller */}
          <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col gap-3.5">
            {/* Mode Switch & Step Indicator */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  id="btn-mode-scramble"
                  type="button"
                  onClick={() => {
                    onSetPlaybackMode('scramble');
                    onStepChange(-1);
                    setIsPlaying(false);
                  }}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    playbackMode === 'scramble'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  演练打乱公式
                </button>
                <button
                  id="btn-mode-solution"
                  type="button"
                  onClick={() => {
                    onSetPlaybackMode('solution');
                    onStepChange(-1);
                    setIsPlaying(false);
                  }}
                  className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    playbackMode === 'solution'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  演练复原公式
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenNotationGuide}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>公式符号说明</span>
                </button>

                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  步骤: {currentStepIndex + 1} / {totalSteps}
                </span>
              </div>
            </div>

            {/* Playback Controls Toolbar */}
            <div className="flex items-center justify-between bg-slate-50/90 p-2.5 rounded-xl border border-slate-200">
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Reset to Start */}
                <button
                  id="btn-player-reset"
                  type="button"
                  onClick={() => {
                    onStepChange(-1);
                    setIsPlaying(false);
                  }}
                  title="回到起始状态"
                  className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Step Back */}
                <button
                  id="btn-player-prev"
                  type="button"
                  disabled={currentStepIndex <= -1}
                  onClick={() => {
                    setIsPlaying(false);
                    onStepChange(Math.max(-1, currentStepIndex - 1));
                  }}
                  title="上一步"
                  className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Play/Pause */}
                <button
                  id="btn-player-play-pause"
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>暂停</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>{currentStepIndex >= totalSteps - 1 ? '重新播放' : '自动播放'}</span>
                    </>
                  )}
                </button>

                {/* Step Next */}
                <button
                  id="btn-player-next"
                  type="button"
                  disabled={currentStepIndex >= totalSteps - 1}
                  onClick={() => {
                    setIsPlaying(false);
                    onStepChange(Math.min(totalSteps - 1, currentStepIndex + 1));
                  }}
                  title="下一步"
                  className="p-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Speed Switcher */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-[11px] text-slate-500 hidden sm:inline">速度:</span>
                {[
                  { label: '0.5x', speed: 1500 },
                  { label: '1x', speed: 900 },
                  { label: '2x', speed: 450 },
                  { label: '3x', speed: 250 },
                ].map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => setPlaySpeed(s.speed)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                      playSpeed === s.speed
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Move Cards List */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-1 px-0.5 scrollbar-thin">
              {activeMoves.map((m, idx) => {
                const isCurrent = idx === currentStepIndex;
                const isDone = idx < currentStepIndex;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      onStepChange(idx);
                    }}
                    className={`
                      shrink-0 flex flex-col items-center justify-center w-11 h-12 rounded-xl border transition-all cursor-pointer
                      ${
                        isCurrent
                          ? 'bg-emerald-600 text-white border-emerald-600 scale-105 shadow-md ring-2 ring-emerald-400/50'
                          : isDone
                          ? 'bg-slate-100 text-slate-500 border-slate-200'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <span className="text-[9px] font-mono opacity-60">#{idx + 1}</span>
                    <span className="text-sm font-mono font-black">{m}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-center shadow-xs">
          <p className="text-xs text-slate-500">魔方状态已准备好，点击下方按钮开始求解计算</p>
          <button
            type="button"
            onClick={onCalculate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer"
          >
            立即生成最短打乱与复原公式
          </button>
        </div>
      )}
    </div>
  );
};
