
import React, { useState, useEffect } from 'react';
import { PlotCharacter, CharacterCostume, ImageModel } from '../types';
import { Shirt, Sparkles, Loader2, ArrowLeft, ArrowRight, CheckCircle2, Wand2, Paintbrush, ShieldCheck, RefreshCw, Eye, Maximize2, X, Sword, Building2, Zap, Crown, Fan, Skull } from 'lucide-react';
import { suggestCharacterCostumes, generateOutfittedCharacter } from '../services/geminiService';

interface Props {
  characters: PlotCharacter[];
  plotProposal: any;
  model: ImageModel;
  onComplete: (updated: PlotCharacter[]) => void;
  onBack: () => void;
}

const COSTUME_STYLES = [
  { id: 'XIANXIA', label: '东方修仙 (Xianxia)', icon: Sword, desc: '飘逸长袍，仙气古风' },
  { id: 'MODERN', label: '现代都市 (Modern)', icon: Building2, desc: '时尚休闲，职场通勤' },
  { id: 'CYBERPUNK', label: '赛博朋克 (Cyberpunk)', icon: Zap, desc: '霓虹机能，未来科技' },
  { id: 'WUXIA', label: '古风武侠 (Wuxia)', icon: Fan, desc: '江湖劲装，干练侠气' },
  { id: 'MEDIEVAL', label: '中世纪奇幻 (Fantasy)', icon: Crown, desc: '骑士盔甲，法师长袍' },
  { id: 'WASTELAND', label: '末日废土 (Wasteland)', icon: Skull, desc: '战损拼凑，生存风格' },
];

const Step3_5PlotOutfitting: React.FC<Props> = ({ characters, plotProposal, model, onComplete, onBack }) => {
  const [chars, setChars] = useState<PlotCharacter[]>(characters);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [outfittingCharId, setOutfittingCharId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('');

  useEffect(() => {
    // Initial load: Only generate if missing
    const init = async () => {
      // If characters already have costumes, don't auto-regenerate unless user explicitly clicks refresh
      if (chars.every(c => c.suggestedCostumes && c.suggestedCostumes.length > 0)) return;
      
      await handleRegenerateSuggestions();
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRegenerateSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const updated = await Promise.all(chars.map(async (c) => {
        // Pass the selected style hint (if any) to the service
        const suggestions = await suggestCharacterCostumes(c, plotProposal, selectedStyle);
        // Reset selected costume to the first new suggestion
        return { ...c, suggestedCostumes: suggestions, selectedCostume: suggestions[0] };
      }));
      setChars(updated);
    } catch (e) {
      console.error("Outfitting failed:", e);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const selectCostume = (charId: string, costume: CharacterCostume) => {
    setChars(prev => prev.map(c => c.id === charId ? { ...c, selectedCostume: costume } : c));
  };

  const handleGenerateOutfittedLook = async (charId: string) => {
    setOutfittingCharId(charId);
    try {
      const char = chars.find(c => c.id === charId);
      if (char) {
        const url = await generateOutfittedCharacter(char, model);
        setChars(prev => prev.map(c => c.id === charId ? { ...c, outfittedUrl: url } : c));
      }
    } catch (e) {
      alert("换装预览渲染失败，请重试。");
    } finally {
      setOutfittingCharId(null);
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-7xl mx-auto pb-20">
      <div className="text-center space-y-4 mb-10">
        <h2 className="text-5xl font-black text-white tracking-tighter uppercase flex items-center justify-center gap-5">
           <Shirt className="text-blue-500" size={48} />
           角色换装实验室
        </h2>
        <p className="text-zinc-500 text-lg font-medium">AI 导演已根据剧本《{plotProposal.filmTitle}》为您的角色构思了最完美的服装视觉方案</p>
      </div>

      {/* Style Selector Bar */}
      <div className="bg-zinc-900/60 border border-white/10 p-6 rounded-[32px] backdrop-blur-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
         <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Paintbrush size={24} /></div>
            <div>
               <h3 className="text-white font-black uppercase tracking-widest">服化道风格预设</h3>
               <p className="text-[10px] text-zinc-500 font-bold">Costume Style Presets</p>
            </div>
         </div>
         
         <div className="flex flex-1 items-center gap-2 overflow-x-auto pb-2 md:pb-0 px-2 scrollbar-thin">
            {COSTUME_STYLES.map(style => {
               const Icon = style.icon;
               const isActive = selectedStyle === style.id;
               return (
                 <button
                   key={style.id}
                   onClick={() => setSelectedStyle(style.id)}
                   className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all whitespace-nowrap ${isActive ? 'bg-amber-600 border-amber-500 text-white shadow-lg' : 'bg-black/40 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'}`}
                 >
                    <Icon size={14} />
                    <span className="text-xs font-black uppercase">{style.label}</span>
                 </button>
               );
            })}
         </div>

         <button 
           onClick={handleRegenerateSuggestions}
           disabled={loadingSuggestions}
           className="flex-shrink-0 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-xs border border-white/10 transition-all flex items-center gap-2 shadow-lg"
         >
           <RefreshCw size={14} className={loadingSuggestions ? "animate-spin" : ""} />
           {selectedStyle ? "按此风格重新设计" : "重新生成建议"}
         </button>
      </div>

      {loadingSuggestions ? (
        <div className="h-96 flex flex-col items-center justify-center gap-8 border border-dashed border-zinc-800 rounded-[56px] bg-zinc-900/20">
           <div className="relative">
              <Wand2 className="animate-spin text-blue-500" size={64} />
              <Sparkles className="absolute -top-4 -right-4 text-amber-500 animate-pulse" size={32} />
           </div>
           <p className="text-xl font-black text-white uppercase tracking-widest animate-pulse">正在匹配{selectedStyle ? COSTUME_STYLES.find(s=>s.id===selectedStyle)?.label : '剧本'}服化道参数...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
           {chars.map((char) => (
             <div key={char.id} className="bg-zinc-900/40 border border-white/10 rounded-[48px] p-10 flex flex-col gap-8 shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex flex-col md:flex-row gap-8 relative z-10">
                   {/* Character Visual Reference */}
                   <div className="w-full md:w-64 space-y-4">
                      <div 
                        className="aspect-[4/5] rounded-3xl overflow-hidden border-2 border-amber-500/30 shadow-2xl relative group/img cursor-pointer"
                        onClick={() => setPreviewImage(char.outfittedUrl || char.turnaroundUrl || null)}
                      >
                        <img 
                          src={char.outfittedUrl || char.turnaroundUrl} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105" 
                          alt="char" 
                        />
                        {char.outfittedUrl && (
                          <div className="absolute top-3 right-3 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest z-10">
                            New Outfit Active
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                           <Maximize2 className="text-white drop-shadow-lg" size={32} />
                        </div>
                      </div>
                      <button 
                        onClick={() => handleGenerateOutfittedLook(char.id)}
                        disabled={outfittingCharId === char.id}
                        className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-2xl font-black text-xs border border-white/5 transition-all flex items-center justify-center gap-2"
                      >
                        {outfittingCharId === char.id ? <Loader2 className="animate-spin" size={14} /> : <Eye size={14} />}
                        {char.outfittedUrl ? "重新渲染预览图" : "生成换装预览图"}
                      </button>
                   </div>

                   {/* Costume Selections */}
                   <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-amber-500"><Paintbrush size={24} /></div>
                        <div>
                          <h3 className="text-2xl font-black text-white">{char.name}</h3>
                          <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mt-1">Select Custom Attire</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[300px] pr-2 scrollbar-thin">
                        {char.suggestedCostumes?.map((costume) => (
                          <button 
                            key={costume.id}
                            onClick={() => selectCostume(char.id, costume)}
                            className={`text-left p-6 rounded-[32px] border transition-all duration-300 relative group/btn ${char.selectedCostume?.id === costume.id ? 'bg-blue-600/10 border-blue-500 shadow-xl' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                               <div className={`text-sm font-black uppercase tracking-tight ${char.selectedCostume?.id === costume.id ? 'text-white' : 'text-zinc-300'}`}>{costume.name}</div>
                               {char.selectedCostume?.id === costume.id && <CheckCircle2 className="text-blue-500" size={20} />}
                            </div>
                            <p className={`text-xs leading-relaxed line-clamp-2 ${char.selectedCostume?.id === costume.id ? 'text-zinc-300' : 'text-zinc-500'}`}>{costume.description}</p>
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
             </div>
           ))}
        </div>
      )}

      <div className="flex justify-between items-center bg-black/40 p-10 rounded-[48px] border border-white/10 backdrop-blur-3xl shadow-2xl">
        <button onClick={onBack} className="px-10 py-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-3xl font-black text-base border border-white/5 transition-all">返回导演策划</button>
        <div className="flex flex-col items-end gap-2">
           <button 
             onClick={() => onComplete(chars)} 
             disabled={loadingSuggestions || !!outfittingCharId}
             className="px-14 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[28px] font-black text-base shadow-2xl shadow-blue-900/40 transition-all flex items-center gap-4 group disabled:opacity-30"
           >
             锁定着装并进入分镜渲染
             <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
           </button>
           <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">建议先生成预览图确认视觉效果</p>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"><X size={32} /></button>
            <div className="relative max-w-[95vw] max-h-[95vh] p-4 flex items-center justify-center">
                <img src={previewImage} alt="Preview" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border border-white/10" onClick={e => e.stopPropagation()} />
            </div>
        </div>
      )}
    </div>
  );
};

export default Step3_5PlotOutfitting;
