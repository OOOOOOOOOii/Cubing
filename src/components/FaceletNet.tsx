/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FaceName, COLOR_DEFS } from '../cube/types';
import { Lock, Hash } from 'lucide-react';

interface FaceletNetProps {
  facelets: FaceName[];
  selectedBrush: FaceName;
  onFaceletClick: (faceletIndex: number) => void;
  onFaceletPaintMultiple?: (indices: number[], color: FaceName) => void;
}

// Center facelet indices: U=4, R=13, F=22, D=31, L=40, B=49
const CENTER_INDICES = new Set([4, 13, 22, 31, 40, 49]);

export const FaceletNet: React.FC<FaceletNetProps> = ({
  facelets,
  selectedBrush,
  onFaceletClick,
}) => {
  const [showNumbers, setShowNumbers] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Render a 3x3 face grid
  const renderFaceGrid = (
    faceName: FaceName,
    startIdx: number,
    title: string,
    subTitle: string
  ) => {
    return (
      <div className="flex flex-col items-center bg-slate-50/80 p-2 sm:p-2.5 rounded-xl border border-slate-200 shadow-2xs">
        {/* Face Title */}
        <div className="flex items-center justify-between w-full mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${COLOR_DEFS[faceName].bgClass} border border-slate-300`} />
            <span className="text-xs font-bold text-slate-800">{title}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">{subTitle}</span>
        </div>

        {/* 3x3 Matrix */}
        <div className="grid grid-cols-3 gap-1 bg-slate-200/50 p-1 rounded-lg border border-slate-300/60 shadow-inner">
          {Array.from({ length: 9 }).map((_, i) => {
            const faceletIndex = startIdx + i;
            const currentColor = facelets[faceletIndex];
            const isCenter = CENTER_INDICES.has(faceletIndex);
            const colorDef = COLOR_DEFS[currentColor] || COLOR_DEFS.U;

            return (
              <button
                key={faceletIndex}
                id={`facelet-${faceletIndex}`}
                type="button"
                title={isCenter ? `中心块固定为 ${colorDef.name}` : `点击填色 (格 #${faceletIndex + 1})`}
                disabled={isCenter}
                onClick={() => onFaceletClick(faceletIndex)}
                onMouseEnter={() => {
                  if (isMouseDown && !isCenter) {
                    onFaceletClick(faceletIndex);
                  }
                }}
                className={`
                  relative w-8 h-8 sm:w-9 sm:h-9 rounded-md transition-all duration-150 flex items-center justify-center font-bold text-xs shadow-2xs
                  ${colorDef.bgClass} ${colorDef.borderClass} border
                  ${isCenter ? 'ring-2 ring-slate-400/40 cursor-not-allowed opacity-95' : 'cursor-pointer hover:scale-105 active:scale-95 hover:z-10 hover:ring-2 hover:ring-slate-400/60'}
                `}
              >
                {isCenter ? (
                  <Lock className={`w-3.5 h-3.5 ${colorDef.textClass} opacity-60`} />
                ) : showNumbers ? (
                  <span className={`text-[10px] font-mono select-none ${colorDef.textClass}`}>
                    {i + 1}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      id="facelet-net-container"
      className="flex flex-col items-center select-none"
      onMouseDown={() => setIsMouseDown(true)}
      onMouseUp={() => setIsMouseDown(false)}
      onMouseLeave={() => setIsMouseDown(false)}
    >
      {/* Top Utility Bar */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">2D展开填色图 (展开式)</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
            按住可滑动连涂
          </span>
        </div>
        <button
          id="btn-toggle-numbers"
          type="button"
          onClick={() => setShowNumbers(!showNumbers)}
          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-xl border transition-colors cursor-pointer ${
            showNumbers
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Hash className="w-3.5 h-3.5" />
          <span>{showNumbers ? '隐藏序号' : '显示序号'}</span>
        </button>
      </div>

      {/* Unfolded Cross Net Layout */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-full overflow-x-auto p-1">
        {/* Row 1: Empty, U (Up/Top), Empty, Empty */}
        <div className="col-start-2">
          {renderFaceGrid('U', 0, '顶面 (U)', 'White')}
        </div>

        {/* Row 2: L (Left), F (Front), R (Right), B (Back) */}
        <div className="col-span-4 grid grid-cols-4 gap-2 sm:gap-3">
          <div>{renderFaceGrid('L', 36, '左面 (L)', 'Orange')}</div>
          <div>{renderFaceGrid('F', 18, '前面 (F)', 'Green')}</div>
          <div>{renderFaceGrid('R', 9, '右面 (R)', 'Red')}</div>
          <div>{renderFaceGrid('B', 45, '后面 (B)', 'Blue')}</div>
        </div>

        {/* Row 3: Empty, D (Down/Bottom), Empty, Empty */}
        <div className="col-start-2">
          {renderFaceGrid('D', 27, '底面 (D)', 'Yellow')}
        </div>
      </div>
    </div>
  );
};
