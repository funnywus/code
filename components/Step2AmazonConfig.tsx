
import React, { useState } from 'react';
import { AmazonImageConfig } from '../types';
import { Settings, Plus, ArrowRight, ArrowLeft, Image as ImageIcon, Layout, BoxSelect } from 'lucide-react';

const SizeSelector = ({ value, onChange, options, label }: { value: string, onChange: (v: string) => void, options: string[], label: string }) => (
  <div className="flex flex-col gap-3">
    <div className="flex justify-between items-center">
      <label className="text-xs text-zinc-500 font-black uppercase tracking-widest">{label}</label>
      <span className="text-xs text-emerald-500 font-mono font-bold">W x H</span>
    </div>
    <div className="flex gap-3">
      <div className="relative flex-1">
        <input 
          type="text" 
          value={value} 
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-base text-white focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono"
          placeholder="自定义尺寸..."
        />
        <BoxSelect className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
      </div>
      {options.map(s => (
        <button 
          key={s} 
          type="button"
          onClick={() => onChange(s)} 
          className={`px-5 py-2 rounded-2xl text-xs font-black border transition-all ${value === s ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/40' : 'bg-zinc-800 border-white/5 text-zinc-500 hover:bg-zinc-700'}`}
        >
          {s}
        </button>
      ))}
    </div>
  </div>
);

interface Props {
  onComplete: (configs: AmazonImageConfig[]) => void;
  onBack: () => void;
}

const Step2AmazonConfig: React.FC<Props> = ({ onComplete, onBack }) => {
  const [mainCount, setMainCount] = useState(1);
  const [secondaryCount, setSecondaryCount] = useState(6);
  const [aplusCount, setAplusCount] = useState(4);
  
  // 独立尺寸设置
  const [gallerySize, setGallerySize] = useState("1600x1600");
  const [aplusSize, setAplusSize] = useState("970x600");
  
  const handleProceed = () => {
    const configs: AmazonImageConfig[] = [];
    
    // Add Main Image
    for(let i=0; i<mainCount; i++) {
      configs.push({ id: `main-${i}`, type: 'MAIN', size: gallerySize, prompt: '', finalPrompt: '' });
    }
    // Add Secondary Images
    for(let i=0; i<secondaryCount; i++) {
      configs.push({ id: `sec-${i}`, type: 'SECONDARY', size: gallerySize, prompt: '', finalPrompt: '' });
    }
    // Add A+ Images
    for(let i=0; i<aplusCount; i++) {
      configs.push({ id: `aplus-${i}`, type: 'APLUS', size: aplusSize, prompt: '', finalPrompt: '' });
    }
    
    onComplete(configs);
  };

  return (
    <div className="bg-[#0f0f11] border border-white/10 p-12 rounded-[48px] animate-in fade-in zoom-in-95 duration-500 shadow-2xl max-w-6xl mx-auto relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-600/10 blur-[120px] rounded-full" />
      <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-8 mb-16">
          <button onClick={onBack} className="p-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-2xl transition-all border border-white/5 shadow-lg">
            <ArrowLeft size={28} />
          </button>
          <div>
            <h2 className="text-4xl font-black flex items-center gap-4 text-white tracking-tighter uppercase">
              <Settings className="text-emerald-500" size={40} />
              Listing 规格配置
            </h2>
            <p className="text-zinc-500 text-lg mt-2 font-medium">请根据店铺需求独立配置主副图与 A+ 图片的尺寸与数量</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Gallery Group */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">主图 & 副图 (Gallery)</h3>
            </div>
            
            <div className="bg-zinc-900/40 p-10 rounded-[32px] border border-white/5 space-y-10 backdrop-blur-sm">
              <SizeSelector 
                label="图片分辨率 (Gallery Size)" 
                value={gallerySize} 
                onChange={setGallerySize} 
                options={["1600x1600", "2000x2000"]} 
              />
              
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <ImageIcon size={18} className="text-blue-500" />
                    <span className="text-xs font-black uppercase tracking-widest">主图数量</span>
                  </div>
                  <input 
                    type="number" 
                    value={mainCount} 
                    onChange={(e) => setMainCount(Math.max(0, Number(e.target.value)))} 
                    className="w-full bg-black/60 border border-white/10 rounded-3xl px-6 py-6 text-4xl font-black text-white focus:ring-2 focus:ring-blue-500/50 outline-none text-center shadow-inner" 
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-zinc-400">
                    <Layout size={18} className="text-purple-500" />
                    <span className="text-xs font-black uppercase tracking-widest">副图数量</span>
                  </div>
                  <input 
                    type="number" 
                    value={secondaryCount} 
                    onChange={(e) => setSecondaryCount(Math.max(0, Number(e.target.value)))} 
                    className="w-full bg-black/60 border border-white/10 rounded-3xl px-6 py-6 text-4xl font-black text-white focus:ring-2 focus:ring-purple-500/50 outline-none text-center shadow-inner" 
                  />
                </div>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                <p className="text-xs text-zinc-500 leading-relaxed italic text-center font-medium">主图将严格遵循亚马逊 RGB 255 白底规范生成</p>
              </div>
            </div>
          </div>

          {/* A+ Content Group */}
          <div className="space-y-8">
            <div className="flex items-center gap-4 px-2">
              <div className="w-2 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">A+ 描述图 (A+ Content)</h3>
            </div>

            <div className="bg-zinc-900/40 p-10 rounded-[32px] border border-white/5 space-y-10 backdrop-blur-sm h-full flex flex-col">
              <SizeSelector 
                label="A+ 图片分辨率 (A+ Size)" 
                value={aplusSize} 
                onChange={setAplusSize} 
                options={["970x600", "600x600"]} 
              />
              
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 text-zinc-400">
                  <Plus size={18} className="text-emerald-500" />
                  <span className="text-xs font-black uppercase tracking-widest">A+ 图片数量</span>
                </div>
                <input 
                  type="number" 
                  value={aplusCount} 
                  onChange={(e) => setAplusCount(Math.max(0, Number(e.target.value)))} 
                  className="w-full bg-black/60 border border-white/10 rounded-3xl px-6 py-6 text-4xl font-black text-white focus:ring-2 focus:ring-emerald-500/50 outline-none text-center shadow-inner" 
                />
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mt-auto">
                <p className="text-xs text-zinc-500 leading-relaxed italic text-center font-medium">A+ 模块通常使用宽幅比例以适应网页排版</p>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleProceed}
          className="w-full mt-16 bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 py-8 rounded-[32px] font-black text-2xl text-white shadow-[0_20px_60px_-10px_rgba(16,185,129,0.4)] hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-5 group active:scale-[0.98]"
        >
          确认规格并进入下一步
          <ArrowRight className="group-hover:translate-x-3 transition-transform duration-300" size={32} />
        </button>
      </div>
    </div>
  );
};

export default Step2AmazonConfig;
