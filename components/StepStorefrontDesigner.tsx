import React, { useState } from 'react';
import { StorefrontCanvasConfig } from '../types';
import { Plus, Trash2, Upload, X, Loader2, Sparkles, Download, Maximize2, Settings2, Store, ShoppingBag, ArrowLeft, ArrowRight, Zap, Image as ImageIcon, ShieldCheck, CheckCircle2, Layout, ToggleLeft, ToggleRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { fileToPart, urlToBase64Part } from '../services/geminiService';

interface Props {
  onBack: () => void;
}

const StepStorefrontDesigner: React.FC<Props> = ({ onBack }) => {
  // Logo Logic
  const [logoConfig, setLogoConfig] = useState<{ reference: File | null, preview: string | null, generated: string[], isGenerating: boolean, selectedIdx: number | null }>({
    reference: null, preview: null, generated: [], isGenerating: false, selectedIdx: null
  });
  
  // Canvases Logic
  const [canvases, setCanvases] = useState<StorefrontCanvasConfig[]>([
    { id: 'sf-1', width: 1600, height: 1600, referenceFile: null, referencePreview: null, generatedImages: [], isGenerating: false }
  ]);
  
  const [productCategory, setProductCategory] = useState("");
  const [brandName, setBrandName] = useState("");
  const [notes, setNotes] = useState("");
  const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("2K");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [useLogoAnchor, setUseLogoAnchor] = useState(true);

  const addCanvas = () => {
    setCanvases(prev => [...prev, {
      id: `sf-${Date.now()}`, width: 1000, height: 1000, referenceFile: null, referencePreview: null, generatedImages: [], isGenerating: false
    }]);
  };

  const removeCanvas = (id: string) => {
    if (canvases.length === 1) return;
    setCanvases(prev => prev.filter(c => c.id !== id));
  };

  const updateCanvas = (id: string, updates: Partial<StorefrontCanvasConfig>) => {
    setCanvases(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const handleLogoRefChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoConfig(prev => ({ ...prev, reference: file, preview: URL.createObjectURL(file) }));
    }
  };

  const generateLogo = async () => {
    setLogoConfig(prev => ({ ...prev, isGenerating: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      
      const results: string[] = [];
      const promises = Array(3).fill(0).map(() => {
        const parts: any[] = [{ text: `TASK: Brand Logo Design. BRAND: ${brandName || 'Generic'}. CATEGORY: ${productCategory}. NOTES: ${notes}. AESTHETIC: High-end, commercial, minimalist vector style. White background. 400x400.` }];
        if (logoConfig.reference) {
            return fileToPart(logoConfig.reference).then(part => 
                ai.models.generateContent({
                    model: 'gemini-3-pro-image-preview',
                    contents: [{ parts: [...parts, part] }],
                    config: { imageConfig: { imageSize: "1K", aspectRatio: "1:1" } }
                })
            );
        }
        return ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{ parts }],
            config: { imageConfig: { imageSize: "1K", aspectRatio: "1:1" } }
        });
      });

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) {
            results.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      });

      setLogoConfig(prev => ({ ...prev, generated: results, isGenerating: false, selectedIdx: results.length > 0 ? 0 : null }));
    } catch (e) {
      console.error(e);
      setLogoConfig(prev => ({ ...prev, isGenerating: false }));
      alert("Logo 生成遇到障碍。");
    }
  };

  const generateForCanvas = async (id: string) => {
    const canvas = canvases.find(c => c.id === id);
    if (!canvas || canvas.isGenerating) return;

    updateCanvas(id, { isGenerating: true });
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const logoUrl = (useLogoAnchor && logoConfig.selectedIdx !== null && logoConfig.generated[logoConfig.selectedIdx]) 
        ? logoConfig.generated[logoConfig.selectedIdx] 
        : null;
      
      const results: string[] = [];
      const promises = Array(3).fill(0).map(async () => {
          const parts: any[] = [{
            text: `AMAZON PREMIUM STOREFRONT DESIGN: ${canvas.width}x${canvas.height}. BRAND: ${brandName}. CATEGORY: ${productCategory}. STYLE: ${notes}. 
            REQUIREMENT: Professional commercial render.${logoUrl ? ' MANDATORY: Integrate the provided BRAND LOGO into the scene.' : ''}`
          }];

          if (logoUrl) {
            try {
                const logoPart = await urlToBase64Part(logoUrl);
                parts.push({ text: "BRAND LOGO ANCHOR SOURCE:" }, logoPart);
            } catch (err) { console.warn("Logo anchor failed"); }
          }
          
          if (canvas.referenceFile) {
            const refPart = await fileToPart(canvas.referenceFile);
            parts.push({ text: "VISUAL REFERENCE:" }, refPart);
          }

          return ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: [{ parts }],
            config: { 
              imageConfig: { 
                imageSize: resolution,
                aspectRatio: canvas.width === canvas.height ? "1:1" : (canvas.width > canvas.height ? "16:9" : "9:16")
              } 
            }
          });
      });

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData) {
            results.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      });

      updateCanvas(id, { generatedImages: results, isGenerating: false });
    } catch (e) {
      console.error(e);
      updateCanvas(id, { isGenerating: false });
      alert("渲染失败。");
    }
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.png`;
    link.click();
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-7xl mx-auto pb-24 relative">
      {/* Configuration Header */}
      <div className="bg-zinc-900/60 border border-white/10 p-12 rounded-[48px] shadow-2xl backdrop-blur-3xl space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-white/5 pb-10">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-2xl border border-white/5 transition-all"><ArrowLeft size={24} /></button>
            <div>
              <h2 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
                <Store className="text-emerald-500" size={40} />
                旗舰店一键设计
              </h2>
              <p className="text-zinc-500 text-sm mt-2 font-medium">顶级设计思维驱动的高转化店铺资产生成引擎</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-white/5">
                {(["1K", "2K", "4K"] as const).map(res => (
                  <button key={res} onClick={() => setResolution(res)} className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${resolution === res ? "bg-emerald-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"}`}>{res}</button>
                ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className="text-xs text-zinc-500 font-black uppercase tracking-widest ml-1">产品分类 (选填)</label>
            <input value={productCategory} onChange={e => setProductCategory(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" placeholder="例如: 智能家居 / 美妆..." />
          </div>
          <div className="space-y-4">
            <label className="text-xs text-zinc-500 font-black uppercase tracking-widest ml-1">品牌名称 (选填)</label>
            <input value={brandName} onChange={e => setBrandName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" placeholder="输入品牌名..." />
          </div>
          <div className="space-y-4">
            <label className="text-xs text-zinc-500 font-black uppercase tracking-widest ml-1">风格备注 (选填)</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all" placeholder="北欧极简 / 赛博朋克..." />
          </div>
        </div>
      </div>

      {/* Stage 1: Logo */}
      <div className="bg-zinc-900/40 border border-white/10 p-10 rounded-[48px] shadow-2xl">
         <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><ShieldCheck size={28} /></div>
            <div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tight">Stage 1: 品牌 Logo 视觉锚定</h3>
               <p className="text-zinc-500 text-xs mt-1">先生成或上传 Logo，系统将自动在后续设计稿中应用此视觉锚点</p>
            </div>
         </div>

         <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
            <div className="xl:col-span-4 space-y-6">
               <div className="space-y-4">
                  <label className="text-[10px] text-zinc-600 font-black uppercase">参考 Logo (选填)</label>
                  {!logoConfig.preview ? (
                     <label className="w-full h-32 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-blue-500/5 transition-all group">
                        <Upload size={20} className="text-zinc-600 group-hover:text-blue-500" />
                        <span className="text-[10px] text-zinc-600 font-bold uppercase">上传参考</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoRefChange} />
                     </label>
                  ) : (
                     <div className="relative aspect-video h-32 rounded-3xl overflow-hidden border border-white/10 group">
                        <img src={logoConfig.preview} className="w-full h-full object-contain bg-white" />
                        <button onClick={() => setLogoConfig(p=>({...p, reference: null, preview: null}))} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"><X size={12} /></button>
                     </div>
                  )}
               </div>
               <button onClick={generateLogo} disabled={logoConfig.isGenerating} className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95">
                  {logoConfig.isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  开始生成 Logo (400x400)
               </button>
            </div>

            <div className="xl:col-span-8">
               <div className="grid grid-cols-3 gap-6">
                  {logoConfig.generated.length > 0 ? logoConfig.generated.map((img, i) => (
                     <button key={i} onClick={() => setLogoConfig(p=>({...p, selectedIdx: i}))} className={`relative aspect-square rounded-[32px] overflow-hidden border-2 transition-all ${logoConfig.selectedIdx === i ? 'border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.3)] scale-[1.02]' : 'border-white/5 hover:border-white/20'}`}>
                        <img src={img} className="w-full h-full object-contain bg-white" />
                        {logoConfig.selectedIdx === i && <div className="absolute top-3 right-3 bg-emerald-500 text-white p-1 rounded-full"><CheckCircle2 size={16} /></div>}
                        <div className="absolute bottom-0 w-full p-2 bg-black/40 text-[8px] font-black text-white uppercase text-center backdrop-blur-md">方案 {i+1}</div>
                     </button>
                  )) : (
                     <div className="col-span-3 h-48 border-2 border-dashed border-zinc-800 rounded-[32px] flex items-center justify-center text-zinc-700 text-[10px] font-black uppercase tracking-widest bg-black/20">
                        {logoConfig.isGenerating ? <Loader2 className="animate-spin text-zinc-600" size={32} /> : "等待 Logo 渲染..."}
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Stage 2: Storefront Synthesis */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-4 px-2">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><Layout size={28} /></div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Stage 2: 全尺寸店铺视觉合成</h3>
           </div>
           
           <div className="flex items-center gap-4 bg-zinc-900/60 p-3 rounded-2xl border border-white/5 shadow-inner">
              <span className={`text-[10px] font-black uppercase tracking-widest ${useLogoAnchor ? 'text-emerald-500' : 'text-zinc-500'}`}>自动注入品牌 Logo</span>
              <button 
                onClick={() => setUseLogoAnchor(!useLogoAnchor)}
                className={`transition-all duration-300 ${useLogoAnchor ? 'text-emerald-500' : 'text-zinc-700 hover:text-zinc-500'}`}
              >
                {useLogoAnchor ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
           </div>
        </div>

        {canvases.map((canvas, idx) => (
          <div key={canvas.id} className="bg-zinc-900/40 border border-white/10 p-10 rounded-[48px] shadow-2xl relative group/canvas">
            <button onClick={() => removeCanvas(canvas.id)} className="absolute -top-4 -right-4 w-10 h-10 bg-red-600/80 text-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover/canvas:opacity-100 transition-all hover:scale-110 z-10"><Trash2 size={18} /></button>
            
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
               <div className="xl:col-span-4 space-y-8">
                  <div className="flex items-center gap-4">
                     <span className="w-10 h-10 bg-emerald-600/20 text-emerald-500 rounded-2xl flex items-center justify-center font-black">{idx + 1}</span>
                     <h3 className="text-xl font-black text-white uppercase">尺寸 {idx + 1} 配置</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-3">
                        <label className="text-[10px] text-zinc-600 font-black uppercase">宽度 (px)</label>
                        <input type="number" value={canvas.width} onChange={e => updateCanvas(canvas.id, { width: Number(e.target.value) })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-300" />
                     </div>
                     <div className="space-y-3">
                        <label className="text-[10px] text-zinc-600 font-black uppercase">高度 (px)</label>
                        <input type="number" value={canvas.height} onChange={e => updateCanvas(canvas.id, { height: Number(e.target.value) })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-300" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <label className="text-[10px] text-zinc-600 font-black uppercase">视觉参考 (选填)</label>
                     {!canvas.referencePreview ? (
                        <label className="w-full h-40 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group/upload">
                           <Upload size={24} className="text-zinc-600 group-hover/upload:text-emerald-500" />
                           <span className="text-xs text-zinc-600 font-bold uppercase">上传本尺寸参考图</span>
                           <input type="file" className="hidden" accept="image/*" onChange={e => {
                              if (e.target.files && e.target.files[0]) {
                                 updateCanvas(canvas.id, { referenceFile: e.target.files[0], referencePreview: URL.createObjectURL(e.target.files[0]) });
                              }
                           }} />
                        </label>
                     ) : (
                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-lg group/ref">
                           <img src={canvas.referencePreview} className="w-full h-full object-cover" />
                           <button onClick={() => updateCanvas(canvas.id, { referenceFile: null, referencePreview: null })} className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover/ref:opacity-100 transition-all"><X size={14} /></button>
                        </div>
                     )}
                  </div>

                  <button 
                    onClick={() => generateForCanvas(canvas.id)} 
                    disabled={canvas.isGenerating}
                    className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3"
                  >
                    {canvas.isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                    {canvas.isGenerating ? "渲染中..." : "启动视觉合成 (3款)"}
                  </button>
               </div>

               <div className="xl:col-span-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                     {canvas.generatedImages.length > 0 ? canvas.generatedImages.map((img, i) => (
                        <div key={i} className="bg-black/40 border border-white/5 rounded-3xl overflow-hidden flex flex-col group/card shadow-2xl relative">
                           <div className="flex-1 aspect-square md:aspect-auto bg-zinc-950 relative flex items-center justify-center group-hover/card:scale-105 transition-transform duration-700">
                              <img src={img} className="max-w-full max-h-full object-contain" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                 <button onClick={() => setPreviewImage(img)} className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform shadow-lg" title="放大"><Maximize2 size={18} /></button>
                                 <button onClick={() => downloadImage(img, `sf-design-${idx+1}-${i+1}`)} className="p-3 bg-emerald-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg" title="下载"><Download size={18} /></button>
                              </div>
                           </div>
                           <div className="p-4 bg-zinc-900/80 border-t border-white/5 flex justify-between items-center relative z-10">
                              <span className="text-[10px] font-black text-zinc-500 uppercase">方案 {i + 1}</span>
                              <div className="flex items-center gap-2">
                                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                 <span className="text-[8px] text-zinc-600 font-bold uppercase">Pro Render</span>
                              </div>
                           </div>
                        </div>
                     )) : (
                        <div className="col-span-3 h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-[40px] gap-4 py-20 bg-black/20">
                           {canvas.isGenerating ? (
                               <Loader2 className="animate-spin text-zinc-600" size={32} />
                           ) : (
                               <ImageIcon size={48} className="text-zinc-800" />
                           )}
                           <p className="text-sm font-black text-zinc-700 uppercase tracking-[0.2em]">
                               {canvas.isGenerating ? "正在合成视觉稿..." : "等待全案视觉渲染..."}
                           </p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        ))}

        <button 
          onClick={addCanvas}
          className="w-full py-10 bg-zinc-900/20 border-2 border-dashed border-zinc-800 rounded-[48px] flex flex-col items-center justify-center gap-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all group"
        >
          <div className="p-6 bg-zinc-800 rounded-full text-zinc-600 group-hover:text-emerald-500 group-hover:scale-110 transition-all">
            <Plus size={32} />
          </div>
          <span className="text-sm font-black text-zinc-600 uppercase tracking-widest group-hover:text-emerald-500">添加新的画布尺寸</span>
        </button>
      </div>

      {/* GLOBAL PREVIEW OVERLAY - FIXED POSITION AT BODY LEVEL */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/98 backdrop-blur-2xl animate-in fade-in duration-300 flex items-center justify-center p-4 md:p-12"
          style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
          onClick={() => setPreviewImage(null)}
        >
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-10">
                <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
                   <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-[0_40px_120px_rgba(0,0,0,1)] border border-white/10" 
                    onClick={e => e.stopPropagation()} 
                   />
                   <button 
                     onClick={() => setPreviewImage(null)}
                     className="absolute -top-12 -right-2 md:top-0 md:right-0 p-4 text-white/40 hover:text-white transition-all bg-black/40 md:bg-transparent rounded-full"
                   >
                     <X size={44} />
                   </button>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); downloadImage(previewImage, `design-export-${Date.now()}`); }} 
                  className="bg-white text-black px-16 py-7 rounded-full font-black text-xl shadow-[0_20px_60px_rgba(255,255,255,0.15)] hover:bg-zinc-200 hover:scale-105 transition-all flex items-center gap-4 active:scale-95 shrink-0"
                >
                   <Download size={28} /> 下载 {resolution} 旗舰底稿
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default StepStorefrontDesigner;