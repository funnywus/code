
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppStep, ShotStructure, RemappedShot, WorkflowMode, AmazonImageConfig, PlotCharacter, ImageModel, PlotEnvironment, PlotStyle } from './types';
import Step1Product from './components/Step1Product';
import Step2Video from './components/Step2Video';
import Step3Prompts from './components/Step3Prompts';
import Step4Visuals from './components/Step4Visuals';
import Step5VideoPrompts from './components/Step5VideoPrompts';
import Step1CreativeProduct from './components/Step1CreativeProduct';
import Step2CreativeScript from './components/Step2CreativeScript';
import Step2AmazonConfig from './components/Step2AmazonConfig';
import Step3AmazonBrief from './components/Step3AmazonBrief';
import Step4AmazonVisuals from './components/Step4AmazonVisuals';
import Step1PlotCharacter from './components/Step1PlotCharacter';
import Step2PlotReference from './components/Step2PlotReference';
import Step3PlotScript from './components/Step3PlotScript';
import Step3_2PlotEnvironment from './components/Step3_2PlotEnvironment';
import Step3_5PlotOutfitting from './components/Step3_5PlotOutfitting';
import StepStorefrontDesigner from './components/StepStorefrontDesigner';
import AiAssistant from './components/AiAssistant';
import ApiKeyManager, { getStoredApiKey, clearStoredApiKey } from './components/ApiKeyManager';
import { Clapperboard, Layers, Wand2, Image as ImageIcon, Video, Sparkles, RotateCcw, MousePointer2, PencilLine, ArrowRight, ArrowLeft, Home, ShoppingBag, Settings, Layout, MessageCircle, ShieldCheck, UserCircle, Film, Shirt, Key, AlertTriangle, Mountain, Send, Zap, MessageSquare, Store } from 'lucide-react';

const App: React.FC = () => {
  const [mode, setMode] = useState<WorkflowMode | null>(null);
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.MODE_SELECTION);
  const [restartKey, setRestartKey] = useState<number>(0);
  const mainRef = useRef<HTMLDivElement>(null);
  
  const [productToken, setProductToken] = useState<string>("");
  const [productImages, setProductImages] = useState<File[]>([]); 
  const [requirement, setRequirement] = useState<string>("");
  const [structure, setStructure] = useState<ShotStructure[]>([]);
  const [remappedShots, setRemappedShots] = useState<RemappedShot[]>([]);
  const [amazonConfigs, setAmazonConfigs] = useState<AmazonImageConfig[]>([]);
  const [plotCharacters, setPlotCharacters] = useState<PlotCharacter[]>([]);
  const [plotEnvironments, setPlotEnvironments] = useState<PlotEnvironment[]>([]);
  const [imageModel] = useState<ImageModel>('gemini-3-pro-image-preview');
  const [plotProposal, setPlotProposal] = useState<any>(null);

  const [showApiKeyManager, setShowApiKeyManager] = useState(false);

  const steps = useMemo(() => {
    if (!mode) return [];
    if (mode === WorkflowMode.STOREFRONT) {
      return [{ id: AppStep.STOREFRONT_CONFIG, label: "旗舰店设计", desc: "多尺寸视觉引擎", icon: Store }];
    }
    const baseSteps = [{ id: AppStep.PRODUCT_ANCHORING, label: "视觉锚定", desc: "提取产品 DNA 特征", icon: ImageIcon }];

    if (mode === WorkflowMode.REFERENCE) {
      return [...baseSteps, { id: AppStep.VIDEO_ANALYSIS, label: "视频拆解", desc: "分析参考视频结构", icon: Video }, { id: AppStep.PROMPT_REMAPPING, label: "提示词重组", desc: "融合产品与视频特征", icon: Wand2 }, { id: AppStep.STORYBOARDING, label: "分镜预览", desc: "生成视觉分镜图", icon: Layout }, { id: AppStep.VIDEO_PROMPTS, label: "视频指令", desc: "导出视频生成提示词", icon: Clapperboard }];
    }
    if (mode === WorkflowMode.CREATIVE) {
      return [...baseSteps, { id: AppStep.CREATIVE_SCRIPT, label: "创意脚本", desc: "AI 导演构思脚本", icon: PencilLine }, { id: AppStep.STORYBOARDING, label: "分镜预览", desc: "生成视觉分镜图", icon: Layout }, { id: AppStep.VIDEO_PROMPTS, label: "视频指令", desc: "导出视频生成提示词", icon: Clapperboard }];
    }
    if (mode === WorkflowMode.AMAZON) {
      return [...baseSteps, { id: AppStep.AMAZON_CONFIG, label: "规格配置", desc: "设置图片尺寸与数量", icon: Settings }, { id: AppStep.AMAZON_BRIEF, label: "文案同步", desc: "结合 Listing 策划提示词", icon: PencilLine }, { id: AppStep.AMAZON_VISUALS, label: "视觉中心", desc: "生成全套 Listing 图片", icon: ShoppingBag }];
    }
    if (mode === WorkflowMode.PLOT) {
      return [
        { id: AppStep.PLOT_CHARACTER_ANCHOR, label: "角色锚定", desc: "提取角色视觉特征", icon: UserCircle },
        { id: AppStep.PLOT_CHARACTER_TURNAROUND, label: "多面视图", desc: "生成一致性参考图", icon: Layout },
        { id: AppStep.PLOT_SCRIPT_BRAINSTORM, label: "剧情构思", desc: "导演策划脚本提案", icon: MessageCircle },
        { id: AppStep.PLOT_ENVIRONMENT_ANCHOR, label: "场景锚定", desc: "锁定背景视觉基因", icon: Mountain },
        { id: AppStep.PLOT_CHARACTER_OUTFIT, label: "服装定制", desc: "角色服化道实验室", icon: Shirt },
        { id: AppStep.PLOT_STORYBOARD, label: "分镜预览", desc: "生成剧情视觉分镜", icon: Film },
        { id: AppStep.PLOT_FINAL_PROMPTS, label: "导演指令", desc: "导出视频提示词", icon: Clapperboard },
      ];
    }
    return [];
  }, [mode]);

  useEffect(() => {
    // 检查是否已有存储的 API Key
    const storedKey = getStoredApiKey();
    if (!storedKey) {
      setShowApiKeyManager(true);
    }
  }, []);

  const handleApiKeySet = (key: string) => {
    setShowApiKeyManager(false);
  };

  const handleSelectMode = (m: WorkflowMode) => {
    // 再次检查 API Key
    const storedKey = getStoredApiKey();
    if (!storedKey) {
      setShowApiKeyManager(true);
      return;
    }
    setMode(m);
    if (m === WorkflowMode.STOREFRONT) {
      setCurrentStep(AppStep.STOREFRONT_CONFIG);
    } else {
      setCurrentStep(m === WorkflowMode.PLOT ? AppStep.PLOT_CHARACTER_ANCHOR : AppStep.PRODUCT_ANCHORING);
    }
  };

  const handleRestart = () => {
    setMode(null); setProductToken(""); setProductImages([]); setRequirement(""); setStructure([]); setRemappedShots([]); setAmazonConfigs([]); setPlotCharacters([]); setPlotEnvironments([]); setPlotProposal(null); setCurrentStep(AppStep.MODE_SELECTION); setRestartKey(Date.now());
  };

  const LogoComponent = () => (
    <div className="relative bg-black/40 border border-white/10 backdrop-blur-2xl px-12 py-6 rounded-full flex items-center gap-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
      <div className="w-16 h-16 relative flex items-center justify-center">
        <img src="https://api.dicebear.com/7.x/initials/svg?seed=Eagle&backgroundColor=transparent&fontFamily=Arial&fontWeight=900" className="w-12 h-12 invert brightness-200" alt="logo" />
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/40 via-rose-500/40 to-blue-500/40 blur-lg rounded-full mix-blend-screen opacity-60"></div>
      </div>
      <div className="h-12 w-px bg-white/10" />
      <div className="text-left">
        <div className="text-3xl font-black text-white tracking-[0.4em] uppercase leading-none">Eagle Science & Tech</div>
        <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-3">棵鹰科技 · 高级视觉实验室</div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-transparent text-zinc-100 flex overflow-hidden font-sans selection:bg-blue-500/30 relative">
      <AiAssistant />
      
      {showApiKeyManager && <ApiKeyManager onKeySet={handleApiKeySet} />}

      <aside className={`w-96 bg-black/80 backdrop-blur-[80px] border-r border-white/10 flex flex-col shadow-2xl z-20 flex-shrink-0 transition-all duration-700 ${currentStep === AppStep.MODE_SELECTION ? 'translate-x-[-100%] opacity-0 pointer-events-none' : 'translate-x-0 opacity-100'}`}>
        <div className="p-12 pb-8 border-b border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-zinc-900 rounded-full border border-white/10">
               <img src="https://api.dicebear.com/7.x/initials/svg?seed=Eagle&backgroundColor=transparent&fontFamily=Arial&fontWeight=900" className="w-6 h-6 invert brightness-200" alt="logo" />
             </div>
             <h1 className="text-xl font-black text-white uppercase leading-tight tracking-[0.2em]">棵鹰科技</h1>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
             <Clapperboard size={14} className="text-amber-500" />
             <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Master Studio</span>
          </div>
        </div>
        <nav className="flex-1 px-6 py-8 space-y-4 overflow-y-auto">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            return (
              <button key={s.id} onClick={() => setCurrentStep(s.id)} disabled={currentStep < s.id} className={`w-full text-left flex items-center gap-6 px-6 py-6 rounded-[28px] transition-all ${isActive ? 'bg-white/10 border-white/20' : 'opacity-40'}`}>
                <div className={`p-4 rounded-2xl ${isActive ? 'bg-amber-600 text-white shadow-lg' : 'bg-zinc-800'}`}><Icon size={24} /></div>
                <div><div className="text-lg font-bold">{s.label}</div><div className="text-xs text-zinc-500 uppercase">{s.desc}</div></div>
              </button>
            );
          })}
        </nav>
        
        <div className="p-10 space-y-4">
          <div className="bg-white/5 border border-white/10 p-5 rounded-[28px] flex flex-col gap-3">
             <div className="flex items-center gap-3 text-emerald-400">
                <MessageSquare size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">售后及技术支持</span>
             </div>
             <div className="text-sm font-black text-white tracking-widest font-mono">微信咨询: CoinTuring</div>
          </div>
          <button 
            onClick={() => setShowApiKeyManager(true)} 
            className="w-full py-5 bg-zinc-900 text-zinc-300 rounded-[28px] font-black border border-white/5 flex items-center justify-center gap-4 hover:bg-zinc-800 transition-colors"
          >
            <Key size={22} /> 修改 API Key
          </button>
          <button onClick={handleRestart} className="w-full py-5 bg-zinc-900 text-zinc-300 rounded-[28px] font-black border border-white/5 flex items-center justify-center gap-4 hover:bg-zinc-800 transition-colors">
            <Home size={22} /> 返回模式选择
          </button>
        </div>
      </aside>

      <main ref={mainRef} className="flex-1 overflow-y-auto scroll-smooth relative z-10 flex flex-col">
        <div className="w-full h-full px-6 py-12 flex flex-col items-center">
          {currentStep === AppStep.MODE_SELECTION ? (
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[1400px] animate-in fade-in zoom-in-95 duration-1000">
               <div className="mb-16 flex flex-col items-center gap-6">
                  <div className="relative group">
                     <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 via-rose-500 to-blue-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
                     <LogoComponent />
                  </div>
               </div>

               <div className="text-center space-y-6 mb-20">
                  <h1 className="text-9xl font-black text-white tracking-tighter leading-none uppercase">视觉实验室入口</h1>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full mb-24 mx-auto">
                  <button onClick={() => handleSelectMode(WorkflowMode.STOREFRONT)} className="group relative bg-zinc-900/40 border border-white/5 hover:border-emerald-500/50 p-10 rounded-[48px] transition-all hover:-translate-y-3 hover:bg-zinc-900/60 text-left shadow-2xl flex flex-col gap-8 overflow-hidden">
                    <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(5,150,105,0.4)] group-hover:rotate-[10deg] transition-all"><Store size={32} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">旗舰店一键设计</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed opacity-80">顶级设计思维，从 Logo 到全尺寸装修图，一键自动化高保真输出。</p>
                    </div>
                  </button>

                  <button onClick={() => handleSelectMode(WorkflowMode.REFERENCE)} className="group relative bg-zinc-900/40 border border-white/5 hover:border-blue-500/50 p-10 rounded-[48px] transition-all hover:-translate-y-3 hover:bg-zinc-900/60 text-left shadow-2xl flex flex-col gap-8 overflow-hidden">
                    <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(37,99,235,0.4)] group-hover:rotate-[10deg] transition-all"><Send size={32} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">经典复刻模式</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed opacity-80">深度拆解参考视频DNA，实现物理级的镜头语言与风格化克隆。</p>
                    </div>
                  </button>

                  <button onClick={() => handleSelectMode(WorkflowMode.CREATIVE)} className="group relative bg-zinc-900/40 border border-white/5 hover:border-purple-500/50 p-10 rounded-[48px] transition-all hover:-translate-y-3 hover:bg-zinc-900/60 text-left shadow-2xl flex flex-col gap-8 overflow-hidden">
                    <div className="w-16 h-16 bg-purple-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(147,51,234,0.4)] group-hover:rotate-[10deg] transition-all"><Wand2 size={32} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">灵感创作模式</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed opacity-80">输入文字愿景，由 AI 导演从零策划具有叙事张力的商业蓝图。</p>
                    </div>
                  </button>

                  <button onClick={() => handleSelectMode(WorkflowMode.PLOT)} className="group relative bg-zinc-900/40 border border-white/5 hover:border-orange-500/50 p-10 rounded-[48px] transition-all hover:-translate-y-3 hover:bg-zinc-900/60 text-left shadow-2xl flex flex-col gap-8 overflow-hidden">
                    <div className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(234,88,12,0.4)] group-hover:rotate-[10deg] transition-all"><Layout size={32} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">剧情大片模式</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed opacity-80">锁定角色视觉基因，AI 策划连贯分镜并输出视频指令。</p>
                    </div>
                  </button>

                  <button onClick={() => handleSelectMode(WorkflowMode.AMAZON)} className="group relative bg-zinc-900/40 border border-white/5 hover:border-emerald-500/50 p-10 rounded-[48px] transition-all hover:-translate-y-3 hover:bg-zinc-900/60 text-left shadow-2xl flex flex-col gap-8 overflow-hidden">
                    <div className="w-16 h-16 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-[0_0_40px_rgba(5,150,105,0.4)] group-hover:rotate-[10deg] transition-all"><ShoppingBag size={32} /></div>
                    <div>
                      <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tight">亚马逊 Listing</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed opacity-80">针对电商主副图深度优化。生成全套高转化、高保真品牌资产。</p>
                    </div>
                  </button>
               </div>
            </div>
          ) : (
            <div className="flex-1 w-full flex flex-col items-center">
                <div className="w-full max-w-[1800px] mb-12 flex justify-between items-center">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-white/10">
                      <img src="https://api.dicebear.com/7.x/initials/svg?seed=Eagle&backgroundColor=transparent&fontFamily=Arial&fontWeight=900" className="w-8 h-8 invert brightness-200" alt="logo" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white tracking-widest uppercase">Eagle Suite</h2>
                    </div>
                  </div>
                  <button onClick={handleRestart} className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl font-bold text-xs border border-white/5 transition-all flex items-center gap-2">
                    <Home size={14} /> 返回主页
                  </button>
                </div>

                <div className="w-full max-w-[1800px]">
                  {currentStep === AppStep.STOREFRONT_CONFIG && <StepStorefrontDesigner key={`sf-${restartKey}`} onBack={handleRestart} />}
                  
                  {currentStep === AppStep.PLOT_CHARACTER_ANCHOR && <Step1PlotCharacter key={`p1-${restartKey}`} initialModel={imageModel} onModelChange={() => {}} onComplete={(chars) => { setPlotCharacters(chars); setCurrentStep(AppStep.PLOT_CHARACTER_TURNAROUND); }} onBack={handleRestart} />}
                  {currentStep === AppStep.PLOT_CHARACTER_TURNAROUND && <Step2PlotReference key={`p2-${restartKey}`} characters={plotCharacters} model={imageModel} onComplete={(updated) => { setPlotCharacters(updated); setCurrentStep(AppStep.PLOT_SCRIPT_BRAINSTORM); }} onBack={() => setCurrentStep(AppStep.PLOT_CHARACTER_ANCHOR)} />}
                  {currentStep === AppStep.PLOT_SCRIPT_BRAINSTORM && <Step3PlotScript key={`p3-${restartKey}`} characters={plotCharacters} onComplete={(shots, requirement, proposal) => { setRemappedShots(shots); setRequirement(requirement); setPlotProposal(proposal); setPlotEnvironments(proposal.environments); setCurrentStep(AppStep.PLOT_ENVIRONMENT_ANCHOR); }} onBack={() => setCurrentStep(AppStep.PLOT_CHARACTER_TURNAROUND)} />}
                  {currentStep === AppStep.PLOT_ENVIRONMENT_ANCHOR && <Step3_2PlotEnvironment key={`p32-${restartKey}`} environments={plotEnvironments} style={plotCharacters[0]?.style || PlotStyle.ANIME} model={imageModel} onComplete={(envs) => { setPlotEnvironments(envs); setCurrentStep(AppStep.PLOT_CHARACTER_OUTFIT); }} onBack={() => setCurrentStep(AppStep.PLOT_SCRIPT_BRAINSTORM)} />}
                  {currentStep === AppStep.PLOT_CHARACTER_OUTFIT && <Step3_5PlotOutfitting key={`p35-${restartKey}`} characters={plotCharacters} plotProposal={plotProposal} model={imageModel} onComplete={(updated) => { setPlotCharacters(updated); setCurrentStep(AppStep.PLOT_STORYBOARD); }} onBack={() => setCurrentStep(AppStep.PLOT_ENVIRONMENT_ANCHOR)} />}
                  {currentStep === AppStep.PLOT_STORYBOARD && <Step4Visuals key={`p4-${restartKey}`} shots={remappedShots} productImages={[]} plotCharacters={plotCharacters} model={imageModel} onBack={() => setCurrentStep(AppStep.PLOT_CHARACTER_OUTFIT)} onNext={(shots) => { setRemappedShots(shots); setCurrentStep(AppStep.PLOT_FINAL_PROMPTS); }} />}
                  {currentStep === AppStep.PLOT_FINAL_PROMPTS && <Step5VideoPrompts key={`p5-${restartKey}`} shots={remappedShots} productToken={plotCharacters.map(c => `${c.name}: ${c.token}`).join('. ')} onBack={() => setCurrentStep(AppStep.PLOT_STORYBOARD)} isPlotMode={true} plotCharacters={plotCharacters} />}
                  
                  {currentStep === AppStep.PRODUCT_ANCHORING && mode === WorkflowMode.REFERENCE && <Step1Product key={`r1-${restartKey}`} onComplete={(token, images) => { setProductToken(token); setProductImages(images); setCurrentStep(AppStep.VIDEO_ANALYSIS); }} initialToken={productToken} onBack={handleRestart} />}
                  {currentStep === AppStep.VIDEO_ANALYSIS && <Step2Video key={`r2-${restartKey}`} onComplete={(struct) => { setStructure(struct); setCurrentStep(AppStep.PROMPT_REMAPPING); }} initialStructure={structure} onBack={() => setCurrentStep(AppStep.PRODUCT_ANCHORING)} />}
                  {currentStep === AppStep.PROMPT_REMAPPING && <Step3Prompts key={`r3-${restartKey}`} productToken={productToken} structure={structure} onComplete={(shots) => { setRemappedShots(shots); setCurrentStep(AppStep.STORYBOARDING); }} initialShots={remappedShots} onBack={() => setCurrentStep(AppStep.VIDEO_ANALYSIS)} />}
                  
                  {currentStep === AppStep.PRODUCT_ANCHORING && mode === WorkflowMode.CREATIVE && <Step1CreativeProduct key={`c1-${restartKey}`} onComplete={(token, images, req) => { setProductToken(token); setProductImages(images); setRequirement(req); setCurrentStep(AppStep.CREATIVE_SCRIPT); }} initialToken={productToken} initialRequirement={requirement} onBack={handleRestart} />}
                  {currentStep === AppStep.CREATIVE_SCRIPT && <Step2CreativeScript key={`c2-${restartKey}`} productToken={productToken} requirement={requirement} onComplete={(shots) => { setRemappedShots(shots); setCurrentStep(AppStep.STORYBOARDING); }} initialShots={remappedShots} onBack={() => setCurrentStep(AppStep.PRODUCT_ANCHORING)} />}
                  
                  {currentStep === AppStep.STORYBOARDING && mode !== WorkflowMode.PLOT && <Step4Visuals key={`r4-${restartKey}`} shots={remappedShots} productImages={productImages} model={imageModel} onBack={() => setCurrentStep(mode === WorkflowMode.REFERENCE ? AppStep.PROMPT_REMAPPING : AppStep.CREATIVE_SCRIPT)} onNext={(shots) => { setRemappedShots(shots); setCurrentStep(AppStep.VIDEO_PROMPTS); }} />}
                  {currentStep === AppStep.VIDEO_PROMPTS && mode !== WorkflowMode.PLOT && <Step5VideoPrompts key={`r5-${restartKey}`} shots={remappedShots} productToken={productToken} onBack={() => setCurrentStep(AppStep.STORYBOARDING)} />}

                  {currentStep === AppStep.PRODUCT_ANCHORING && mode === WorkflowMode.AMAZON && <Step1Product key={`a1-${restartKey}`} onComplete={(token, images) => { setProductToken(token); setProductImages(images); setCurrentStep(AppStep.AMAZON_CONFIG); }} initialToken={productToken} onBack={handleRestart} />}
                  {currentStep === AppStep.AMAZON_CONFIG && <Step2AmazonConfig key={`a2-${restartKey}`} onBack={() => setCurrentStep(AppStep.PRODUCT_ANCHORING)} onComplete={(configs) => { setAmazonConfigs(configs); setCurrentStep(AppStep.AMAZON_BRIEF); }} />}
                  {currentStep === AppStep.AMAZON_BRIEF && <Step3AmazonBrief key={`a3-${restartKey}`} productToken={productToken} configs={amazonConfigs} onBack={() => setCurrentStep(AppStep.AMAZON_CONFIG)} onComplete={(updated) => { setAmazonConfigs(updated); setCurrentStep(AppStep.AMAZON_VISUALS); }} />}
                  {currentStep === AppStep.AMAZON_VISUALS && <Step4AmazonVisuals key={`a4-${restartKey}`} configs={amazonConfigs} productImages={productImages} onBack={() => setCurrentStep(AppStep.AMAZON_BRIEF)} />}
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
