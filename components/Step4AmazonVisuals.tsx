
import React, { useState, useRef, useEffect } from 'react';
import { AmazonImageConfig } from '../types';
import { Loader2, Image as ImageIcon, Download, Maximize2, X, RefreshCw, PlayCircle, ShoppingBag, LayoutGrid, CheckCircle2, Settings2, Monitor, ListOrdered, Wand2, Sparkles, Upload, Paintbrush, Trash2, ShieldCheck, Eraser, Zap } from 'lucide-react';
import { generateAmazonImage, editAmazonImage } from '../services/geminiService';

interface Props {
  configs: AmazonImageConfig[];
  productImages: File[];
  onBack: () => void;
}

type Resolution = "1K" | "2K" | "4K";

const colorTheme = {
  blue: {
    bg: 'bg-blue-600',
    hover: 'hover:bg-blue-500',
    light: 'bg-blue-500/10',
    text: 'text-blue-500',
    shadow: 'shadow-blue-900/20'
  },
  purple: {
    bg: 'bg-purple-600',
    hover: 'hover:bg-purple-500',
    light: 'bg-purple-500/10',
    text: 'text-purple-500',
    shadow: 'shadow-purple-900/20'
  },
  emerald: {
    bg: 'bg-emerald-600',
    hover: 'hover:bg-emerald-500',
    light: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    shadow: 'shadow-emerald-900/20'
  }
};

const EditModal = ({ isOpen, onClose, image, onSave, resolution, size }: { 
  isOpen: boolean, 
  onClose: () => void, 
  image: AmazonImageConfig | null, 
  onSave: (newUrl: string) => void,
  resolution: Resolution,
  size: string
}) => {
  const [instruction, setInstruction] = useState("");
  const [refFile, setRefFile] = useState<File | null>(null);
  const [refPreview, setRefPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const isDrawing = useRef(false);

  const syncCanvasSize = () => {
    if (!imageRef.current || !canvasRef.current || !maskCanvasRef.current) return;
    const img = imageRef.current;
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    maskCanvas.width = img.clientWidth;
    maskCanvas.height = img.clientHeight;

    const mctx = maskCanvas.getContext('2d');
    if (mctx) {
      mctx.fillStyle = "black";
      mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setInstruction("");
      setRefFile(null);
      setRefPreview(null);
      setIsBrushMode(false);
    }
  }, [isOpen]);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isBrushMode) return;
    isDrawing.current = true;
    draw(e);
  };

  const stopDrawing = () => {
    isDrawing.current = false;
    const ctx = canvasRef.current?.getContext('2d');
    const mctx = maskCanvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
    if (mctx) mctx.beginPath();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current || !canvasRef.current || !maskCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const mctx = maskCanvas.getContext('2d');
    if (!ctx || !mctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";

    mctx.lineWidth = brushSize;
    mctx.lineCap = "round";
    mctx.strokeStyle = "white";

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    mctx.lineTo(x, y);
    mctx.stroke();
    mctx.beginPath();
    mctx.moveTo(x, y);
  };

  const clearMask = () => {
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (canvas && maskCanvas) {
      const ctx = canvas.getContext('2d');
      const mctx = maskCanvas.getContext('2d');
      if (ctx && mctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        mctx.fillStyle = "black";
        mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
      }
    }
  };

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRefFile(file);
      setRefPreview(URL.createObjectURL(file));
    }
  };

  const handleRefine = async () => {
    if (!instruction && !refFile) return;
    setIsProcessing(true);
    try {
      let maskData: string | undefined = undefined;
      if (isBrushMode && maskCanvasRef.current) {
        maskData = maskCanvasRef.current.toDataURL("image/png");
      }
      
      const newUrl = await editAmazonImage(image!.generatedImageUrl!, instruction, size, resolution, refFile, maskData);
      if (newUrl) {
        onSave(newUrl);
        onClose();
      }
    } catch (e) {
      alert("修图失败，请检查网络或 API Key。");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !image) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-[60px] animate-in fade-in duration-500 p-4 md:p-12">
       <button onClick={onClose} className="absolute top-4 right-4 md:top-10 md:right-10 p-3 md:p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10 z-50"><X size={24} /></button>
       
       <div className="bg-[#0f0f11] w-full max-w-7xl h-full max-h-[95vh] md:max-h-[90vh] rounded-[32px] md:rounded-[64px] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 bg-black/40 flex flex-col p-6 md:p-10 gap-4 md:gap-6 border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Sparkles size={20} /></div>
                  <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">AI Asset Refiner</h2>
                </div>
                
                <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-xl border border-white/5">
                   <button 
                     onClick={() => setIsBrushMode(false)}
                     className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${!isBrushMode ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                   >
                     全局
                   </button>
                   <button 
                     onClick={() => { setIsBrushMode(true); setTimeout(syncCanvasSize, 50); }}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${isBrushMode ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                   >
                     <Paintbrush size={12} /> 局部
                   </button>
                </div>
             </div>

             <div ref={containerRef} className="flex-1 relative rounded-[24px] md:rounded-[40px] overflow-hidden bg-[#050505] border border-white/5 flex items-center justify-center cursor-crosshair min-h-0">
                <img 
                  ref={imageRef}
                  src={image.generatedImageUrl} 
                  onLoad={syncCanvasSize}
                  className="max-w-full max-h-full object-contain pointer-events-none shadow-2xl" 
                  alt="Current" 
                />
                <canvas 
                  ref={canvasRef}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className={`absolute z-10 pointer-events-auto ${isBrushMode ? 'opacity-100 cursor-crosshair' : 'opacity-0 pointer-events-none'}`}
                />
                <canvas ref={maskCanvasRef} className="hidden" />
                
                {isBrushMode && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/80 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-2xl z-20 animate-in slide-in-from-bottom-2">
                     <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                        <span className="text-[9px] text-zinc-500 font-black uppercase">笔头</span>
                        <input 
                          type="range" min="10" max="150" value={brushSize} 
                          onChange={e => setBrushSize(parseInt(e.target.value))} 
                          className="w-20 md:w-32 accent-blue-600"
                        />
                     </div>
                     <button onClick={clearMask} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-[9px] font-black uppercase transition-all">
                        <Trash2 size={14} /> 清除
                     </button>
                  </div>
                )}
             </div>
          </div>

          <div className="w-full md:w-[400px] p-6 md:p-10 flex flex-col gap-6 md:gap-8 bg-zinc-950/40 overflow-y-auto">
             <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block">Refinement Instructions</label>
                  </div>
                  <textarea 
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    placeholder={isBrushMode ? "例如：修改此处的Logo颜色，或者优化表面材质..." : "例如：将整体色调变亮，去除背景中的杂物..."}
                    className="w-full h-32 md:h-40 bg-black border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-blue-500/50 outline-none resize-none transition-all leading-relaxed shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                   <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">快速指令预设</p>
                   <div className="flex flex-wrap gap-2">
                      <button onClick={() => setInstruction("Clean up background and distractions. Keep all product logos intact.")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all">
                         <Sparkles size={12} /> 净化环境
                      </button>
                      <button onClick={() => setInstruction("Enhance original product branding and logo clarity.")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all">
                         <ShieldCheck size={12} /> 强化Logo
                      </button>
                   </div>
                </div>

                <div className="hidden md:block">
                   <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-3">Style Reference (Optional)</label>
                   {!refPreview ? (
                     <label className="w-full h-24 border-2 border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/5 transition-all group">
                        <Upload className="text-zinc-600 group-hover:text-zinc-400" size={20} />
                        <span className="text-[9px] text-zinc-600 font-black uppercase">模仿风格</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleRefFileChange} />
                     </label>
                   ) : (
                     <div className="relative group aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                        <img src={refPreview} className="w-full h-full object-cover" alt="ref" />
                        <button onClick={() => {setRefFile(null); setRefPreview(null);}} className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                     </div>
                   )}
                </div>
             </div>

             <div className="mt-auto space-y-3">
                <button 
                  onClick={handleRefine}
                  disabled={isProcessing || (!instruction && !refFile)}
                  className={`w-full ${isBrushMode ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'} disabled:opacity-30 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-base md:text-lg text-white shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                  {isProcessing ? "处理中..." : "开始精修素材"}
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

const Step4AmazonVisuals: React.FC<Props> = ({ configs: initialConfigs, productImages, onBack }) => {
  const [configs, setConfigs] = useState<AmazonImageConfig[]>(initialConfigs);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [viewMode, setViewMode] = useState<'grid' | 'canvas'>('grid');
  const [editingImage, setEditingImage] = useState<AmazonImageConfig | null>(null);

  const referenceImage = productImages.length > 0 ? productImages[0] : null;

  // 辅助函数：根据尺寸字符串解析比例
  const parseAspectRatio = (sizeStr: string): "1:1" | "16:9" | "9:16" | "4:3" | "3:4" => {
    const parts = sizeStr.toLowerCase().split('x');
    if (parts.length === 2) {
      const w = parseInt(parts[0]);
      const h = parseInt(parts[1]);
      if (isNaN(w) || isNaN(h)) return "1:1";
      const ratio = w / h;
      
      // 模糊匹配最接近的 API 比例
      if (Math.abs(ratio - 1) < 0.1) return "1:1";
      if (Math.abs(ratio - (16/9)) < 0.3) return "16:9";
      if (Math.abs(ratio - (9/16)) < 0.3) return "9:16";
      if (Math.abs(ratio - (4/3)) < 0.2) return "4:3";
      if (Math.abs(ratio - (3/4)) < 0.2) return "3:4";
      
      // 默认逻辑
      return ratio > 1.2 ? "16:9" : (ratio < 0.8 ? "9:16" : "1:1");
    }
    return "1:1";
  };

  const generateSingleImage = async (index: number) => {
    const config = configs[index];
    if (config.isGenerating || !referenceImage) return;

    setConfigs(prev => {
      const next = [...prev];
      next[index] = { ...next[index], isGenerating: true };
      return next;
    });

    try {
      // 动态解析比例
      const detectedRatio = parseAspectRatio(config.size);
      
      const url = await generateAmazonImage(config.finalPrompt, referenceImage, config.size, resolution, detectedRatio);
      setConfigs(prev => {
        const next = [...prev];
        next[index] = { ...next[index], isGenerating: false, generatedImageUrl: url };
        return next;
      });
      return true;
    } catch (e) {
      setConfigs(prev => {
        const next = [...prev];
        next[index] = { ...next[index], isGenerating: false };
        return next;
      });
      return false;
    }
  };

  const generateAllByType = async (type: 'MAIN' | 'SECONDARY' | 'APLUS') => {
    if (isBatchGenerating) return;
    
    const targets = configs
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.type === type && !c.generatedImageUrl && !c.isGenerating);
    
    if (targets.length === 0) return;

    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: targets.length });
    
    const CHUNK_SIZE = 4;
    for (let i = 0; i < targets.length; i += CHUNK_SIZE) {
      const chunk = targets.slice(i, i + CHUNK_SIZE);
      await Promise.allSettled(chunk.map(({ i: idx }) => generateSingleImage(idx)));
      setBatchProgress(prev => ({ ...prev, current: Math.min(prev.total, i + CHUNK_SIZE) }));
      
      if (i + CHUNK_SIZE < targets.length) {
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
    
    setIsBatchGenerating(false);
    setBatchProgress({ current: 0, total: 0 });
  };

  const handleEditSave = (newUrl: string) => {
    if (!editingImage) return;
    setConfigs(prev => prev.map(c => c.id === editingImage.id ? { ...c, generatedImageUrl: newUrl } : c));
  };

  const renderSection = (title: string, type: 'MAIN' | 'SECONDARY' | 'APLUS', color: 'blue' | 'purple' | 'emerald') => {
    const items = configs.filter(c => c.type === type);
    const count = items.length;
    const done = items.filter(c => !!c.generatedImageUrl).length;
    const theme = colorTheme[color];
    const isThisTypeGenerating = isBatchGenerating && items.some(i => i.isGenerating);

    return (
      <div className="bg-[#0f0f11] border border-white/10 p-6 md:p-8 rounded-[32px] md:rounded-[40px] shadow-2xl backdrop-blur-3xl transition-all hover:border-white/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
           <div className="flex items-center gap-4">
              <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl ${theme.light} ${theme.text} shadow-inner`}>
                 <ShoppingBag size={24} />
              </div>
              <div>
                 <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{title} ({done}/{count})</h2>
                 <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-[0.2em] font-black opacity-60">Listing Asset Creator</p>
              </div>
           </div>
           
           <div className="flex items-center gap-3">
             {isThisTypeGenerating && (
               <div className="flex flex-col items-end gap-1 mr-4 animate-in fade-in slide-in-from-right-2">
                 <span className="text-[10px] text-emerald-500 font-black uppercase">批量合成中...</span>
                 <div className="w-32 h-1 bg-zinc-800 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-emerald-500 transition-all duration-500" 
                     style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                   />
                 </div>
               </div>
             )}
             <button 
               onClick={() => generateAllByType(type)}
               disabled={isBatchGenerating || done === count || !referenceImage}
               className={`${theme.bg} ${theme.hover} disabled:opacity-30 text-white px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-xs md:text-sm transition-all flex items-center gap-2 md:gap-3 shadow-2xl ${theme.shadow} active:scale-[0.98] group`}
             >
               {isThisTypeGenerating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} className="group-hover:scale-110 transition-transform" />}
               一键批量出图 ({resolution})
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
           {items.map((item) => {
              const actualIdx = configs.findIndex(c => c.id === item.id);
              const aspectClass = item.type === 'APLUS' ? 'aspect-[2.44/1]' : 'aspect-square';
              
              return (
                <div key={item.id} className={`bg-black/40 border ${item.isGenerating ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-white/5'} rounded-[24px] md:rounded-[32px] overflow-hidden flex flex-col group hover:border-white/20 transition-all shadow-xl relative`}>
                   <div className={`${aspectClass} bg-[#050505] relative flex items-center justify-center border-b border-white/5 overflow-hidden`}>
                      {item.generatedImageUrl ? (
                        <>
                          <img src={item.generatedImageUrl} alt="listing" className="w-full h-full object-contain bg-white transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                             <button onClick={() => setPreviewImage(item.generatedImageUrl!)} className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform shadow-2xl" title="放大预览"><Maximize2 size={20} /></button>
                             <button onClick={() => setEditingImage(item)} className="p-3 bg-blue-600 rounded-full text-white hover:scale-110 transition-transform shadow-2xl border border-white/10" title="AI 二次修图"><Wand2 size={20} /></button>
                             <button onClick={() => generateSingleImage(actualIdx)} className="p-3 bg-zinc-800 text-white rounded-full hover:scale-110 transition-transform shadow-2xl border border-white/10" title="重新生成"><RefreshCw size={20} className={item.isGenerating ? "animate-spin" : ""} /></button>
                          </div>
                          <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-emerald-500/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-lg border border-emerald-400/30">
                             <ShieldCheck size={14} className="text-white" />
                             <span className="text-[10px] font-black text-white uppercase tracking-widest">保留品牌标志</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6 w-full h-full flex flex-col items-center justify-center gap-4">
                           {item.isGenerating ? (
                             <div className="flex flex-col items-center gap-3">
                               <Loader2 className="animate-spin text-emerald-500" size={32} />
                               <span className="text-[9px] text-zinc-400 font-black uppercase tracking-widest animate-pulse">正在极速合成...</span>
                             </div>
                           ) : (
                             <button onClick={() => generateSingleImage(actualIdx)} className="flex flex-col items-center gap-3 text-zinc-700 hover:text-white transition-all group/btn">
                               <ImageIcon size={40} className="opacity-30 group-hover/btn:opacity-100 transition-all" />
                               <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40 group-hover/btn:opacity-100">点此手动渲染</span>
                             </button>
                           )}
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg text-[8px] font-black text-zinc-400 border border-white/10 shadow-lg">{item.size}</div>
                   </div>
                   <div className="p-4 bg-zinc-950/40 flex items-center justify-between">
                      <p className="text-[9px] text-zinc-500 line-clamp-1 italic font-medium pr-2">"{item.prompt}"</p>
                      {item.generatedImageUrl && <div className="p-1 bg-emerald-500/10 text-emerald-500 rounded-md"><CheckCircle2 size={10} /></div>}
                   </div>
                   {item.isGenerating && (
                     <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />
                   )}
                </div>
              );
           })}
        </div>
      </div>
    );
  };

  const handleDownloadAll = () => {
    const allGenerated = configs.filter(c => !!c.generatedImageUrl);
    allGenerated.forEach((c, i) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = c.generatedImageUrl!;
        link.download = `listing-asset-${c.type}-${i+1}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, i * 300);
    });
  };

  const galleryFlowItems = configs.filter(c => (c.type === 'MAIN' || c.type === 'SECONDARY') && c.generatedImageUrl);
  const aplusFlowItems = configs.filter(c => c.type === 'APLUS' && c.generatedImageUrl);

  return (
    <div className="space-y-8 md:space-y-12 pb-24 animate-in fade-in duration-700">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 md:gap-8 bg-black/40 p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-white/10 shadow-2xl backdrop-blur-3xl">
         <div className="flex items-center gap-6">
           <button onClick={onBack} className="p-3 md:p-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl md:rounded-2xl border border-white/5 transition-all shadow-lg"><X size={24} /></button>
           <div>
             <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">Visual Asset Hub</h1>
             <p className="text-[10px] text-zinc-500 mt-2 uppercase tracking-[0.3em] font-black opacity-60 flex items-center gap-2">
                <ShieldCheck size={12} className="text-emerald-500" />
                Smart Filtering: Preserve Branding, Remove Typography
             </p>
           </div>
         </div>
         
         <div className="flex flex-wrap items-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-[20px] md:rounded-[28px] border border-white/5 shadow-inner">
               <button onClick={() => setViewMode('grid')} className={`flex items-center gap-2 px-4 md:px-8 py-2 md:py-3.5 rounded-lg md:rounded-2xl text-[10px] md:text-sm font-black transition-all ${viewMode === 'grid' ? 'bg-white text-black shadow-2xl scale-105' : 'text-zinc-500 hover:text-white'}`}>
                  <LayoutGrid size={14} /> 批量编辑
               </button>
               <button onClick={() => setViewMode('canvas')} className={`flex items-center gap-2 px-4 md:px-8 py-2 md:py-3.5 rounded-lg md:rounded-2xl text-[10px] md:text-sm font-black transition-all ${viewMode === 'canvas' ? 'bg-white text-black shadow-2xl scale-105' : 'text-zinc-500 hover:text-white'}`}>
                  <Monitor size={14} /> 全景预览
               </button>
            </div>

            <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-[20px] md:rounded-[28px] border border-white/5 shadow-inner">
               {(["1K", "2K", "4K"] as Resolution[]).map((res) => (
                  <button key={res} onClick={() => setResolution(res)} className={`px-4 md:px-6 py-2 md:py-3.5 rounded-lg md:rounded-2xl text-[9px] md:text-xs font-black transition-all ${resolution === res ? "bg-white text-black shadow-2xl" : "text-zinc-500"}`}>
                      {res}
                  </button>
               ))}
            </div>

            <button onClick={handleDownloadAll} disabled={!configs.some(c => !!c.generatedImageUrl)} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 text-white px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-[28px] font-black text-sm md:text-base flex items-center gap-3 shadow-2xl shadow-emerald-900/40 transition-all active:scale-[0.98]">
               <Download size={20} /> 导出底稿素材
            </button>
         </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="space-y-12 md:space-y-16">
          <div className="bg-emerald-500/5 border border-emerald-500/10 p-6 rounded-3xl flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
             <div className="p-3 bg-emerald-500/20 text-emerald-500 rounded-xl relative z-10"><Zap size={24} /></div>
             <div className="relative z-10">
                <h4 className="text-white font-bold text-sm">智能 Logo 识别模式已激活</h4>
                <p className="text-xs text-zinc-500">模型将自动识别并保留产品自带的品牌 Logo。同时去除背景干扰和后期文案，方便您进行二次排版。</p>
             </div>
          </div>
          {renderSection("主图素材 (Main Images)", "MAIN", "blue")}
          {renderSection("附图素材 (Secondary Images)", "SECONDARY", "purple")}
          {renderSection("A+ 品牌详情素材 (A+ Assets)", "APLUS", "emerald")}
        </div>
      ) : (
        <div className="bg-[#050505] p-6 md:p-16 rounded-[32px] md:rounded-[64px] border border-white/5 min-h-[60vh] md:min-h-[80vh] flex flex-col items-center shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] overflow-y-auto">
           <div className="max-w-7xl w-full space-y-16 md:space-y-24">
              <div className="text-center">
                 <h3 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">Visual consistency</h3>
                 <p className="text-zinc-500 text-sm md:text-lg font-medium opacity-70">预览品牌标识在不同场景与模块下的一致性表现。</p>
              </div>
              
              <div className="space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] block">Gallery Asset Flow (主副图流动)</span>
                 </div>
                 <div className="flex gap-4 md:gap-8 overflow-x-auto pb-8 scrollbar-thin">
                    {galleryFlowItems.length > 0 ? galleryFlowItems.map((c, i) => (
                      <img key={i} src={c.generatedImageUrl} className="w-64 md:w-80 aspect-square object-contain bg-white rounded-3xl shadow-2xl border border-white/5 transition-all hover:scale-[1.02]" />
                    )) : (
                      <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-3xl text-zinc-700 text-xs font-black uppercase tracking-widest">暂无已生成的预览图</div>
                    )}
                 </div>
              </div>

              <div className="space-y-10">
                 <div className="flex items-center gap-4">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] block">A+ Content Layout (品牌详情排版预览)</span>
                 </div>
                 <div className="flex flex-col gap-6 md:gap-10">
                    {aplusFlowItems.length > 0 ? aplusFlowItems.map((c, i) => (
                      <div key={i} className="w-full aspect-[2.44/1] rounded-[32px] md:rounded-[48px] overflow-hidden border border-white/10 shadow-2xl relative group/aplus">
                         <img src={c.generatedImageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover/aplus:scale-[1.03]" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/aplus:opacity-100 transition-opacity p-8 flex items-end">
                            <span className="text-white font-black text-xs uppercase tracking-widest">A+ Module {i+1} • {c.size}</span>
                         </div>
                      </div>
                    )) : (
                      <div className="w-full h-48 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-[48px] text-zinc-700 text-xs font-black uppercase tracking-widest">暂无已生成的 A+ 素材</div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/98 backdrop-blur-[40px] animate-in fade-in duration-500 p-4" onClick={() => setPreviewImage(null)}>
            <button className="absolute top-4 right-4 md:top-10 md:right-10 p-3 md:p-4 bg-white/10 text-white hover:bg-white/20 rounded-full transition-all backdrop-blur-xl border border-white/10 shadow-2xl z-50"><X size={24} /></button>
            <div className="relative max-w-full max-h-full flex flex-col items-center">
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.9)] overflow-hidden max-h-[80vh] flex items-center justify-center border border-white/10">
                   <img src={previewImage} alt="Listing Preview" className="max-w-full max-h-full object-contain p-2 md:p-4" onClick={e => e.stopPropagation()} />
                </div>
                <button onClick={(e) => {
                   e.stopPropagation();
                   const link = document.createElement('a');
                   link.href = previewImage;
                   link.download = `listing-asset-${Date.now()}.png`;
                   link.click();
                }} className="mt-6 md:mt-10 bg-white text-black px-10 md:px-16 py-4 md:py-6 rounded-full font-black text-sm md:text-lg hover:bg-zinc-200 transition-all flex items-center gap-3 md:gap-4 shadow-2xl">
                   <Download size={20} /> 下载原图 ({resolution})
                </button>
            </div>
        </div>
      )}

      <EditModal 
        isOpen={!!editingImage}
        onClose={() => setEditingImage(null)}
        image={editingImage}
        onSave={handleEditSave}
        resolution={resolution}
        size={editingImage?.size || "1K"}
      />
    </div>
  );
};

export default Step4AmazonVisuals;
