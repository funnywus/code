
import React, { useEffect, useState } from 'react';
import { ShotStructure, RemappedShot } from '../types';
import { Loader2, Clapperboard, RefreshCw, ArrowRight, Wand2, Sparkles, MonitorPlay, ArrowLeft } from 'lucide-react';
import { brainstormCreativeShots, remapPrompts } from '../services/geminiService';

interface Props {
  productToken: string;
  requirement: string;
  onComplete: (shots: RemappedShot[]) => void;
  initialShots: RemappedShot[];
  onBack: () => void;
}

const Step2CreativeScript: React.FC<Props> = ({ productToken, requirement, onComplete, initialShots, onBack }) => {
  const [shots, setShots] = useState<RemappedShot[]>(initialShots);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (shots.length === 0) handleGenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const structure = await brainstormCreativeShots(productToken, requirement);
      const promptResult = await remapPrompts(productToken, structure);
      
      const newShots: RemappedShot[] = structure.map((s, i) => ({
        ...s,
        id: `c-shot-${i}-${Date.now()}`,
        finalPrompt: promptResult.prompts[i] || s.subjectAction,
      }));
      setShots(newShots);
    } catch (e) {
      alert("策划失败，请检查 API Key 权限。");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-[#0f0f11] border border-white/10 p-8 rounded-2xl animate-in fade-in duration-500 shadow-2xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div className="flex items-center gap-6">
           <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors border border-white/5">
              <ArrowLeft size={20} />
           </button>
           <div>
             <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
               <Clapperboard className="text-orange-500" />
               AI 导演创意脚本 (Director's Master Script)
             </h2>
             <p className="text-zinc-500 text-sm mt-2 flex items-center gap-2">
               <Sparkles size={14} className="text-blue-400" />
               基于深度语义理解，已为您构建了具有叙事张力和高保真视觉潜力的商业脚本。
             </p>
           </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onBack} className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl transition-all text-sm font-bold border border-white/5">上一步</button>
          <button onClick={handleGenerate} disabled={generating} className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-6 py-3 rounded-xl text-sm transition-all border border-white/5 font-bold shadow-lg">
            {generating ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
            {shots.length > 0 ? "重新导演脚本" : "生成脚本"}
          </button>
        </div>
      </div>

      {generating && shots.length === 0 ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6 border border-dashed border-zinc-800 rounded-3xl bg-zinc-900/20">
          <div className="relative">
            <Wand2 className="animate-pulse text-orange-500" size={64} />
            <div className="absolute -inset-4 bg-orange-500/10 blur-2xl animate-pulse rounded-full" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-zinc-300 font-bold text-xl animate-pulse">正在深度解读创意需求...</p>
            <p className="text-zinc-500 text-sm">正在运用商业导演思维构建分镜逻辑与视觉基调</p>
          </div>
          <div className="flex gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Creative Direction Summary */}
          {shots.length > 0 && (
            <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-2xl flex items-start gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                <MonitorPlay size={24} />
              </div>
              <div>
                <h4 className="text-blue-400 font-bold text-sm uppercase tracking-wider mb-1">创意调性 (Mood & Style)</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  本脚本采用顶级商业广告叙事手法，从宏观氛围铺垫，到产品材质特写，最后通过高动态动作达成视觉高潮。所有分镜提示词均已针对高保真渲染引擎（Gemini Pro Image）进行了深度优化。
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shots.map((shot, idx) => (
              <div key={shot.id} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 hover:border-orange-500/30 transition-all group flex flex-col shadow-inner">
                <div className="flex justify-between items-center mb-4">
                   <div className="bg-orange-500/10 text-orange-400 px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase">SHOT {idx + 1}</div>
                   <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-zinc-700" />
                      {shot.timestamp}
                   </div>
                </div>
                
                <div className="flex-1 space-y-4">
                   <div className="bg-black/20 p-4 rounded-xl border border-white/5 min-h-[100px]">
                      <p className="text-sm text-zinc-300 font-medium leading-relaxed italic">"{shot.subjectAction}"</p>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-2">
                      <div className="bg-zinc-800/50 p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Cinematography</div>
                        <div className="text-[10px] text-zinc-300 truncate font-mono">{shot.cameraMovement}</div>
                      </div>
                      <div className="bg-zinc-800/50 p-2 rounded-lg border border-white/5">
                        <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Atmosphere</div>
                        <div className="text-[10px] text-zinc-300 truncate font-mono">{shot.lighting}</div>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <div className="text-[9px] text-zinc-500 uppercase font-bold px-1">Visual Prompt (Image Engine)</div>
                      <textarea
                        value={shot.finalPrompt}
                        onChange={(e) => setShots(prev => prev.map(s => s.id === shot.id ? {...s, finalPrompt: e.target.value} : s))}
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-[11px] text-zinc-400 focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none font-mono leading-relaxed"
                        rows={5}
                      />
                   </div>
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => onComplete(shots)}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-5 rounded-2xl font-bold text-white flex items-center justify-center gap-3 group shadow-2xl transition-all"
          >
            确认导演脚本并开始渲染分镜
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Step2CreativeScript;
