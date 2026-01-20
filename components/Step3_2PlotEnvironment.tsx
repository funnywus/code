
import React, { useState } from 'react';
import { PlotEnvironment, PlotStyle, ImageModel } from '../types';
import { Mountain, Sparkles, Loader2, ArrowLeft, ArrowRight, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { generateEnvironmentImage } from '../services/geminiService';

interface Props {
  environments: PlotEnvironment[];
  style: PlotStyle;
  model: ImageModel;
  onComplete: (updated: PlotEnvironment[]) => void;
  onBack: () => void;
}

const Step3_2PlotEnvironment: React.FC<Props> = ({ environments: initialEnvs, style, model, onComplete, onBack }) => {
  const [envs, setEnvs] = useState<PlotEnvironment[]>(initialEnvs);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const generateEnv = async (id: string) => {
    setIsGenerating(id);
    try {
      const env = envs.find(e => e.id === id);
      if (env) {
        const url = await generateEnvironmentImage(env, style, model);
        setEnvs(prev => prev.map(e => e.id === id ? { ...e, imageUrl: url } : e));
      }
    } catch (e) {
      alert("环境渲染失败");
    } finally {
      setIsGenerating(null);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase flex items-center justify-center gap-5">
           <Mountain className="text-emerald-500" size={48} />
           场景视觉锚定
        </h2>
        <p className="text-zinc-500 text-lg">在生成分镜前，先锁定故事发生的物理环境，确保所有镜头背景绝对一致。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {envs.map((env) => (
          <div key={env.id} className="bg-zinc-900/40 border border-white/10 rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl group">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-black text-white">{env.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1 italic">"{env.description}"</p>
               </div>
               <button 
                 onClick={() => generateEnv(env.id)} 
                 disabled={!!isGenerating}
                 className="p-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl transition-all"
               >
                 {isGenerating === env.id ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
               </button>
            </div>

            <div className="aspect-video bg-black rounded-[32px] overflow-hidden border border-white/5 relative flex items-center justify-center">
               {env.imageUrl ? (
                 <img src={env.imageUrl} className="w-full h-full object-cover" alt="env" />
               ) : (
                 <div className="flex flex-col items-center gap-4">
                    <Mountain size={48} className="text-zinc-800" />
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">等待场景渲染...</span>
                 </div>
               )}
               {isGenerating === env.id && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="animate-spin text-emerald-500" size={48} />
                 </div>
               )}
               {env.imageUrl && (
                 <div className="absolute bottom-4 left-4 bg-emerald-500 text-white text-[10px] font-black px-4 py-2 rounded-full flex items-center gap-2 shadow-xl">
                    <ShieldCheck size={14} /> ANCHOR ACTIVE
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center bg-black/40 p-10 rounded-[48px] border border-white/10 shadow-2xl">
        <button onClick={onBack} className="px-10 py-5 bg-zinc-900 text-zinc-400 rounded-3xl font-black">返回剧情构思</button>
        <button 
          onClick={() => onComplete(envs)} 
          disabled={!envs.every(e => !!e.imageUrl)}
          className="px-14 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-[28px] font-black shadow-2xl shadow-emerald-900/40 transition-all flex items-center gap-4 disabled:opacity-30"
        >
          确定环境，进入换装
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default Step3_2PlotEnvironment;
