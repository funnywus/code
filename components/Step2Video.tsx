
import React, { useState } from 'react';
import { ShotStructure } from '../types';
import { Upload, FileVideo, Loader2, Film, AlertTriangle, PlayCircle, ArrowLeft } from 'lucide-react';
import { analyzeVideoStructure } from '../services/geminiService';

interface Props {
  onComplete: (structure: ShotStructure[], videoFile: File) => void;
  initialStructure: ShotStructure[];
  onBack: () => void;
}

const Step2Video: React.FC<Props> = ({ onComplete, initialStructure, onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [structure, setStructure] = useState<ShotStructure[]>(initialStructure);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const vFile = e.target.files[0];
      setFile(vFile);
      setVideoPreview(URL.createObjectURL(vFile));
      setStructure([]); // Reset structure on new file
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    try {
      const data = await analyzeVideoStructure(file);
      setStructure(data);
    } catch (err) {
      console.error(err);
      alert("视频分析失败。文件可能过大或 API 出现错误。");
    } finally {
      setAnalyzing(false);
    }
  };

  // Check if browser can likely play this format
  const canBrowserPlay = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    // Browsers typically play mp4, webm, ogg. They do NOT play .ts
    if (name.endsWith('.ts')) return false;
    if (name.endsWith('.mkv')) return false;
    return type.startsWith('video/');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={onBack} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors border border-white/5">
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
            <span className="bg-purple-600 text-[10px] px-2 py-1 rounded-md text-white uppercase font-bold">Step 2</span>
            视频结构拆解 (Video Structure Analysis)
          </h2>
        </div>
        
        <p className="text-zinc-400 mb-8 text-sm leading-relaxed max-w-2xl">
          上传一段参考视频风格。AI 将忽略视频中的具体内容，提取“镜头语言 DNA”（节奏、角度、光影），用于构建您的产品分镜结构。
        </p>

        {/* Video Upload */}
        {!file ? (
          <label className="flex flex-col items-center justify-center w-full h-60 border-2 border-dashed border-zinc-700 hover:border-purple-500 hover:bg-purple-500/5 rounded-2xl cursor-pointer transition-all group">
            <div className="p-4 bg-zinc-800 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <FileVideo className="text-zinc-500 group-hover:text-purple-400 w-10 h-10" />
            </div>
            <span className="text-sm font-bold text-zinc-300">上传参考视频 (建议小于 10MB)</span>
            <span className="text-xs text-zinc-500 mt-2 font-mono">MP4, MOV, WebM, TS</span>
            <input type="file" accept="video/*,.ts" onChange={handleFileChange} className="hidden" />
          </label>
        ) : (
          <div className="mb-6">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video mb-6 border border-zinc-800 flex flex-col items-center justify-center shadow-2xl">
              {canBrowserPlay(file) ? (
                <video src={videoPreview!} controls className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-8 bg-zinc-900/80 rounded-2xl border border-zinc-800">
                   <FileVideo className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                   <h3 className="text-white font-bold mb-2">{file.name}</h3>
                   <div className="flex items-center justify-center gap-2 text-yellow-500 text-xs bg-yellow-500/10 px-4 py-2 rounded-full mt-4 border border-yellow-500/20">
                      <AlertTriangle size={14} />
                      <span>此格式不支持网页预览，但可以直接分析</span>
                   </div>
                </div>
              )}
              
              <button 
                onClick={() => { setFile(null); setVideoPreview(null); }}
                className="absolute top-4 right-4 bg-black/60 hover:bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-full transition-all backdrop-blur-md border border-white/10 z-10"
              >
                更换视频
              </button>
            </div>
            
            <div className="flex justify-end gap-4">
               <button
                 onClick={onBack}
                 className="px-6 py-3 rounded-xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-all border border-white/5"
               >
                 上一步
               </button>
               <button
                onClick={handleAnalyze}
                disabled={analyzing || structure.length > 0}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20"
              >
                {analyzing ? <Loader2 className="animate-spin" size={18} /> : <Film size={18} />}
                {analyzing ? "正在分析 AI 引擎..." : "启动视频 DNA 分析"}
              </button>
            </div>
          </div>
        )}

        {/* Results Table */}
        {structure.length > 0 && (
          <div className="mt-10 animate-in fade-in slide-in-from-top-4 duration-500">
             <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">分镜拆解表 (Analyzed Shot List)</h3>
            </div>
            <div className="overflow-x-auto rounded-xl border border-white/5 shadow-2xl">
              <table className="w-full text-left text-sm text-zinc-400">
                <thead className="bg-zinc-950/80 uppercase text-[10px] font-black tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">时间点</th>
                    <th className="px-6 py-4 text-blue-400">视觉动作 (Subject Action)</th>
                    <th className="px-6 py-4">景别</th>
                    <th className="px-6 py-4">运镜手法</th>
                    <th className="px-6 py-4">灯光氛围</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-zinc-900/30">
                  {structure.map((shot, idx) => (
                    <tr key={idx} className="hover:bg-zinc-800/50 transition-colors group">
                      <td className="px-6 py-4 font-mono text-zinc-400 text-xs">{shot.timestamp}</td>
                      <td className="px-6 py-4 font-semibold text-white group-hover:text-blue-400 transition-colors">{shot.subjectAction || "-"}</td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">{shot.shotType}</td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">{shot.cameraMovement}</td>
                      <td className="px-6 py-4 text-zinc-500 text-xs">{shot.lighting}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => onComplete(structure, file!)}
              className="w-full mt-10 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl shadow-emerald-900/20 uppercase tracking-widest"
            >
              确认镜头结构并导演提示词
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step2Video;
