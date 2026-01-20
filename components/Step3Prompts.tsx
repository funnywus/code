
import React, { useEffect, useState } from 'react';
import { RemappedShot, ShotStructure } from '../types';
import { Loader2, Wand2, RefreshCw, ArrowLeft } from 'lucide-react';
import { remapPrompts } from '../services/geminiService';

interface Props {
  productToken: string;
  structure: ShotStructure[];
  onComplete: (remappedShots: RemappedShot[]) => void;
  initialShots: RemappedShot[];
  onBack: () => void;
}

const Step3Prompts: React.FC<Props> = ({ productToken, structure, onComplete, initialShots, onBack }) => {
  const [shots, setShots] = useState<RemappedShot[]>(initialShots);
  const [generating, setGenerating] = useState(false);

  // Auto-generate if no shots yet
  useEffect(() => {
    if (shots.length === 0 && !generating) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await remapPrompts(productToken, structure);
      
      // Merge prompts with structure
      const newShots: RemappedShot[] = structure.map((s, i) => ({
        ...s,
        id: `shot-${i}-${Date.now()}`,
        finalPrompt: result.prompts[i] || `Detailed shot of ${productToken}, ${s.shotType}, ${s.lighting}`,
      }));

      setShots(newShots);
    } catch (e) {
      console.error(e);
      alert("生成提示词出错");
    } finally {
      setGenerating(false);
    }
  };

  const handlePromptChange = (id: string, newPrompt: string) => {
    setShots(prev => prev.map(s => s.id === id ? { ...s, finalPrompt: newPrompt } : s));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-start mb-8 gap-6">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors border border-white/5">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                <span className="bg-orange-600 text-[10px] px-2 py-1 rounded-md text-white font-bold uppercase">Step 3</span>
                提示词重组 (Prompt Remapping)
              </h2>
              <p className="text-zinc-400 text-sm mt-2">
                正在融合 <span className="text-blue-400 font-bold">产品视觉特征</span> + <span className="text-purple-400 font-bold">参考视频结构</span>。
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={onBack} className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-all text-xs font-bold border border-white/5">上一步</button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 border border-white/5 transition-all font-bold shadow-lg"
            >
               {generating ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
               重新生成全部
            </button>
          </div>
        </div>

        {generating && shots.length === 0 ? (
          <div className="h-60 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <Wand2 className="animate-pulse mb-4 text-orange-500" size={48} />
            <p className="text-lg font-bold text-zinc-300">正在构思完美提示词...</p>
            <p className="text-xs mt-2 font-mono">Synthesizing Product DNA & Cinematic Structure</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shots.map((shot, idx) => (
                <div key={shot.id} className="bg-zinc-950 border border-white/5 rounded-2xl p-6 group hover:border-orange-500/30 transition-all shadow-inner hover:bg-zinc-900/40">
                  <div className="flex justify-between items-center mb-4">
                     <span className="text-[10px] font-black tracking-widest text-zinc-500 bg-white/5 px-3 py-1 rounded-full uppercase">
                       SHOT {idx + 1} • {shot.timestamp}
                     </span>
                     <div className="text-[10px] text-zinc-600 font-mono italic">{shot.shotType}</div>
                  </div>
                  <textarea
                    value={shot.finalPrompt}
                    onChange={(e) => handlePromptChange(shot.id, e.target.value)}
                    className="w-full bg-transparent text-zinc-300 text-sm focus:outline-none min-h-[120px] resize-none leading-relaxed font-mono"
                    placeholder="生成的英文 Prompt 将显示在这里..."
                  />
                </div>
              ))}
            </div>
            
            <div className="flex gap-4 pt-6 border-t border-white/5">
              <button
                onClick={onBack}
                className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-2xl font-bold transition-all border border-white/5"
              >
                上一步
              </button>
              <button
                onClick={() => onComplete(shots)}
                className="flex-[2] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-emerald-900/20 uppercase tracking-widest"
              >
                确认提示词并生成分镜预览
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3Prompts;
