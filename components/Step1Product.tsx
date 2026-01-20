
import React, { useState } from 'react';
import { FileWithPreview } from '../types';
import { Upload, X, Loader2, CheckCircle2, Image as ImageIcon, Sparkles, ArrowLeft } from 'lucide-react';
import { analyzeProductVisuals } from '../services/geminiService';

interface Props {
  onComplete: (token: string, images: File[]) => void;
  initialToken: string;
  onBack: () => void;
}

const Step1Product: React.FC<Props> = ({ onComplete, initialToken, onBack }) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [productToken, setProductToken] = useState(initialToken);

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

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    try {
      const rawFiles = files.map(f => f.file);
      const token = await analyzeProductVisuals(rawFiles);
      setProductToken(token);
    } catch (err) {
      console.error(err);
      alert("分析图片失败，请检查 API Key。");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Section: Upload Area - Made Wider */}
      <div className="bg-[#0f0f11] border border-white/10 p-8 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors border border-white/5">
              <ArrowLeft size={16} />
            </button>
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <ImageIcon className="text-blue-500" size={20} />
              产品图集上传
              <span className="text-zinc-500 text-sm font-normal ml-2">(建议上传 3-5 张不同角度的高清图)</span>
            </h3>
          </div>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-1 rounded border border-white/5">
            已选择: {files.length} 张
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
           {/* Upload Button - Always First */}
           <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 hover:border-blue-500 hover:bg-blue-500/5 rounded-xl cursor-pointer transition-all group">
            <div className="p-3 bg-zinc-800 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Upload className="text-zinc-400 group-hover:text-blue-400" size={24} />
            </div>
            <span className="text-sm text-zinc-400 group-hover:text-blue-400 font-medium">点击上传</span>
            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          </label>

          {/* Image Previews */}
          {files.map((f, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-lg">
              <img src={f.preview} alt="preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button 
                onClick={() => removeFile(i)}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleAnalyze}
            disabled={files.length === 0 || analyzing}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 transform active:scale-95"
          >
            {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {analyzing ? "Gemini 正在提取特征..." : "开始分析产品特征"}
          </button>
        </div>
      </div>

      {/* Bottom Section: Result - Full Width Editor Style */}
      {productToken && (
        <div className="flex-1 bg-[#0f0f11] border border-white/10 p-1 rounded-2xl shadow-xl flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-white/5 bg-white/5 rounded-t-xl">
             <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                <span className="text-sm font-semibold text-white">Product Token 生成完毕</span>
             </div>
             <div className="text-xs text-zinc-500 font-mono">Editable / Markdown Supported</div>
          </div>
          
          <div className="flex-1 p-4">
             <textarea
              value={productToken}
              onChange={(e) => setProductToken(e.target.value)}
              className="w-full h-full min-h-[300px] bg-transparent text-zinc-300 font-mono text-sm leading-relaxed focus:outline-none resize-none p-2"
              placeholder="分析结果将显示在这里..."
            />
          </div>

          <div className="p-4 border-t border-white/5 bg-zinc-900/30 rounded-b-xl flex justify-end">
             <button
              onClick={() => onComplete(productToken, files.map(f => f.file))}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
            >
              确认并进入下一步
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1Product;
