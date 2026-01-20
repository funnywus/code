
import React, { useState } from 'react';
import { PlotCharacter, FileWithPreview, PlotStyle, ImageModel } from '../types';
import { UserCircle, Upload, X, Sparkles, Loader2, ArrowLeft, ArrowRight, Camera, Palette, Zap, Box, PenTool, Sword, Plus, MessageSquareText, Trash2, Flame, Mountain, Paintbrush } from 'lucide-react';
import { analyzeProductVisuals, generateCharacterFromDescription } from '../services/geminiService';

interface StyleOptionProps {
  style: PlotStyle;
  active: boolean;
  onSelect: (s: PlotStyle) => void;
  label: string;
  icon: any;
  desc: string;
}

const StyleOption: React.FC<StyleOptionProps> = ({ style, active, onSelect, label, icon: Icon, desc }) => (
  <button 
    onClick={() => onSelect(style)}
    className={`group relative p-4 rounded-3xl border transition-all duration-300 ${active ? 'bg-amber-600/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
  >
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300 ${active ? 'bg-amber-500 text-white scale-110' : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'}`}>
      <Icon size={20} />
    </div>
    <div className="text-left">
      <div className={`text-[11px] font-black uppercase tracking-widest ${active ? 'text-white' : 'text-zinc-400'}`}>{label}</div>
      <div className="text-[9px] text-zinc-500 font-medium mt-1 leading-tight">{desc}</div>
    </div>
    {active && <div className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
  </button>
);

interface CharacterCardProps {
  char: PlotCharacter;
  onUpdate: (char: PlotCharacter) => void;
  onDelete: () => void;
  globalStyle: PlotStyle;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ char, onUpdate, onDelete, globalStyle }) => {
  const [mode, setMode] = useState<'upload' | 'generate'>(char.turnaroundUrl ? 'generate' : (char.images.length > 0 ? 'upload' : 'generate'));
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file: File) => ({
        file,
        preview: URL.createObjectURL(file),
        type: 'image' as const
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    try {
      const result = await analyzeProductVisuals(files.map(f => f.file));
      onUpdate({ ...char, images: files.map(f => f.file), token: result, style: globalStyle });
    } catch (e) {
      alert("特征提取失败");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!description || analyzing) return;

    // API Key Check
    if (!process.env.API_KEY && (window as any).aistudio?.openSelectKey) {
      alert("请先完成 API Key 授权。");
      await (window as any).aistudio.openSelectKey();
      return;
    }

    setAnalyzing(true);
    try {
      // 核心修复：确保传入全局风格，并捕获 URL
      const url = await generateCharacterFromDescription(description, globalStyle);
      if (url) {
        onUpdate({ 
          ...char, 
          turnaroundUrl: url, 
          token: `Generated: ${description.substring(0, 50)}`, 
          style: globalStyle 
        });
      } else {
        throw new Error("Invalid output from service");
      }
    } catch (e) {
      console.error("Generate error:", e);
      alert("角色生成失败，请检查 API 额度或重试。");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-zinc-900/40 border border-white/10 p-8 rounded-[40px] space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden group flex flex-col h-full min-h-[520px]">
      <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-600/20 rounded-2xl flex items-center justify-center text-amber-500"><UserCircle size={24} /></div>
          <input 
            value={char.name} 
            onChange={e => onUpdate({ ...char, name: e.target.value })}
            className="bg-transparent text-xl font-black text-white focus:outline-none w-32 tracking-tight"
            placeholder="角色名称..."
          />
        </div>
        <button onClick={onDelete} className="p-2 text-zinc-500 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
      </div>

      <div className="flex bg-black/40 p-1 rounded-2xl border border-white/5 relative z-10">
        <button 
          onClick={() => setMode('upload')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'upload' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Upload size={14} /> 传图锚定
        </button>
        <button 
          onClick={() => setMode('generate')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'generate' ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <MessageSquareText size={14} /> 文本生成
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-4 relative z-10">
        {mode === 'upload' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-amber-500 hover:bg-amber-500/10 rounded-2xl cursor-pointer transition-all">
                <Upload size={20} className="text-zinc-500" />
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              {files.map((f, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/5">
                  <img src={f.preview} alt="p" className="w-full h-full object-cover" />
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1.5 right-1.5 bg-black/60 p-1 rounded-full"><X size={10} /></button>
                </div>
              ))}
            </div>
            <button onClick={handleAnalyze} disabled={files.length === 0 || analyzing} className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-black text-[10px] border border-white/5 transition-all flex items-center justify-center gap-2">
              {analyzing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
              提取角色视觉特征
            </button>
          </>
        ) : (
          <>
            <textarea 
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="详细描述角色外观、性格特征和核心视觉元素...（例如：60岁的老头，白胡子，眼神深邃，穿着深色羊绒大衣）"
              className="flex-1 min-h-[140px] bg-black/60 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none font-medium leading-relaxed"
            />
            <button 
              onClick={handleGenerate} 
              disabled={!description.trim() || analyzing} 
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 relative overflow-hidden group"
            >
              {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} className="group-hover:scale-125 transition-transform" />}
              {analyzing ? "AI 导演创作中..." : "直接生成角色模型"}
            </button>
          </>
        )}
      </div>

      {(char.turnaroundUrl || analyzing) && (
         <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-amber-500/30 shadow-lg relative z-10 group/img bg-black/20">
            {char.turnaroundUrl ? (
              <img src={char.turnaroundUrl} className="w-full h-full object-contain bg-white" alt="turnaround" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={32} />
              </div>
            )}
            {char.turnaroundUrl && <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest shadow-lg">Model Ready</div>}
            {analyzing && char.turnaroundUrl && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="animate-spin text-amber-500" size={32} />
              </div>
            )}
         </div>
      )}
      
      {char.token && !char.turnaroundUrl && (
        <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-[10px] text-zinc-500 font-mono alignment-relaxed relative z-10 h-24 overflow-y-auto">
          {char.token}
        </div>
      )}
    </div>
  );
};

interface Step1PlotCharacterProps {
  initialModel: ImageModel;
  onModelChange: (model: ImageModel) => void;
  onComplete: (chars: PlotCharacter[]) => void;
  onBack: () => void;
}

const Step1PlotCharacter: React.FC<Step1PlotCharacterProps> = ({ initialModel, onComplete, onBack }) => {
  const [chars, setChars] = useState<PlotCharacter[]>([
    { id: 'char-0', name: '角色 1', images: [], token: '' },
    { id: 'char-1', name: '角色 2', images: [], token: '' }
  ]);
  const [selectedStyle, setSelectedStyle] = useState<PlotStyle>(PlotStyle.ANIME);

  const addCharacter = () => {
    const nextId = chars.length;
    setChars(prev => [...prev, { id: `char-${nextId}`, name: `角色 ${nextId + 1}`, images: [], token: '' }]);
  };

  const updateCharacter = (updated: PlotCharacter) => {
    setChars(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const deleteCharacter = (id: string) => {
    if (chars.length <= 1) return;
    setChars(prev => prev.filter(c => c.id !== id));
  };

  const handleStyleChange = (style: PlotStyle) => {
    setSelectedStyle(style);
    setChars(prev => prev.map(c => ({ ...c, style })));
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[2000px] mx-auto pb-20">
      
      <div className="bg-zinc-900/60 border border-white/10 p-10 rounded-[48px] shadow-2xl backdrop-blur-3xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <Palette className="text-amber-500" size={28} />
             <h3 className="text-xl font-black text-white uppercase tracking-widest">视觉风格实验室 (Art Style Lab)</h3>
          </div>
          <div className="flex items-center gap-3 bg-purple-500/10 px-6 py-3 rounded-2xl border border-purple-500/20">
             <Sparkles size={18} className="text-purple-400" />
             <span className="text-xs text-zinc-300 font-black uppercase tracking-widest">Engine: Nano Banana Pro</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          <StyleOption 
            style={PlotStyle.ANIME} active={selectedStyle === PlotStyle.ANIME} onSelect={handleStyleChange}
            label="二次元动漫" icon={Zap} desc="日式动漫渲染。"
          />
          <StyleOption 
            style={PlotStyle.REALISTIC} active={selectedStyle === PlotStyle.REALISTIC} onSelect={handleStyleChange}
            label="写实电影" icon={Camera} desc="8K 超写实光影。"
          />
          <StyleOption 
            style={PlotStyle.CYBERPUNK} active={selectedStyle === PlotStyle.CYBERPUNK} onSelect={handleStyleChange}
            label="赛博朋克" icon={Zap} desc="霓虹未来主义。"
          />
          <StyleOption 
            style={PlotStyle.PIXAR} active={selectedStyle === PlotStyle.PIXAR} onSelect={handleStyleChange}
            label="3D 动画" icon={Box} desc="皮克斯圆润风格。"
          />
          <StyleOption 
            style={PlotStyle.CHINESE_3D_ANIME} active={selectedStyle === PlotStyle.CHINESE_3D_ANIME} onSelect={handleStyleChange}
            label="国漫 3D" icon={Flame} desc="仙逆/完美世界风。"
          />
          <StyleOption 
            style={PlotStyle.INK} active={selectedStyle === PlotStyle.INK} onSelect={handleStyleChange}
            label="写意水墨" icon={Paintbrush} desc="传统宣纸留白。"
          />
          <StyleOption 
            style={PlotStyle.REALISTIC_INK_FUSION} active={selectedStyle === PlotStyle.REALISTIC_INK_FUSION} onSelect={handleStyleChange}
            label="融合水墨" icon={Flame} desc="3D 写实水墨融合。"
          />
          <StyleOption 
            style={PlotStyle.CHINESE} active={selectedStyle === PlotStyle.CHINESE} onSelect={handleStyleChange}
            label="中国风" icon={Mountain} desc="古典韵味与现代美学。"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
        {chars.map((char) => (
          <CharacterCard 
            key={char.id} 
            char={char} 
            onUpdate={updateCharacter} 
            onDelete={() => deleteCharacter(char.id)}
            globalStyle={selectedStyle}
          />
        ))}
        
        <button 
          onClick={addCharacter}
          className="bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group min-h-[520px]"
        >
          <div className="p-6 bg-zinc-800 rounded-full text-zinc-600 group-hover:text-amber-500 group-hover:scale-110 transition-all">
            <Plus size={32} />
          </div>
          <span className="text-sm font-black text-zinc-600 uppercase tracking-widest group-hover:text-amber-500">增加新角色</span>
        </button>
      </div>

      <div className="flex justify-between items-center bg-black/40 p-10 rounded-[48px] border border-white/10 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center gap-6">
           <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500"><Sparkles size={24} /></div>
           <div>
              <div className="text-white font-black text-lg">角色库已同步 ({chars.length} 个角色)</div>
              <p className="text-zinc-500 text-xs">引擎：<span className="text-purple-500 font-bold uppercase">Nano Banana Pro</span> • 状态：<span className="text-amber-500 font-bold uppercase">{chars.every(c => c.turnaroundUrl || c.token) ? 'READY' : 'WAITING'}</span></p>
           </div>
        </div>
        <div className="flex gap-5">
           <button onClick={onBack} className="px-10 py-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-3xl font-black text-base border border-white/5 transition-all">返回</button>
           <button 
             onClick={() => onComplete(chars)} 
             disabled={chars.length === 0 || chars.some(c => !c.token && !c.turnaroundUrl)} 
             className="px-14 py-5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-[28px] font-black text-base shadow-2xl shadow-amber-900/40 transition-all flex items-center gap-4 disabled:opacity-30 group"
           >
             生成一致性多面图
             <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
           </button>
        </div>
      </div>
    </div>
  );
};

export default Step1PlotCharacter;
