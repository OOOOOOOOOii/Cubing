/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, RotateCw, RotateCcw, HelpCircle, BookOpen } from 'lucide-react';

interface NotationGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotationItem {
  code: string;
  name: string;
  en: string;
  action: string;
  faceColor: string;
  rotation: string;
}

const NOTATION_LIST: NotationItem[] = [
  { code: 'U', name: '顶层顺时针', en: 'Up Clockwise', action: '从上方俯视顶面，顺时针旋转 90°', faceColor: 'bg-white text-slate-900', rotation: '90° 顺时针' },
  { code: "U'", name: '顶层逆时针', en: 'Up Prime / Counter-Clockwise', action: '从上方俯视顶面，逆时针旋转 90°', faceColor: 'bg-white text-slate-900', rotation: '90° 逆时针' },
  { code: 'U2', name: '顶层180度', en: 'Up Double', action: '顶面旋转 180° (任意方向均可)', faceColor: 'bg-white text-slate-900', rotation: '180°' },

  { code: 'R', name: '右层顺时针', en: 'Right Clockwise', action: '正对右面看，顺时针旋转 90° (向上转)', faceColor: 'bg-red-600 text-white', rotation: '90° 顺时针' },
  { code: "R'", name: '右层逆时针', en: 'Right Prime', action: '正对右面看，逆时针旋转 90° (向下转)', faceColor: 'bg-red-600 text-white', rotation: '90° 逆时针' },
  { code: 'R2', name: '右层180度', en: 'Right Double', action: '右面旋转 180°', faceColor: 'bg-red-600 text-white', rotation: '180°' },

  { code: 'F', name: '前面顺时针', en: 'Front Clockwise', action: '正对前面看，顺时针旋转 90°', faceColor: 'bg-green-600 text-white', rotation: '90° 顺时针' },
  { code: "F'", name: '前面逆时针', en: 'Front Prime', action: '正对前面看，逆时针旋转 90°', faceColor: 'bg-green-600 text-white', rotation: '90° 逆时针' },
  { code: 'F2', name: '前面180度', en: 'Front Double', action: '前面旋转 180°', faceColor: 'bg-green-600 text-white', rotation: '180°' },

  { code: 'D', name: '底层顺时针', en: 'Down Clockwise', action: '从下方仰视底面，顺时针旋转 90°', faceColor: 'bg-yellow-400 text-slate-900', rotation: '90° 顺时针' },
  { code: "D'", name: '底层逆时针', en: 'Down Prime', action: '从下方仰视底面，逆时针旋转 90°', faceColor: 'bg-yellow-400 text-slate-900', rotation: '90° 逆时针' },
  { code: 'D2', name: '底层180度', en: 'Down Double', action: '底面旋转 180°', faceColor: 'bg-yellow-400 text-slate-900', rotation: '180°' },

  { code: 'L', name: '左层顺时针', en: 'Left Clockwise', action: '正对左面看，顺时针旋转 90° (向下转)', faceColor: 'bg-orange-500 text-white', rotation: '90° 顺时针' },
  { code: "L'", name: '左层逆时针', en: 'Left Prime', action: '正对左面看，逆时针旋转 90° (向上转)', faceColor: 'bg-orange-500 text-white', rotation: '90° 逆时针' },
  { code: 'L2', name: '左层180度', en: 'Left Double', action: '左面旋转 180°', faceColor: 'bg-orange-500 text-white', rotation: '180°' },

  { code: 'B', name: '后层顺时针', en: 'Back Clockwise', action: '正对后面看，顺时针旋转 90°', faceColor: 'bg-blue-600 text-white', rotation: '90° 顺时针' },
  { code: "B'", name: '后层逆时针', en: 'Back Prime', action: '正对后面看，逆时针旋转 90°', faceColor: 'bg-blue-600 text-white', rotation: '90° 逆时针' },
  { code: 'B2', name: '后层180度', en: 'Back Double', action: '后面旋转 180°', faceColor: 'bg-blue-600 text-white', rotation: '180°' },
];

export const NotationGuide: React.FC<NotationGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div id="modal-notation-guide" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">国际标准魔方转动符号速查表 (WCA Notation)</h3>
              <p className="text-xs text-slate-500 mt-0.5">字母代表面，带撇 ' 代表逆时针，带数字 2 代表旋转 180°</p>
            </div>
          </div>
          <button
            id="btn-close-notation"
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Notation Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {NOTATION_LIST.map((item) => (
              <div
                key={item.code}
                className="flex items-start gap-3 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300 transition-colors"
              >
                {/* Code Badge */}
                <div
                  className={`w-12 h-10 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 shadow-2xs ${item.faceColor}`}
                >
                  {item.code}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-slate-900">{item.name}</span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {item.rotation}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {item.action}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tip Footer */}
          <div className="mt-2 p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/80 text-xs text-amber-950 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-amber-950 font-bold">打乱公式的执行方法：</strong> 拿着复原好的魔方（白色顶面朝上，绿色前面朝前），按打乱公式从左到右依次顺次转动各层。转完后，魔方状态就与填色生成的图案完全一致！
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
