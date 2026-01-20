
import React, { useEffect, useState, useMemo } from 'react';
import { RemappedShot, PlotCharacter } from '../types';
import { Loader2, Video, Copy, Check, RefreshCw, AlertCircle, Film, Download, LayoutList, ArrowLeft, Clapperboard, Sparkles, Play, StopCircle, ArrowDown, Wand2, ArrowRight, MessageSquare } from 'lucide-react';
import { generateVideoPrompts, generatePlotVideoPrompts } from '../services/geminiService';

interface Props {
  shots: RemappedShot[];
  productToken: string;
  onBack: () => void;
  isPlotMode?: boolean;
  plotCharacters?: PlotCharacter[];
}

const Step5VideoPrompts: React.FC<Props> = ({ shots: initialShots, productToken, onBack, isPlotMode = false, plotCharacters = [] }) => {
  const [shots, setShots] = useState<RemappedShot[]>(initialShots);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [transitionPrompts, setTransitionPrompts] = useState<any[]>([]);

  const groupedShots: Record<string, RemappedShot[]> = useMemo(() => {
    const groups: Record<string, RemappedShot[]> = {};
    shots.forEach(s => {
      const sid = s.sceneId || 'default';
      if (!groups[sid]) groups[sid] = [];
      groups[sid].push(s);
    });
    return groups;
  }, [shots]);

  // 当组件加载时自动触发生成
  useEffect(() => {
    handleGenerate();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      if (isPlotMode) {
        // 调用专门为剧情模式设计的视频指令生成服务
        const results = await generatePlotVideoPrompts(shots, plotCharacters);
        // results 应该是 [{startId, endId, prompt}] 格式
        setTransitionPrompts(results || []);
      } else {
        const promptTexts = await generateVideoPrompts(shots, productToken);
        setShots(prev => prev.map((s, i) => ({ 
          ...s, 
          videoPrompt: promptTexts[i] || s.videoPrompt || `Cinematic commercial video of ${productToken}, ${s.subjectAction}, slow motion, 8k.` 
        })));
      }
    } catch (e) {
      console.error("Failed to generate video prompts:", e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
      <div className="bg-[#0f0f11] border border-white/10 p-12 rounded-[56px] shadow-2xl backdrop-blur-3xl">
        <div className="flex justify-between items-start mb-12">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-2xl border border-white/5 transition-all"><ArrowLeft size={24} /></button>
            <div>
              <h2 className="text-4xl font-black text-white uppercase flex items-center gap-5">
                {isPlotMode ? <Clapperboard className="text-amber-500" size={40} /> : <Film className="text-emerald-500" size={40} />}
                {isPlotMode ? '导演级动作及对话指令' : '视频生成提示词'}
              </h2>
              <p className="text-zinc-500 text-sm mt-2">
                {isPlotMode ? '已根据分镜间的视觉差，合成了逻辑连贯的动态生成指令与配音脚本。' : '基于分镜预览图，已为您生成了适配 Sora/Veo 的高保真视频提示词。'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={generating}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-white rounded-2xl font-black flex items-center gap-3 transition-all"
          >
            {generating ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            重新优化指令
          </button>
        </div>

        {generating && (
          <div className="mb-12 p-10 border-2 border-dashed border-zinc-800 rounded-[40px] flex flex-col items-center justify-center gap-4 bg-zinc-900/20 animate-pulse">
             <Wand2 className="text-amber-500" size={48} />
             <p className="text-xl font-black text-white uppercase tracking-widest">AI 导演正在为您编写视频动作指令...</p>
             <p className="text-zinc-500 text-xs">正在分析分镜中的动态流向、物理交互与镜头轨迹</p>
          </div>
        )}

        {isPlotMode ? (
          <div className="space-y-20">
            {Object.entries(groupedShots).map(([sceneId, group]) => (
              <div key={sceneId} className="space-y-10 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                   <div className="w-2 h-8 bg-amber-500 rounded-full" />
                   <h3 className="text-2xl font-black text-white uppercase tracking-tight">{group[0].sceneTitle || 'SCENE'}</h3>
                </div>
                
                {group.map((shot, idx) => {
                  if (idx >= group.length - 1) return null;
                  
                  const start = shot;
                  const end = group[idx + 1];
                  
                  const promptObj = transitionPrompts.find(t => 
                    (t.startShotId === start.id && t.endShotId === end.id) || 
                    (t.startId === start.id && t.endId === end.id)
                  );
                  
                  const unifiedPrompt = promptObj?.prompt || "";
                  
                  return (
                    <div key={start.id} className="bg-zinc-900/40 border border-white/10 rounded-[48px] p-10 space-y-8 group transition-all hover:bg-zinc-900/60 shadow-xl">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <span className="text-[10px] font-black text-zinc-500 uppercase">起点帧 (Start Frame)</span>
                             <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10">
                                <img src={start.generatedImageUrl} className="w-full h-full object-cover" alt="start" />
                             </div>
                          </div>
                          <div className="space-y-3">
                             <span className="text-[10px] font-black text-zinc-500 uppercase">终点帧 (End Frame)</span>
                             <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10">
                                <img src={end.generatedImageUrl} className="w-full h-full object-cover" alt="end" />
                             </div>
                          </div>
                       </div>
                       
                       <div className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-[32px] flex flex-col md:flex-row items-start gap-6">
                          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500">
                             <MessageSquare size={24} />
                          </div>
                          <div className="flex-1">
                             <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">声画脚本 (Audio/Dialogue Script)</span>
                             <div className="mt-4 space-y-3">
                                <div className="text-lg font-bold text-white leading-relaxed">
                                   <span className="text-amber-500 mr-2">[{start.dialogueType === 'VO' ? '旁白' : '角色对白'}]:</span>
                                   "{start.dialogue || '（无对话）'}"
                                </div>
                                <p className="text-xs text-zinc-500 italic flex items-center gap-2">
                                   <ArrowRight size={12} /> 过渡至下一段逻辑："{end.dialogue || '...'}"
                                </p>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center px-2">
                             <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">AI 导演视频指令 (Veo/Sora Prompt)</span>
                          </div>
                          <div className="relative">
                            <textarea 
                              readOnly 
                              value={unifiedPrompt} 
                              placeholder={generating ? "导演正在基于分镜视觉差异合成动作指令..." : "等待指令生成..."}
                              className="w-full min-h-[180px] bg-black/60 border border-white/10 rounded-[32px] p-8 text-zinc-100 font-mono text-sm leading-relaxed focus:outline-none focus:border-amber-500/30 transition-all shadow-inner" 
                            />
                            {unifiedPrompt && (
                              <button 
                                onClick={() => handleCopy(unifiedPrompt, start.id)} 
                                className="absolute bottom-6 right-6 p-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl shadow-2xl transition-all flex items-center gap-3 active:scale-95"
                              >
                                {copiedId === start.id ? <Check size={20} /> : <Copy size={20} />}
                                <span className="font-black text-xs uppercase">{copiedId === start.id ? '已复制' : '复制提示词'}</span>
                              </button>
                            )}
                          </div>
                       </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in duration-500">
            {shots.map((shot, idx) => (
              <div key={shot.id} className="bg-zinc-950 p-10 rounded-[48px] border border-white/5 space-y-8 group hover:border-emerald-500/20 transition-all">
                <div className="flex flex-col md:flex-row gap-8">
                   <div className="w-full md:w-80 aspect-video rounded-3xl overflow-hidden border border-white/10 shrink-0">
                      <img src={shot.generatedImageUrl} className="w-full h-full object-cover" alt="preview" />
                   </div>
                   <div className="flex-1 space-y-6">
                      <div className="flex justify-between items-center">
                         <span className="px-4 py-1.5 bg-zinc-800 text-zinc-400 rounded-full text-[10px] font-black uppercase tracking-widest">Shot {idx + 1} • {shot.timestamp}</span>
                         <div className="text-[10px] text-zinc-600 font-black uppercase">{shot.shotType}</div>
                      </div>
                      
                      <div className="relative">
                        <textarea 
                          readOnly 
                          value={shot.videoPrompt || ""} 
                          placeholder={generating ? "正在生成视频动作提示词..." : "提示词为空"}
                          className="w-full h-48 bg-black/40 rounded-[32px] p-8 text-zinc-200 font-mono text-sm leading-relaxed border border-white/5 focus:outline-none" 
                        />
                        {shot.videoPrompt && (
                           <button 
                             onClick={() => handleCopy(shot.videoPrompt!, shot.id)} 
                             className="absolute bottom-6 right-6 p-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl shadow-2xl transition-all flex items-center gap-3 active:scale-95"
                           >
                             {copiedId === shot.id ? <Check size={18} /> : <Copy size={18} />}
                             <span className="font-black text-xs uppercase">{copiedId === shot.id ? '已复制' : '复制'}</span>
                           </button>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Step5VideoPrompts;
