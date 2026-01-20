
import React, { useState, useEffect } from 'react';
import { PlotCharacter, ImageModel } from '../types';
import { Layout, RefreshCw, Loader2, CheckCircle2, ArrowRight, ArrowLeft, Maximize2, PlayCircle } from 'lucide-react';
import { generateTurnaroundImage } from '../services/geminiService';

interface Props {
  characters: PlotCharacter[];
  model: ImageModel;
  onComplete: (updated: PlotCharacter[]) => void;
  onBack: () => void;
}

const Step2PlotReference: React.FC<Props> = ({ characters: initialChars, model, onComplete, onBack }) => {
  const [chars, setChars] = useState<PlotCharacter[]>(initialChars);
  const [generatingAll, setGeneratingAll] = useState(false);

  const generateSingle = async (idx: number) => {
    if (chars[idx].isGenerating) return;
    setChars(prev => prev.map((c, i) => i === idx ? { ...c, isGenerating: true } : c));
    try {
      const url = await generateTurnaroundImage(chars[idx], model);
      setChars(prev => prev.map((c, i) => i === idx ? { ...c, turnaroundUrl: url, isGenerating: false } : c));
    } catch (e) {
      alert("生成失败，可能由于模型权限或 API 额度问题。");
      setChars(prev => prev.map((c, i) => i === idx ? { ...c, isGenerating: false } : c));
    }
  };

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    await Promise.allSettled(chars.map((_, i) => generateSingle(i)));
    setGeneratingAll(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      <div className="grid grid-cols-1 gap-12">
        {chars.map((char, idx) => (
          <div key={char.id} className="bg-zinc-900/50 border border-white/10 rounded-[48px] p-12 shadow-2xl relative overflow-hidden group">
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-600/10 rounded-2xl flex items-center justify-center text-amber-500 font-black text-2xl">{idx + 1}</div>
                <div>
                  <h3 className="text-3xl font-black text-white uppercase tracking-tight">{char.name}</h3>
                  <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mt-1">Multi-angle Consistency Sheet • {model.includes('pro') ? 'PRO' : 'FLASH'}</p>
                </div>
              </div>
              <button 
                onClick={() => generateSingle(idx)} 
                disabled={char.isGenerating}
                className="flex items-center gap-3 px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl border border-white/5 font-black text-sm transition-all"
              >
                {char.isGenerating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                {char.turnaroundUrl ? "重新渲染多面图" : "开始生成多面图"}
              </button>
            </div>

            <div className="aspect-[21/9] bg-black/60 rounded-[40px] border border-white/5 flex items-center justify-center relative overflow-hidden group/img">
               {char.turnaroundUrl ? (
                 <img src={char.turnaroundUrl} alt="turnaround" className="w-full h-full object-contain bg-white" />
               ) : (
                 <div className="flex flex-col items-center gap-5">
                   <Layout size={64} className="text-zinc-800" />
                   <p className="text-zinc-600 font-black uppercase tracking-widest text-sm">等待渲染多面视图...</p>
                 </div>
               )}
               {char.isGenerating && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                    <Loader2 className="animate-spin text-amber-500" size={48} />
                    <span className="text-amber-500 font-black text-sm uppercase tracking-widest animate-pulse">正在锁定角色面部与服饰特征...</span>
                 </div>
               )}
            </div>

            <div className="mt-8 bg-black/30 p-6 rounded-3xl border border-white/5">
              <p className="text-xs text-zinc-500 leading-relaxed italic text-center font-medium">提示：此多面图将作为 AI 生成剧情分镜时的视觉基因，确保分镜图中的角色始终保持一致。</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-black/40 p-10 rounded-[48px] border border-white/10 backdrop-blur-3xl shadow-2xl">
        <button onClick={onBack} className="px-10 py-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-3xl font-black text-base border border-white/5 transition-all">返回人物锚定</button>
        <div className="flex gap-5">
           {!chars.every(c => c.turnaroundUrl) && (
              <button onClick={handleGenerateAll} disabled={generatingAll} className="px-10 py-5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-3xl font-black text-base border border-white/10 shadow-xl transition-all flex items-center gap-3">
                {generatingAll ? <Loader2 className="animate-spin" size={20} /> : <PlayCircle size={20} />}
                一键并行渲染
              </button>
           )}
           <button 
             onClick={() => onComplete(chars)} 
             disabled={!chars.some(c => c.turnaroundUrl)} 
             className="px-14 py-5 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white rounded-[28px] font-black text-base shadow-2xl shadow-emerald-900/40 transition-all flex items-center gap-4 disabled:opacity-30 group"
           >
             进入剧情构思
             <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default Step2PlotReference;
