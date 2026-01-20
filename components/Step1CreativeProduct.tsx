
import React, { useState } from 'react';
import { FileWithPreview } from '../types';
import { Upload, X, Loader2, Image as ImageIcon, Sparkles, MessageSquareText, ArrowLeft } from 'lucide-react';
import { analyzeProductVisuals } from '../services/geminiService';

interface Props {
  onComplete: (token: string, images: File[], requirement: string) => void;
  initialToken: string;
  initialRequirement: string;
  onBack: () => void;
}

const Step1CreativeProduct: React.FC<Props> = ({ onComplete, initialToken, initialRequirement, onBack }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [productToken, setProductToken] = useState(initialToken);
  const [requirement, setRequirement] = useState(initialRequirement);

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
      const token = await analyzeProductVisuals(files.map(f => f.file));
      setProductToken(token);
    } catch (err) {
      alert("分析失败");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      {/* Left: Product Selection */}
      <div className="bg-[#0f0f11] border border-white/10 p-8 rounded-2xl flex flex-col gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors border border-white/5">
            <ArrowLeft size={16} />
          </button>
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <ImageIcon className="text-blue-500" size={24} />
            1. 视觉锚定 (Visual Anchoring)
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-blue-500 hover:bg-blue-500/5 rounded-xl cursor-pointer transition-all">
            <Upload size={20} className="text-zinc-500" />
            <span className="text-[10px] mt-1 text-zinc-500">上传产品图</span>
            <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
          </label>
          {files.map((f, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/5">
              <img src={f.preview} alt="p" className="w-full h-full object-cover" />
              <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/50 p-1 rounded-full"><X size={10} /></button>
            </div>
          ))}
        </div>
        <button onClick={handleAnalyze} disabled={files.length === 0 || analyzing} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg">
          {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
          {analyzing ? "正在分析特征..." : "提取产品 DNA"}
        </button>
        {productToken && (
           <div className="flex-1 bg-black/40 rounded-xl p-4 border border-white/5">
             <div className="text-[10px] text-zinc-500 uppercase font-bold mb-2">已识别特征</div>
             <p className="text-xs text-zinc-400 font-mono leading-relaxed line-clamp-6">{productToken}</p>
           </div>
        )}
      </div>

      {/* Right: Requirements */}
      <div className="bg-[#0f0f11] border border-white/10 p-8 rounded-2xl flex flex-col gap-6 shadow-xl">
        <h3 className="text-xl font-bold flex items-center gap-2 text-white">
          <MessageSquareText className="text-purple-500" size={24} />
          2. 创意实验室 (Creative Brief)
        </h3>
        <p className="text-zinc-400 text-sm">
          描述您想为产品产出的视频效果。描述得越详细，分镜策划就越专业。
        </p>
        <textarea
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          className="flex-1 min-h-[200px] bg-black/40 border border-white/10 rounded-xl p-6 text-zinc-200 focus:ring-1 focus:ring-purple-500 focus:outline-none resize-none shadow-inner"
          placeholder="例如：我需要一个充满电影感的豪华车广告，强调其流线型车身和在星空下的速度感。镜头应该是快节奏的，伴随强烈的动态光影变化..."
        />
        <button
          onClick={() => onComplete(productToken, files.map(f => f.file), requirement)}
          disabled={!productToken || !requirement}
          className="bg-emerald-600 hover:bg-emerald-500 py-4 rounded-xl font-bold text-white shadow-xl transition-all disabled:opacity-50"
        >
          确定并开始导演脚本
        </button>
      </div>
    </div>
  );
};

export default Step1CreativeProduct;
