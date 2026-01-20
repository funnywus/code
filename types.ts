
export interface ShotStructure {
  timestamp: string;
  shotType: string;
  cameraMovement: string;
  lighting: string;
  pacing: string;
  subjectAction: string;
  dialogue?: string; 
  dialogueType?: 'VO' | 'CHARACTER'; 
}

export interface StorefrontCanvasConfig {
  id: string;
  width: number;
  height: number;
  referenceFile: File | null;
  referencePreview: string | null;
  generatedImages: string[];
  isGenerating: boolean;
}

export interface AmazonImageConfig {
  id: string;
  type: 'MAIN' | 'SECONDARY' | 'APLUS';
  size: string;
  prompt: string;
  finalPrompt: string;
  generatedImageUrl?: string;
  isGenerating?: boolean;
}

export enum PlotStyle {
  ANIME = 'ANIME',
  REALISTIC = 'REALISTIC',
  CYBERPUNK = 'CYBERPUNK',
  PIXAR = 'PIXAR',
  SKETCH = 'SKETCH',
  INK = 'INK',
  REALISTIC_INK_FUSION = 'REALISTIC_INK_FUSION',
  CHINESE = 'CHINESE',
  CHINESE_3D_ANIME = 'CHINESE_3D_ANIME'
}

export type ImageModel = 'gemini-3-pro-image-preview';

export interface CharacterCostume {
  id: string;
  name: string;
  description: string;
  style: string;
}

export interface PlotEnvironment {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface PlotCharacter {
  id: string;
  name: string;
  images: File[];
  token: string;
  turnaroundUrl?: string;
  outfittedUrl?: string;
  isGenerating?: boolean;
  style?: PlotStyle;
  selectedCostume?: CharacterCostume;
  suggestedCostumes?: CharacterCostume[];
}

export interface RemappedShot extends ShotStructure {
  id: string;
  finalPrompt: string;
  generatedImageUrl?: string;
  isGenerating?: boolean;
  videoPrompt?: string;
  sceneId?: string;
  sceneTitle?: string;
}

export enum WorkflowMode {
  REFERENCE = 'REFERENCE',
  CREATIVE = 'CREATIVE',
  AMAZON = 'AMAZON',
  PLOT = 'PLOT',
  STOREFRONT = 'STOREFRONT'
}

export enum AppStep {
  MODE_SELECTION = 0,
  PRODUCT_ANCHORING = 1,
  VIDEO_ANALYSIS = 2,
  CREATIVE_SCRIPT = 2.5,
  PROMPT_REMAPPING = 3,
  STORYBOARDING = 4,
  VIDEO_PROMPTS = 5,
  AMAZON_CONFIG = 10,
  AMAZON_BRIEF = 11,
  AMAZON_VISUALS = 12,
  PLOT_CHARACTER_ANCHOR = 20,
  PLOT_CHARACTER_TURNAROUND = 21,
  PLOT_SCRIPT_BRAINSTORM = 22,
  PLOT_ENVIRONMENT_ANCHOR = 22.2, 
  PLOT_CHARACTER_OUTFIT = 22.5,
  PLOT_STORYBOARD = 23,
  PLOT_FINAL_PROMPTS = 24,
  STOREFRONT_CONFIG = 30
}

export interface FileWithPreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}
