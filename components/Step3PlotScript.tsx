
import React, { useState, useRef, useEffect } from 'react';
import { PlotCharacter, RemappedShot, ShotStructure } from '../types';
import { MessageSquareText, Clapperboard, Sparkles, Loader2, ArrowLeft, ArrowRight, Wand2, CheckCircle2, Layout, Film, History, Plus, GitCompareArrows, MoveRight, BookOpen, ScrollText, Palette, MonitorPlay, Zap, Edit3, Save, Activity, Layers, PenTool } from 'lucide-react';
import { proposePlotStrategy, brainstormFilmPlot, remapPrompts, extendNarrativeArc, extendFilmPlot } from '../services/geminiService';

interface Props {
  characters: PlotCharacter[];
  onComplete: (shots: RemappedShot[], requirement: string, proposal: any) => void;
  onBack: () => void;
}

const Step3PlotScript: React.FC<Props> = ({ characters, onComplete, onBack }) => {
  const [requirement, setRequirement] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [proposal, setProposal] = useState<any>(null);
  const [shots, setShots] = useState<RemappedShot[]>([]);
  const [isGeneratingShots, setIsGeneratingShots] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isExpandingArc, setIsExpandingArc] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [shots, proposal]);

  const handlePropose = async () => {
    if (!requirement) return;
    setAnalyzing(true);
    try {
      const result = await proposePlotStrategy(characters, requirement);
      setProposal(result);
      setShots([]); 
    } catch (e) {
      alert("策划提案失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleInitialGenerate = async () => {
    if (!proposal) return;
    setIsGeneratingShots(true);
    try {
      const structure = await brainstormFilmPlot(characters, proposal);
      const styleContext = `Film Style: ${proposal.visualTheme}. Keywords: ${proposal.keyStyleKeywords.join(', ')}.`;
      const promptResult = await remapPrompts(`${styleContext} Characters DNA: ${characters.map(c => `${c.name}: ${c.token}`).join('. ')}`, structure);
      
      const newShots: RemappedShot[] = structure.map((s, i) => ({
        ...s,
        id: `plot-shot-${i}-${Date.now()}`,
        finalPrompt: promptResult.prompts[i] || s.subjectAction,
      }));
      setShots(newShots);
    } catch (e) {
      alert("生成分镜脚本失败");
    } finally {
      setIsGeneratingShots(false);
    }
  };

  const handleExpandArc = async () => {
    if (!proposal) return;
    setIsExpandingArc(true);
    try {
      const newArc = await extendNarrativeArc(characters, proposal);
      setProposal(prev => ({ ...prev, narrativeArc: newArc.narrativeArc }));
      // If we already have shots, trigger extra shots generation too
      if (shots.length > 0) {
        await handleExtendPlot();
      }
    } catch (e) {
      alert("故事续写失败");
    } finally {
      setIsExpandingArc(false);
    }
  };

  const handleExtendPlot = async () => {
    if (!proposal || shots.length === 0) return;
    setIsExtending(true);
    try {
      const newStructure = await extendFilmPlot(characters, proposal, shots);
      if (newStructure.length === 0) return;

      const styleContext = `Film Style: ${proposal.visualTheme}. Keywords: ${proposal.keyStyleKeywords.join(', ')}.`;
      const promptResult = await remapPrompts(`${styleContext} Characters DNA: ${characters.map(c => `${c.name}: ${c.token}`).join('. ')}`, newStructure);

      const newShots: RemappedShot[] = newStructure.map((s, i) => ({
        ...s,
        id: `ext-shot-${shots.length + i}-${Date.now()}`,
        finalPrompt: promptResult.prompts[i] || s.subjectAction,
      }));
      
      setShots(prev => [...prev, ...newShots]);
    } catch (e) {
      alert("剧情续写失败，请重试");
    } finally {
      setIsExtending(false);
    }
  };

  const updateProposalField = (field: string, value: any) => {
    setProposal(prev => ({ ...prev, [field]: value }));
  };

  const ProposalField = ({ label, field, value, icon: Icon, isTextArea = false, canExpand = false }: { label: string, field: string, value: any, icon: any, isTextArea?: boolean, canExpand?: boolean }) => {
    const isEditing = editingField === field;
    return (
      <div className="bg-white/5 p-8 rounded-[32px] border border-white/5 space-y-4 group transition-all hover:bg-white/[0.07] relative">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3 text-amber-400">
             <Icon size={20} />
             <span className="text-xs font-black uppercase tracking-widest">{label}</span>
          </div>
          <div className="flex items-center gap-2">
            {canExpand && (
              <button onClick={handleExpandArc} disabled={isExpandingArc} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase transition-all border border-amber-500/20">
                {isExpandingArc ? <Loader2 size={12} className="animate-spin" /> : <PenTool size={12} />}
                ✨ 灵感续写
              </button>
            )}
            <button onClick={() => setEditingField(isEditing ? null : field)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-zinc-400 transition-all">
              {isEditing ? <Save size={16} className="text-emerald-500" /> : <Edit3 size={16} />}
            </button>
          </div>
        </div>
        {isEditing ? (
          <textarea 
            value={value} 
            onChange={(e) => updateProposalField(field, e.target.value)}
            className="w-full bg-black/40 border border-amber-500/30 rounded-2xl p-4 text-zinc-100 text-sm focus:outline-none resize-none font-medium"
            rows={isTextArea ? 6 : 1}
          />
        ) : (
          <p className={`${isTextArea ? 'text-zinc-300 text-lg whitespace-pre-wrap' : 'text-zinc-100 text-2xl font-black italic'} leading-relaxed`}>{value}</p>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-700 max-w-[2000px] mx-auto pb-20">
      <div className="flex flex-col gap-10">
        <div className="bg-zinc-900/60 border border-white/10 p-12 rounded-[56px] flex flex-col gap-8 shadow-2xl backdrop-blur-3xl">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl border border-white/5 transition-all"><ArrowLeft size={24} /></button>
            <h3 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4">
              <MessageSquareText className="text-amber-500" size={40} />
              导演创意蓝图
            </h3>
          </div>

          <textarea 
            value={requirement} 
            onChange={e => setRequirement(e.target.value)}
            disabled={proposal !== null && !analyzing}
            className="w-full min-h-[200px] bg-black/60 border border-white/10 rounded-[40px] p-10 text-xl text-white focus:ring-2 focus:ring-amber-500/50 outline-none resize-none transition-all leading-relaxed shadow-inner"
            placeholder="描述您的电影构想（如：角色身份、核心动作、情感基调...）"
          />

          <button 
            onClick={handlePropose} 
            disabled={analyzing || !requirement} 
            className="bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white py-6 rounded-[36px] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-5 disabled:opacity-30"
          >
            {analyzing ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
            {proposal ? "重新策划提案" : "启动顶级导演提案"}
          </button>
        </div>

        {proposal && (
          <div className="bg-zinc-950/80 border border-amber-500/20 p-12 rounded-[56px] flex flex-col gap-10 shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
            <ProposalField label="电影标题" field="filmTitle" value={proposal.filmTitle} icon={Film} />
            <ProposalField label="故事梗概 (可点击右侧按钮续写)" field="narrativeArc" value={proposal.narrativeArc} icon={ScrollText} isTextArea canExpand />
            <ProposalField label="导演策划" field="directorConcept" value={proposal.directorConcept} icon={MonitorPlay} isTextArea />
            
            {shots.length === 0 && (
              <button onClick={handleInitialGenerate} disabled={isGeneratingShots} className="w-full bg-amber-600 hover:bg-amber-500 py-6 rounded-[28px] font-black text-xl text-white flex items-center justify-center gap-3 transition-all">
                {isGeneratingShots ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                方案确认，开始生成导演脚本
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-zinc-900/60 border border-white/10 p-12 rounded-[56px] flex flex-col gap-10 shadow-2xl max-h-[85vh] overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-4"><Film className="text-blue-500" size={40} /> 分镜视觉脚本</h3>
          <div className="px-4 py-2 bg-emerald-500/10 rounded-full border border-emerald-500/20 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-[10px] text-emerald-500 font-black tracking-widest uppercase">Motion Chain Active</span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-4 scrollbar-thin">
           {shots.length > 0 ? (
             <div className="space-y-4">
               {shots.map((shot, idx) => (
                 <React.Fragment key={shot.id}>
                    <div className="bg-black/40 p-8 rounded-[40px] border border-white/5 space-y-6 relative hover:border-blue-500/20 transition-all shadow-inner group">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-black bg-blue-600/20 text-blue-400 border border-blue-500/30 px-4 py-1.5 rounded-full uppercase tracking-widest">SHOT {idx + 1}</span>
                           <span className="text-[10px] text-zinc-600 font-mono italic">{shot.shotType}</span>
                        </div>
                        <p className="text-lg text-zinc-100 font-bold leading-relaxed italic">"{shot.subjectAction}"</p>
                        <div className="flex justify-between text-[10px] text-zinc-500 pt-4 border-t border-white/5 font-black uppercase tracking-widest">
                           <span className="flex items-center gap-2"><Layout size={12} /> {shot.cameraMovement}</span>
                           <span className="flex items-center gap-2"><Sparkles size={12} /> {shot.lighting}</span>
                        </div>
                    </div>
                 </React.Fragment>
               ))}
               
               <button 
                  onClick={handleExtendPlot} 
                  disabled={isExtending}
                  className="w-full py-6 rounded-[32px] border-2 border-dashed border-zinc-800 text-zinc-500 hover:text-amber-500 hover:border-amber-500 hover:bg-amber-500/5 transition-all flex items-center justify-center gap-3 group/add"
               >
                  {isExtending ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  <span className="font-black uppercase tracking-widest text-xs group-hover/add:tracking-[0.2em] transition-all">
                     {isExtending ? "AI 正在构思新剧情..." : "✨ 续写剧情 (追加场景)"}
                  </span>
               </button>
             </div>
           ) : (
             <div className="h-full border-2 border-dashed border-zinc-800 rounded-[48px] flex flex-col items-center justify-center text-zinc-700 opacity-20 italic">
                <Layers size={80} className="mb-6" />
                <p className="text-2xl font-black uppercase tracking-[0.3em]">等待顶级思维策划分镜</p>
             </div>
           )}
        </div>

        {shots.length > 0 && (
           <button onClick={() => onComplete(shots, requirement, proposal)} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-8 rounded-[36px] font-black text-2xl text-white shadow-2xl transition-all flex items-center justify-center gap-5 group">
              锁定分镜，进入换装实验室
              <ArrowRight size={32} className="group-hover:translate-x-3 transition-transform" />
           </button>
        )}
      </div>
    </div>
  );
};

export default Step3PlotScript;
