
import React, { useState, useRef } from 'react';
import { AmazonImageConfig } from '../types';
import { Layout, MessageSquareText, Loader2, Sparkles, ArrowLeft, ArrowRight, ClipboardList, FileSpreadsheet, FileText, X, CheckCircle } from 'lucide-react';
import { analyzeAmazonRequirements } from '../services/geminiService';

interface Props {
  productToken: string;
  configs: AmazonImageConfig[];
  onComplete: (updatedConfigs: AmazonImageConfig[]) => void;
  onBack: () => void;
}

const Step3AmazonBrief: React.FC<Props> = ({ productToken, configs: initialConfigs, onComplete, onBack }) => {
  const [title, setTitle] = useState("");
  const [bullets, setBullets] = useState("");
  const [parameters, setParameters] = useState("");
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  
  // 图需文件状态
  const [requirementFile, setRequirementFile] = useState<File | null>(null);
  const [requirementFileContent, setRequirementFileContent] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 初始化时保留上一阶段设置好的数量结构
  const [configs, setConfigs] = useState<AmazonImageConfig[]>(initialConfigs);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRequirementFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRequirementFileContent(text.slice(0, 5000)); // 截取前5000字符防止 token 爆炸
      };
      
      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        setRequirementFileContent(`[Binary File: ${file.name} uploaded as requirement source]`);
      }
    }
  };

  const removeFile = () => {
    setRequirementFile(null);
    setRequirementFileContent("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAnalyze = async () => {
    if (!title) {
      alert("请输入 Listing 标题以进行同步分析。");
      return;
    }
    setAnalyzing(true);
    try {
      // 传入当前完整的 configs 列表
      const results = await analyzeAmazonRequirements(productToken, configs, { 
        title, 
        bullets, 
        parameters, 
        notes,
        requirementFileContent 
      });

      // 核心修复：将 AI 生成的提示词根据 ID 映射回现有的配置中，确保 metadata 不丢失
      const mergedConfigs = configs.map(original => {
        const aiResult = results.find(r => r.id === original.id);
        return aiResult ? { 
          ...original, 
          prompt: aiResult.prompt, 
          finalPrompt: aiResult.finalPrompt 
        } : original;
      });

      setConfigs(mergedConfigs);
    } catch (e) {
      console.error(e);
      alert("分析失败，请检查 API 状态。");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in fade-in duration-500 max-w-[1800px] mx-auto">
      <div className="bg-[#0f0f11] border border-white/10 p-10 rounded-3xl flex flex-col gap-8 shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-thin">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl border border-white/5"><ArrowLeft size={24} /></button>
          <h3 className="text-2xl font-black flex items-center gap-3 text-white tracking-tight">
            <MessageSquareText className="text-blue-500" size={32} />
            文案深度同步 (Content Sync)
          </h3>
        </div>
        
        <div className="space-y-8">
           <div>
              <label className="text-xs text-zinc-500 font-black uppercase tracking-widest block mb-3">亚马逊产品标题</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-base text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all" placeholder="粘贴您的 Listing 标题..." />
           </div>
           
           <div>
              <label className="text-xs text-zinc-500 font-black uppercase tracking-widest block mb-3 flex justify-between">
                <span>五点描述 (Bullet Points)</span>
                <span className="text-zinc-600 lowercase font-bold italic">粘贴前台核心卖点</span>
              </label>
              <textarea value={bullets} onChange={e => setBullets(e.target.value)} className="w-full min-h-[160px] bg-black/40 border border-white/10 rounded-2xl p-6 text-base text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none transition-all leading-relaxed" placeholder="粘贴五点描述，AI 将提取其中的功能卖点进行图片创作..." />
           </div>

           <div className="space-y-3">
              <label className="text-xs text-amber-500 font-black uppercase tracking-widest block flex items-center gap-2">
                <FileSpreadsheet size={18} />
                上传图需文件 (Optional Requirement File)
              </label>
              {!requirementFile ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-zinc-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-amber-500/50 hover:bg-amber-500/5 cursor-pointer transition-all group"
                >
                  <FileSpreadsheet className="text-zinc-600 group-hover:text-amber-500 transition-colors" size={32} />
                  <div className="text-center">
                    <p className="text-sm text-zinc-400 font-bold">点击上传图需 (Excel, CSV, TXT)</p>
                    <p className="text-[10px] text-zinc-600 mt-1">若上传，AI 将强制优先参照文件中的每张图片具体需求</p>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx,.csv,.txt" />
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex justify-between items-center animate-in zoom-in-95 duration-300">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
                        {requirementFile.name.endsWith('.xlsx') ? <FileSpreadsheet size={24} /> : <FileText size={24} />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{requirementFile.name}</p>
                        <p className="text-[10px] text-emerald-500 flex items-center gap-1 mt-1 font-bold">
                           <CheckCircle size={10} /> 文件已载入，策划时将优先参考
                        </p>
                      </div>
                   </div>
                   <button onClick={removeFile} className="p-2 hover:bg-white/10 rounded-full text-zinc-500 hover:text-white transition-all"><X size={20} /></button>
                </div>
              )}
           </div>

           <div>
              <label className="text-xs text-emerald-500 font-black uppercase tracking-widest block mb-3 flex items-center gap-2">
                <ClipboardList size={18} />
                产品核心参数 (Product Parameters)
              </label>
              <textarea 
                value={parameters} 
                onChange={e => setParameters(e.target.value)} 
                className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-6 text-base text-zinc-300 focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none transition-all leading-relaxed" 
                placeholder="例如：机身重量 11.1kg... AI 会在分镜中强调这些具体细节。" 
              />
           </div>

           <div>
              <label className="text-xs text-zinc-500 font-black uppercase tracking-widest block mb-3">其他视觉备注 (Visual Notes)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full h-24 bg-black/40 border border-white/10 rounded-2xl p-6 text-base text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none transition-all" placeholder="补充未提到的视觉偏好（如：冷色调、科技感背景）..." />
           </div>
        </div>
        
        <button onClick={handleAnalyze} disabled={analyzing || !title} className="w-full mt-6 bg-blue-600 hover:bg-blue-500 py-6 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-2xl disabled:opacity-50 active:scale-[0.98]">
          {analyzing ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} />}
          {analyzing ? "正在融合文案与图需..." : "开始策划 Listing 图片提示词"}
        </button>
      </div>

      <div className="bg-[#0f0f11] border border-white/10 p-10 rounded-3xl flex flex-col gap-8 shadow-2xl max-h-[85vh] overflow-hidden">
        <h3 className="text-2xl font-black flex items-center gap-3 text-white tracking-tight">
          <Layout className="text-emerald-500" size={32} />
          视觉蓝图 (Visual Blueprint)
        </h3>
        <div className="flex-1 overflow-y-auto space-y-6 pr-4 scrollbar-thin">
           {configs.map((c, i) => (
             <div key={c.id} className="bg-zinc-900/40 p-6 rounded-3xl border border-white/5 space-y-4 group hover:border-emerald-500/30 transition-all shadow-inner">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-3">
                      <span className={`text-xs font-black px-3 py-1 rounded-lg uppercase tracking-widest ${c.type === 'MAIN' ? 'bg-blue-600 text-white' : c.type === 'SECONDARY' ? 'bg-purple-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {c.type === 'MAIN' ? '主图' : c.type === 'SECONDARY' ? '附图' : 'A+ 图'}
                      </span>
                      <span className="text-sm text-zinc-500 font-mono font-bold">{c.size}</span>
                   </div>
                   <span className="text-xs text-zinc-600 font-black tracking-widest">IMAGE {i+1}</span>
                </div>
                {c.finalPrompt ? (
                   <div className="space-y-3">
                     <p className="text-xs text-zinc-500 italic px-1 line-clamp-2 leading-relaxed font-medium">{c.prompt}</p>
                     <textarea
                       value={c.finalPrompt}
                       onChange={(e) => setConfigs(prev => prev.map(p => p.id === c.id ? {...p, finalPrompt: e.target.value} : p))}
                       className="w-full bg-black/50 border border-white/5 rounded-2xl p-5 text-sm text-zinc-400 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed"
                       rows={5}
                     />
                   </div>
                ) : (
                  <div className="h-28 border-2 border-dashed border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-700 text-sm italic font-medium">
                     {analyzing ? "正在基于文案与图需生成策划..." : "等待策划生成..."}
                  </div>
                )}
             </div>
           ))}
        </div>
        <button 
          onClick={() => onComplete(configs)} 
          disabled={analyzing || !configs.some(c => !!c.finalPrompt)}
          className="w-full bg-emerald-600 hover:bg-emerald-500 py-6 rounded-2xl font-black text-xl text-white shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
        >
          确认并进入视觉渲染
          <ArrowRight size={28} />
        </button>
      </div>
    </div>
  );
};

export default Step3AmazonBrief;
