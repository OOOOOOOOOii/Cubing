/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FaceName, COLOR_DEFS } from '../cube/types';
import { PRESET_PATTERNS } from '../cube/cubeState';
import { Check, Sparkles, Shuffle, RotateCcw, Paintbrush, Layers, Volume2, VolumeX } from 'lucide-react';

interface ColorPaletteProps {
  selectedBrush: FaceName;
  onSelectBrush: (face: FaceName) => void;
  colorCounts: Record<FaceName, number>;
  onResetSolved: () => void;
  onRandomScramble: () => void;
  onApplyPattern: (patternId: string) => void;
  onManualMove: (move: string) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
  selectedBrush,
  onSelectBrush,
  colorCounts,
  onResetSolved,
  onRandomScramble,
  onApplyPattern,
  onManualMove,
  soundEnabled,
  onToggleSound,
}) => {
  const faces: FaceName[] = ['U', 'R', 'F', 'D', 'L', 'B'];

  return (
    <div id="palette-toolbar" className="flex flex-col gap-3.5 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
      {/* Top Header & Sound Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-bold text-slate-800">画笔调色盘 (选择颜色点击色块)</span>
        </div>
        <button
          id="btn-toggle-sound"
          type="button"
          onClick={onToggleSound}
          title={soundEnabled ? '静音' : '开启音效'}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 transition-colors cursor-pointer"
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          <span className="hidden sm:inline">{soundEnabled ? '音效已开' : '静音'}</span>
        </button>
      </div>

      {/* 6 Color Brushes with Count Indicator */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {faces.map((face) => {
          const def = COLOR_DEFS[face];
          const count = colorCounts[face] || 0;
          const isSelected = selectedBrush === face;
          const isExact = count === 9;
          const isOver = count > 9;

          return (
            <button
              key={face}
              id={`brush-${face}`}
              type="button"
              onClick={() => onSelectBrush(face)}
              className={`
                relative flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all duration-150 cursor-pointer
                ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50/50 border-emerald-300 scale-[1.02] shadow-xs' : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80'}
              `}
            >
              {/* Color Circle */}
              <div className="relative mb-1.5">
                <div
                  className={`w-7 h-7 rounded-full ${def.bgClass} ${def.borderClass} border shadow-xs flex items-center justify-center`}
                >
                  {isSelected && (
                    <Check className={`w-4 h-4 ${def.textClass} stroke-[3]`} />
                  )}
                </div>
              </div>

              {/* Color Name */}
              <span className="text-xs font-semibold text-slate-800">{def.name.split(' ')[0]}</span>

              {/* Count Badge */}
              <div className="mt-1 flex items-center gap-0.5">
                <span
                  className={`text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded-full ${
                    isExact
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isOver
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}
                >
                  {count}/9
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
        <button
          id="btn-reset-solved"
          type="button"
          onClick={onResetSolved}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:border-slate-300 transition-all shadow-xs active:scale-98 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
          <span>重置为已复原</span>
        </button>

        <button
          id="btn-random-scramble"
          type="button"
          onClick={onRandomScramble}
          className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:border-slate-300 transition-all shadow-xs active:scale-98 cursor-pointer"
        >
          <Shuffle className="w-3.5 h-3.5 text-amber-600" />
          <span>随机打乱 (20步)</span>
        </button>

        {/* Pattern Presets Dropdown/Menu */}
        <div className="relative flex-1 min-w-[140px]">
          <div className="relative">
            <select
              id="select-preset-pattern"
              onChange={(e) => {
                if (e.target.value) {
                  onApplyPattern(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="w-full bg-white hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:border-slate-300 transition-all shadow-xs cursor-pointer appearance-none pr-7"
            >
              <option value="" disabled>🧩 经典花样图案...</option>
              {PRESET_PATTERNS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Sparkles className="w-3.5 h-3.5 text-purple-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Manual Layer Turns Quick Bar */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>手动拧动转动层 (模拟物理旋转):</span>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1 sm:gap-1.5">
          {(['U', 'R', 'F', 'D', 'L', 'B'] as FaceName[]).map((face) => (
            <div key={face} className="flex flex-col gap-1">
              <button
                id={`btn-move-${face}`}
                type="button"
                onClick={() => onManualMove(face)}
                title={`顺时针旋转 ${face} 层 90°`}
                className="bg-slate-50 hover:bg-emerald-600 hover:text-white text-slate-800 text-xs font-mono font-bold py-1 rounded-lg border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              >
                {face}
              </button>
              <button
                id={`btn-move-${face}-prime`}
                type="button"
                onClick={() => onManualMove(`${face}'`)}
                title={`逆时针旋转 ${face}' 层 90°`}
                className="bg-slate-50/80 hover:bg-rose-600 hover:text-white text-slate-600 text-[11px] font-mono font-bold py-0.5 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
              >
                {face}'
              </button>
              <button
                id={`btn-move-${face}-2`}
                type="button"
                onClick={() => onManualMove(`${face}2`)}
                title={`180°旋转 ${face}2 层`}
                className="bg-slate-50/60 hover:bg-amber-600 hover:text-white text-slate-500 text-[10px] font-mono font-bold py-0.5 rounded-lg border border-slate-200/60 transition-colors cursor-pointer"
              >
                {face}2
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
