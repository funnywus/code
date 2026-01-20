
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { RemappedShot, ImageModel, PlotCharacter } from '../types';
import { Loader2, Image as ImageIcon, Download, Maximize2, X, Settings2, RefreshCw, PlayCircle, GitCompareArrows, MoveRight, Activity, ChevronRight, LayoutList, Link as LinkIcon, Plus, Layers, Wand2, Paintbrush, Trash2, Sparkles, Zap, AlertCircle, PlusCircle, Eraser, ShieldCheck, Upload } from 'lucide-react';
import { generateStoryboardFrame, editStoryboardFrame } from '../services/geminiService';
import JSZip from 'jszip';

interface Props {
  shots: RemappedShot[];
  productImages: File[];
  model: ImageModel;
  onBack: () => void;
  onNext: (shots: RemappedShot[]) => void;
  plotCharacters?: PlotCharacter[]; 
}

type Resolution = "1K" | "2K" | "4K";

// Secondary Edit Modal for Storyboard Frames
const EditModal = ({ isOpen, onClose, shot, onSave, resolution }: { 
  isOpen: boolean, 
  onClose: () => void, 
  shot: RemappedShot | null, 
  onSave: (newUrl: string) => void,
  resolution: Resolution
}) => {
  const [instruction, setInstruction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBrushMode, setIsBrushMode] = useState(false);
  const [brushSize, setBrushSize] = useState(40);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
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
    ctx.strokeStyle = "rgba(255, 165, 0, 0.4)"; // Amber for storyboards

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

  const handleRefine = async () => {
    if (!instruction || !shot?.generatedImageUrl) return;
    setIsProcessing(true);
    try {
      let maskData: string | undefined = undefined;
      if (isBrushMode && maskCanvasRef.current) {
        maskData = maskCanvasRef.current.toDataURL("image/png");
      }
      
      const newUrl = await editStoryboardFrame(shot.generatedImageUrl, instruction, resolution, maskData);
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

  if (!isOpen || !shot) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 backdrop-blur-[60px] animate-in fade-in duration-500 p-4 md:p-12">
       <button onClick={onClose} className="absolute top-4 right-4 md:top-10 md:right-10 p-3 md:p-4 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10 z-50"><X size={24} /></button>
       
       <div className="bg-[#0f0f11] w-full max-w-7xl h-full max-h-[95vh] md:max-h-[90vh] rounded-[32px] md:rounded-[64px] border border-white/10 shadow-2xl overflow-hidden flex flex-col md:flex-row">
          <div className="flex-1 bg-black/40 flex flex-col p-6 md:p-10 gap-4 md:gap-6 border-b md:border-b-0 md:border-r border-white/10 overflow-hidden">
             <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"><Sparkles size={20} /></div>
                  <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter uppercase">导演剪辑室 (AI Refiner)</h2>
                </div>
                
                <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-xl border border-white/5">
                   <button 
                     onClick={() => setIsBrushMode(false)}
                     className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${!isBrushMode ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                   >
                     全局优化
                   </button>
                   <button 
                     onClick={() => { setIsBrushMode(true); setTimeout(syncCanvasSize, 50); }}
                     className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${isBrushMode ? 'bg-amber-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
                   >
                     <Paintbrush size={12} /> 局部修改
                   </button>
                </div>
             </div>

             <div className="flex-1 relative rounded-[24px] md:rounded-[40px] overflow-hidden bg-[#050505] border border-white/5 flex items-center justify-center cursor-crosshair min-h-0">
                <img 
                  ref={imageRef}
                  src={shot.generatedImageUrl} 
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
                        <span className="text-[9px] text-zinc-500 font-black uppercase">笔触</span>
                        <input 
                          type="range" min="10" max="150" value={brushSize} 
                          onChange={e => setBrushSize(parseInt(e.target.value))} 
                          className="w-20 md:w-32 accent-amber-600"
                        />
                     </div>
                     <button onClick={clearMask} className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-[9px] font-black uppercase transition-all">
                        <Trash2 size={14} /> 清空遮罩
                     </button>
                  </div>
                )}
             </div>
          </div>

          <div className="w-full md:w-[400px] p-6 md:p-10 flex flex-col gap-6 md:gap-8 bg-zinc-950/40 overflow-y-auto">
             <div className="space-y-6">
                <div>
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-widest block mb-3">修改指令 (Refine Prompt)</label>
                  <textarea 
                    value={instruction}
                    onChange={e => setInstruction(e.target.value)}
                    placeholder={isBrushMode ? "描述您想在涂红区域修改什么... (例如：把这里的杯子换成红色的)" : "描述您想对整张图做出的调整... (例如：增加更多的电影感，或者把背景调暗)"}
                    className="w-full h-32 md:h-48 bg-black border border-white/10 rounded-2xl p-4 text-sm text-white focus:ring-2 focus:ring-amber-500/50 outline-none resize-none transition-all leading-relaxed shadow-inner"
                  />
                </div>

                <div className="space-y-3">
                   <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">常用指令建议</p>
                   <div className="flex flex-wrap gap-2">
                      <button onClick={() => setInstruction("Add more dramatic cinematic lighting and volumetric fog.")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all">
                         <Sparkles size={12} /> 强化光影
                      </button>
                      <button onClick={() => setInstruction("Improve character facial details and expressions.")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all">
                         <Zap size={12} /> 优化面部
                      </button>
                      <button onClick={() => setInstruction("Make the background more detailed and atmospheric.")} className="px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] text-zinc-400 hover:text-white flex items-center gap-1.5 transition-all">
                         <Layers size={12} /> 环境增强
                      </button>
                   </div>
                </div>
             </div>

             <div className="mt-auto">
                <button 
                  onClick={handleRefine}
                  disabled={isProcessing || !instruction}
                  className={`w-full ${isBrushMode ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40' : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'} disabled:opacity-30 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-base md:text-lg text-white shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95`}
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Wand2 size={20} />}
                  {isProcessing ? "正在重绘..." : "确认修改"}
                </button>
             </div>
          </div>
       </div>
    </div>
  );
};

const Step4Visuals: React.FC<Props> = ({ shots: initialShots, productImages, model, onNext, plotCharacters }) => {
  const [shots, setShots] = useState<RemappedShot[]>(initialShots);
  const [resolution, setResolution] = useState<Resolution>("2K");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingShot, setEditingShot] = useState<RemappedShot | null>(null);
  
  const shotsRef = useRef<RemappedShot[]>(shots);
  shotsRef.current = shots;

  const isPlotMode = !!plotCharacters && plotCharacters.length > 0;

  const groupedShots: Record<string, RemappedShot[]> = useMemo(() => {
    const groups: Record<string, RemappedShot[]> = {};
    shots.forEach(s => {
      const sid = s.sceneId || 'default';
      if (!groups[sid]) groups[sid] = [];
      groups[sid].push(s);
    });
    return groups;
  }, [shots]);

  const generateImageForShot = async (id: string, customPrevUrl?: string, retries = 2): Promise<string> => {
    const idx = shotsRef.current.findIndex(s => s.id === id);
    if (idx === -1) return "";

    setShots(prev => prev.map(s => s.id === id ? { ...s, isGenerating: true } : s));

    let attempt = 0;
    while (attempt <= retries) {
      try {
        let previousFrameUrl: string | undefined = customPrevUrl;
        
        if (isPlotMode && idx > 0 && !previousFrameUrl) {
          const currentShot = shotsRef.current[idx];
          const prevShot = shotsRef.current[idx - 1];
          if (prevShot.sceneId === currentShot.sceneId && prevShot.generatedImageUrl) {
            previousFrameUrl = prevShot.generatedImageUrl;
          }
        }

        const base64Image = await generateStoryboardFrame(
          shotsRef.current[idx].finalPrompt, 
          productImages[0] || null, 
          model, 
          resolution,
          plotCharacters,
          previousFrameUrl
        );
        
        if (base64Image) {
          setShots(prev => {
            const next = prev.map(s => s.id === id ? { ...s, isGenerating: false, generatedImageUrl: base64Image } : s);
            shotsRef.current = next;
            return next;
          });
          return base64Image;
        }
        throw new Error("Empty image");
      } catch (e) {
        attempt++;
        if (attempt > retries) {
          setShots(prev => prev.map(s => s.id === id ? { ...s, isGenerating: false } : s));
          return "";
        }
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    return "";
  };

  const handleEditSave = (newUrl: string) => {
    if (!editingShot) return;
    setShots(prev => prev.map(s => s.id === editingShot.id ? { ...s, generatedImageUrl: newUrl } : s));
  };

  const handleAddInBetweenFrame = (afterId: string) => {
    const idx = shots.findIndex(s => s.id === afterId);
    if (idx === -1) return;

    const currentShot = shots[idx];
    const nextShot = shots[idx + 1];
    
    // 智能合成过渡帧描述
    const transitionPrompt = nextShot 
      ? `A smooth transition frame between "${currentShot.subjectAction}" and "${nextShot.subjectAction}". Maintain character pose continuity and lighting. Cinematic flow.`
      : `An additional following frame for "${currentShot.subjectAction}", showing a slight progression in motion or emotion.`;

    const newShot: RemappedShot = {
      ...currentShot,
      id: `inbetween-${Date.now()}`,
      subjectAction: `[过渡/补充] ${currentShot.subjectAction.substring(0, 15)}...`,
      finalPrompt: transitionPrompt,
      generatedImageUrl: undefined,
      isGenerating: false,
    };

    const newShots = [...shots];
    newShots.splice(idx + 1, 0, newShot);
    setShots(newShots);
  };

  const handleDeleteShot = (id: string) => {
    // 禁止删除仅剩的两帧
    if (shots.length <= 2) {
      alert("剧情模式下每个转场至少需要两帧作为参考。");
      return;
    }
    setShots(prev => prev.filter(s => s.id !== id));
  };

  const generateAll = async () => {
    if (isBatchGenerating) return;
    setIsBatchGenerating(true);
    const pendingShots = shots.filter(s => !s.generatedImageUrl);
    const CONCURRENCY = 2;
    for (let i = 0; i < pendingShots.length; i += CONCURRENCY) {
        const chunk = pendingShots.slice(i, i + CONCURRENCY);
        await Promise.allSettled(chunk.map(s => generateImageForShot(s.id)));
        if (i + CONCURRENCY < pendingShots.length) {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }
    setIsBatchGenerating(false);
  };

  const generateSceneGroup = async (group: RemappedShot[]) => {
    if (isBatchGenerating) return;
    setIsBatchGenerating(true);
    const pendingInGroup = group.filter(s => !s.generatedImageUrl);
    for (const shot of pendingInGroup) {
      await generateImageForShot(shot.id);
      await new Promise(r => setTimeout(r, 1000));
    }
    setIsBatchGenerating(false);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchDownload = async () => {
    const validShots = shots.filter(s => !!s.generatedImageUrl);
    if (validShots.length === 0) return;
    setIsDownloading(true);
    try {
        const zip = new JSZip();
        let fileIdx = 1;
        for (const shot of shots) {
          if (shot.generatedImageUrl) {
            const data = shot.generatedImageUrl.split(',')[1];
            zip.file(`storyboard-${fileIdx.toString().padStart(3, '0')}.png`, data, {base64: true});
            fileIdx++;
          }
        }
        const content = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `eagle_storyboard_pack_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        alert("打包下载失败");
    } finally {
        setIsDownloading(false);
    }
  };

  const progressCount = shots.filter(s => !!s.generatedImageUrl).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="bg-[#0f0f11] border border-white/10 p-8 rounded-[40px] shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-inner"><LayoutList size={32} /></div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{isPlotMode ? '剧情分镜渲染中心' : '分镜极速生成'}</h2>
                <p className="text-xs text-zinc-500 font-medium mt-1 flex items-center gap-2">
                   <Zap size={12} className="text-emerald-500" />
                   {isPlotMode ? '已开启“动态补帧”模式，可在任意分镜间点击“+”号插入过渡帧以提升视频连贯性。' : '已开启极速渲染模式。'}
                </p>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                 <Settings2 className="text-zinc-600 ml-2" size={16} />
                 {(["1K", "2K", "4K"] as Resolution[]).map((res) => (
                    <button key={res} onClick={() => setResolution(res)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${resolution === res ? "bg-white text-black shadow-lg" : "text-zinc-500 hover:text-white"}`}>
                        {res}
                    </button>
                 ))}
              </div>
              <button onClick={generateAll} disabled={isBatchGenerating || progressCount === shots.length} className="bg-emerald-600 text-white hover:bg-emerald-500 px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3 shadow-xl shadow-emerald-900/40 transition-all active:scale-95 group">
                {isBatchGenerating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                全量并发合成 ({progressCount}/{shots.length})
              </button>
           </div>
        </div>

        {isBatchGenerating && (
           <div className="mb-10 px-8 py-4 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl animate-in slide-in-from-top-4">
              <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">正在为您串联视觉基因... (Processing)</span>
                 <span className="text-[10px] font-mono text-emerald-500">{Math.round((progressCount / shots.length) * 100)}%</span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                 <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${(progressCount / shots.length) * 100}%` }} />
              </div>
           </div>
        )}

        <div className="space-y-16">
          {(Object.entries(groupedShots) as [string, RemappedShot[]][]).map(([sid, group], groupIdx) => (
            <div key={sid} className="bg-white/5 border border-white/5 p-8 rounded-[48px] space-y-10 relative overflow-hidden group/section">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-zinc-500 group-hover/section:opacity-10 transition-opacity"><ChevronRight size={120} /></div>
               
               <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                     <span className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-sm shadow-lg">{groupIdx + 1}</span>
                     <div>
                        <h3 className="text-xl font-black text-white uppercase tracking-widest">{group[0].sceneTitle || 'SCENE'}</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Shot Chain: {group.length} Keyframes</p>
                     </div>
                  </div>
                  
                  <button 
                    onClick={() => generateSceneGroup(group)}
                    disabled={isBatchGenerating || group.every(s => !!s.generatedImageUrl)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl border border-white/10 text-xs font-black transition-all shadow-lg"
                  >
                     {isBatchGenerating && group.some(s => s.isGenerating) ? <Loader2 className="animate-spin" size={14} /> : <Zap size={14} />}
                     组内顺序渲染 ({group.filter(s => !!s.generatedImageUrl).length}/{group.length})
                  </button>
               </div>

               {/* 分镜卡片展示区域，支持动态插入按钮 */}
               <div className="flex flex-wrap gap-8 relative z-10 items-stretch">
                  {group.map((shot, idx) => (
                    <React.Fragment key={shot.id}>
                      <div className="flex-shrink-0 w-[calc(25%-24px)] min-w-[300px] flex flex-col group/card relative">
                        <div className={`w-full bg-black/60 border ${shot.isGenerating ? 'border-emerald-500/50 shadow-emerald-500/10' : 'border-white/10'} rounded-[32px] overflow-hidden flex flex-col hover:border-blue-500/30 transition-all shadow-xl relative`}>
                            <div className="aspect-video bg-[#050505] relative flex items-center justify-center border-b border-white/5 overflow-hidden">
                                {shot.generatedImageUrl ? (
                                  <>
                                    <img src={shot.generatedImageUrl} alt="shot" className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-105" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                                      <button onClick={() => setPreviewImage(shot.generatedImageUrl!)} className="p-3 bg-white rounded-full text-black hover:scale-110 transition-transform shadow-lg" title="放大"><Maximize2 size={18} /></button>
                                      <button onClick={() => setEditingShot(shot)} className="p-3 bg-amber-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg" title="AI 精修/换装"><Paintbrush size={18} /></button>
                                      <button onClick={() => generateImageForShot(shot.id)} className="p-3 bg-blue-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg" title="重绘"><RefreshCw size={18} className={shot.isGenerating ? "animate-spin" : ""} /></button>
                                      <button onClick={() => downloadImage(shot.generatedImageUrl!, `scene-${groupIdx + 1}-shot-${idx + 1}`)} className="p-3 bg-emerald-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg" title="下载"><Download size={18} /></button>
                                      <button onClick={() => handleDeleteShot(shot.id)} className="p-3 bg-red-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg" title="删除"><Trash2 size={18} /></button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center gap-4">
                                      {shot.isGenerating ? (
                                        <div className="flex flex-col items-center gap-3 px-8 text-center">
                                          <Loader2 className="animate-spin text-emerald-500" size={32} />
                                          <span className="text-[9px] text-zinc-500 font-black uppercase animate-pulse">正在精修画面细节...</span>
                                        </div>
                                      ) : (
                                        <button onClick={() => generateImageForShot(shot.id)} className="text-zinc-700 hover:text-blue-500 transition-all"><ImageIcon size={40} /></button>
                                      )}
                                      {!shot.isGenerating && <span className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">FRAME {idx + 1}</span>}
                                  </div>
                                )}
                            </div>
                            <div className="p-5 flex flex-col gap-3 bg-zinc-950/20">
                                <textarea 
                                  value={shot.finalPrompt}
                                  onChange={(e) => setShots(prev => prev.map(s => s.id === shot.id ? {...s, finalPrompt: e.target.value} : s))}
                                  className="w-full bg-transparent text-[11px] text-zinc-400 focus:text-white focus:outline-none min-h-[60px] resize-none leading-relaxed font-medium italic border-none scrollbar-none"
                                  placeholder="自定义画面描述..."
                                />
                            </div>
                            {shot.isGenerating && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse" />}
                        </div>
                      </div>

                      {/* 插入按钮：在相邻分镜之间显示 */}
                      {idx < group.length - 1 && (
                        <div className="flex flex-col justify-center items-center px-2">
                           <button 
                             onClick={() => handleAddInBetweenFrame(shot.id)}
                             className="w-10 h-10 bg-zinc-800 hover:bg-amber-600 text-zinc-600 hover:text-white rounded-full flex items-center justify-center transition-all hover:scale-125 border border-white/5 shadow-lg group/add"
                             title="在此处插入过渡分镜以补充流畅度"
                           >
                             <PlusCircle size={24} className="group-hover/add:rotate-90 transition-transform" />
                           </button>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
               </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-10 border-t border-white/5 mt-12">
           <button 
             onClick={handleBatchDownload} 
             disabled={isDownloading || !shots.some(s => !!s.generatedImageUrl)}
             className="px-10 py-5 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-sm border border-white/10 hover:bg-zinc-700 transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl"
           >
              {isDownloading ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
              打包下载分镜资产
           </button>
           <button onClick={() => onNext(shots)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-12 py-5 rounded-[28px] font-black text-lg transition-all shadow-2xl flex items-center gap-4 group active:scale-[0.98]">
              导出导演指令集
              <MoveRight size={28} className="group-hover:translate-x-3 transition-transform" />
           </button>
        </div>
      </div>

      {previewImage && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/98 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-full max-h-full p-10 flex flex-col items-center">
                <img src={previewImage} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10" onClick={e => e.stopPropagation()} />
                <button onClick={() => downloadImage(previewImage, `export-${Date.now()}`)} className="mt-8 bg-white text-black px-12 py-5 rounded-full font-black text-sm shadow-2xl hover:bg-zinc-200 transition-all flex items-center gap-3">
                   <Download size={20} /> 下载此帧原图
                </button>
            </div>
            <button className="absolute top-10 right-10 text-white/50 hover:text-white p-4 bg-white/5 rounded-full transition-all"><X size={32} /></button>
        </div>
      )}

      {/* Storyboard Refinement Modal */}
      <EditModal 
        isOpen={!!editingShot}
        onClose={() => setEditingShot(null)}
        shot={editingShot}
        onSave={handleEditSave}
        resolution={resolution}
      />
    </div>
  );
};

export default Step4Visuals;
