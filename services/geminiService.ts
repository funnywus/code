
import { GoogleGenAI, Type } from "@google/genai";
import { ShotStructure, RemappedShot, AmazonImageConfig, PlotCharacter, PlotStyle, ImageModel, CharacterCostume, PlotEnvironment } from "../types";

export const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      if (!result) return reject(new Error("文件读取失败"));
      const base64String = result.split(',')[1];
      resolve({ inlineData: { data: base64String, mimeType: file.type || 'image/png' } });
    };
    reader.readAsDataURL(file);
  });
};

export const urlToBase64Part = async (url: string): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64String = result.split(',')[1];
      resolve({ inlineData: { data: base64String, mimeType: blob.type } });
    };
    reader.readAsDataURL(blob);
  });
};

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

const STYLE_PROMPTS: Record<PlotStyle, string> = {
  [PlotStyle.ANIME]: "2D high-quality anime cel shaded style, vibrant colors, clean lines, Japanese manga aesthetic, hand-drawn look.",
  [PlotStyle.REALISTIC]: "Highly photorealistic cinematic live-action photography, 8k RAW photo, masterwork, detailed skin textures, realistic human features, cinematic lighting.",
  [PlotStyle.CYBERPUNK]: "Cyberpunk aesthetic, neon lighting, futuristic tech accessories, high contrast, vibrant purples and cyans.",
  [PlotStyle.PIXAR]: "3D animated feature film style, Pixar/Disney aesthetic, soft rounded features, stylized textures, CGI animation look.",
  [PlotStyle.SKETCH]: "Hand-drawn concept art sketch, charcoal and pencil, artistic lines, monochromatic.",
  [PlotStyle.INK]: "Traditional Chinese ink wash painting, Shan Shui style, expressive black ink brushwork.",
  [PlotStyle.REALISTIC_INK_FUSION]: "Fusion of high-fidelity 3D realistic cinematic rendering and expressive traditional ink wash particles.",
  [PlotStyle.CHINESE]: "Modern Chinese aesthetic (Guofeng), grand cinematic photography, silk textures, elegant vermilion and gold palette.",
  [PlotStyle.CHINESE_3D_ANIME]: "High-end Chinese 3D animation rendering style (Xianxia/Xuanhuan), masterwork CGI, Unreal Engine 5 look."
};

export const analyzeProductVisuals = async (files: File[]): Promise<string> => {
  const ai = getAI();
  const parts = await Promise.all(files.map(f => fileToPart(f)));
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [...parts, { text: "Analyze the product DNA with extreme precision. Identify the EXACT shape, color hex codes (if possible), logo placement, texture, and mechanical/physical details. This metadata will be used for pixel-perfect reproduction. Provide a summary emphasizing 'Do not alter these features'." }] }]
  });
  return response.text || "";
};

export const analyzeVideoStructure = async (file: File): Promise<ShotStructure[]> => {
  const ai = getAI();
  const videoPart = await fileToPart(file);
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        timestamp: { type: Type.STRING },
        shotType: { type: Type.STRING },
        cameraMovement: { type: Type.STRING },
        lighting: { type: Type.STRING },
        pacing: { type: Type.STRING },
        subjectAction: { type: Type.STRING }
      },
      required: ["timestamp", "shotType", "cameraMovement", "lighting", "subjectAction"]
    }
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [videoPart, { text: "Analyze this reference video's cinematography only. Deconstruct the lighting, camera path, and framing for each shot. Output JSON." }] }],
    config: { responseMimeType: "application/json", responseSchema: schema }
  });
  return JSON.parse(response.text || "[]");
};

export const remapPrompts = async (productToken: string, structure: ShotStructure[]): Promise<{ prompts: string[] }> => {
  const ai = getAI();
  const schema = {
    type: Type.OBJECT,
    properties: {
      prompts: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["prompts"]
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `STRICT TASK: Create image generation prompts. 
    PRODUCT DNA: ${productToken}
    CINEMATIC STRUCTURE: ${JSON.stringify(structure)}
    RULE: The product must be IDENTICAL to the description. Do not add, remove, or modify any physical features. The product is the anchor. Focus on place the EXACT product into the specific lighting and camera angles described. Output JSON.`,
    config: { responseMimeType: "application/json", responseSchema: schema }
  });
  return JSON.parse(response.text || '{"prompts":[]}');
};

export const generateStoryboardFrame = async (
  promptText: string, 
  referenceFile: File | null, 
  model: ImageModel = 'gemini-3-pro-image-preview', 
  imageSize: "1K" | "2K" | "4K" = "1K", 
  plotCharacters?: PlotCharacter[], 
  previousFrameUrl?: string,
  environmentUrl?: string
): Promise<string> => {
  const ai = getAI();
  let style = ""; 
  if (plotCharacters && plotCharacters.length > 0 && plotCharacters[0].style) {
    style = STYLE_PROMPTS[plotCharacters[0].style] || "";
  }
  
  const parts: any[] = [
    { text: `STRICT PRODUCT FIDELITY MODE: 
    1. Look at the attached REFERENCE IMAGE of the product very carefully.
    2. The product in the final render MUST be an exact physical copy of the reference. 
    3. DO NOT change the color, logo, buttons, textures, or shape of the product.
    4. RENDER THIS SCENE: ${promptText}.
    5. STYLE: ${style || 'Photorealistic commercial photography'}.
    6. Ensure the product is the central focus, maintaining 100% brand consistency.` }
  ];
  
  if (referenceFile) {
    parts.push(await fileToPart(referenceFile));
  }

  if (environmentUrl) {
    const envPart = await urlToBase64Part(environmentUrl);
    parts.push({ text: "BACKGROUND ENVIRONMENT ANCHOR:" }, envPart);
  }

  if (previousFrameUrl && previousFrameUrl.startsWith('data:image')) {
    const base64Data = previousFrameUrl.split(',')[1];
    const mimeType = previousFrameUrl.split(';')[0].split(':')[1] || 'image/png';
    parts.push({ text: "CONTINUITY PREVIOUS FRAME:" }, { inlineData: { data: base64Data, mimeType } });
  }

  if (plotCharacters) {
    for (const char of plotCharacters) {
      const refUrl = char.outfittedUrl || char.turnaroundUrl;
      if (refUrl) {
        const charPart = await urlToBase64Part(refUrl);
        parts.push({ text: `CHARACTER IDENTITY [Name: ${char.name}]:` }, charPart);
      }
    }
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts }],
    config: { imageConfig: { aspectRatio: "16:9", imageSize } }
  });

  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  if (part?.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  throw new Error("No image generated");
};

export const editStoryboardFrame = async (imageUrl: string, instruction: string, resolution: "1K" | "2K" | "4K", maskData?: string): Promise<string> => {
  const ai = getAI();
  const imagePart = await urlToBase64Part(imageUrl);
  const parts: any[] = [imagePart, { text: `Edit this image based on: ${instruction}. MANDATORY: Do not alter the core product appearance, only edit surroundings or lighting.` }];
  if (maskData) {
    const maskBase64 = maskData.split(',')[1];
    parts.push({ inlineData: { data: maskBase64, mimeType: "image/png" }, text: "Use this mask for local editing (white areas)." });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts }],
    config: { imageConfig: { imageSize: resolution, aspectRatio: "16:9" } }
  });

  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};

export const brainstormCreativeShots = async (productToken: string, requirement: string): Promise<ShotStructure[]> => {
  const ai = getAI();
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        timestamp: { type: Type.STRING },
        shotType: { type: Type.STRING },
        cameraMovement: { type: Type.STRING },
        lighting: { type: Type.STRING },
        pacing: { type: Type.STRING },
        subjectAction: { type: Type.STRING }
      },
      required: ["timestamp", "shotType", "cameraMovement", "lighting", "subjectAction"]
    }
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a Creative Director. Create a high-end commercial script for product: ${productToken}. Brief: ${requirement}. Focus on showcasing the product's ORIGINAL features. JSON output.`,
    config: { responseMimeType: "application/json", responseSchema: schema }
  });
  return JSON.parse(response.text || "[]");
};

export const generateAmazonImage = async (prompt: string, refFile: File, size: string, resolution: "1K" | "2K" | "4K", aspectRatio: "1:1" | "16:9" | "9:16" | "4:3" | "3:4" = "1:1"): Promise<string> => {
  const ai = getAI();
  const refPart = await fileToPart(refFile);
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts: [refPart, { text: `ULTRA-HIGH FIDELITY AMAZON RENDER: Use the attached product photo. The product in the render must be a PERFECT match. No variations. Place it in: ${prompt}.` }] }],
    config: { imageConfig: { imageSize: resolution, aspectRatio } }
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};

export const editAmazonImage = async (imageUrl: string, instruction: string, size: string, resolution: "1K" | "2K" | "4K", refFile?: File | null, maskData?: string): Promise<string> => {
  const ai = getAI();
  const imagePart = await urlToBase64Part(imageUrl);
  const parts: any[] = [imagePart, { text: `Edit Amazon asset: ${instruction}. Keep original product design intact.` }];
  if (refFile) parts.push(await fileToPart(refFile));
  if (maskData) {
    const maskBase64 = maskData.split(',')[1];
    parts.push({ inlineData: { data: maskBase64, mimeType: "image/png" }, text: "Apply local changes in white mask areas." });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts }],
    config: { imageConfig: { imageSize: resolution } }
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};

export const analyzeAmazonRequirements = async (productToken: string, configs: AmazonImageConfig[], context: any): Promise<{ id: string, prompt: string, finalPrompt: string }[]> => {
  const ai = getAI();
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        prompt: { type: Type.STRING },
        finalPrompt: { type: Type.STRING }
      },
      required: ["id", "prompt", "finalPrompt"]
    }
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate Amazon listing visual strategy. Product DNA: ${productToken}. Focus on high conversion while strictly adhering to the product's physical identity. Slots: ${JSON.stringify(configs.map(c => ({ id: c.id, type: c.type, size: c.size })))}. Context: ${JSON.stringify(context)}.`,
    config: { responseMimeType: "application/json", responseSchema: schema }
  });
  return JSON.parse(response.text || "[]");
};

export const generateCharacterFromDescription = async (description: string, style: PlotStyle): Promise<string> => {
  const ai = getAI();
  const stylePrompt = STYLE_PROMPTS[style];
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts: [{ text: `CHARACTER MODEL SHEET: ${description}. Style: ${stylePrompt}. Consistent identity.` }] }],
    config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};

export const generateTurnaroundImage = async (char: PlotCharacter, model: ImageModel): Promise<string> => {
  const ai = getAI();
  const stylePrompt = char.style ? STYLE_PROMPTS[char.style] : "";
  const parts: any[] = [{ text: `Generate a character turnaround sheet for ${char.name}. Identity description: ${char.token}. Style: ${stylePrompt}.` }];
  if (char.turnaroundUrl) parts.push(await urlToBase64Part(char.turnaroundUrl));
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts }],
    config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } }
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};

export const extendNarrativeArc = async (characters: PlotCharacter[], proposal: any): Promise<{ narrativeArc: string }> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Extend story. Current: ${proposal.narrativeArc}. Characters: ${characters.map(c => c.name).join(', ')}.`,
    config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { narrativeArc: { type: Type.STRING } }, required: ["narrativeArc"] } }
  });
  return JSON.parse(response.text || '{"narrativeArc": ""}');
};

export const extendFilmPlot = async (characters: PlotCharacter[], proposal: any, existingShots: RemappedShot[]): Promise<RemappedShot[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Continue script. Existing: ${existingShots.length}. Plot: ${proposal.narrativeArc}.`,
    config: { responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 4096 } }
  });
  return JSON.parse(response.text || "[]");
};

export const suggestCharacterCostumes = async (char: PlotCharacter, proposal: any, styleHint?: string): Promise<CharacterCostume[]> => {
  const ai = getAI();
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        name: { type: Type.STRING },
        description: { type: Type.STRING },
        style: { type: Type.STRING }
      },
      required: ["id", "name", "description", "style"]
    }
  };
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Suggest 4 costumes for ${char.name} in ${proposal.filmTitle}. Hint: ${styleHint}.`,
    config: { responseMimeType: "application/json", responseSchema: schema }
  });
  return JSON.parse(response.text || "[]");
};

export const generateOutfittedCharacter = async (char: PlotCharacter, model: ImageModel): Promise<string> => {
  const ai = getAI();
  const baseImg = await urlToBase64Part(char.turnaroundUrl || "");
  const stylePrompt = char.style ? STYLE_PROMPTS[char.style] : "";
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: [{ parts: [baseImg, { text: `Apply outfit: ${char.selectedCostume?.name}. Style: ${stylePrompt}. STICK TO ORIGINAL FACE.` }] }],
    config: { imageConfig: { aspectRatio: "1:1", imageSize: "1K" } }
  });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};

export const generateVideoPrompts = async (shots: RemappedShot[], productToken: string): Promise<string[]> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Act as a Senior AI Video Director. Create high-end video generation prompts for a product commercial.
    PRODUCT DNA: ${productToken}
    STORYBOARD SHOTS: ${JSON.stringify(shots.map(s => ({ subjectAction: s.subjectAction, camera: s.cameraMovement, lighting: s.lighting })))}
    
    TASK: For each shot, output a detailed, high-quality video prompt optimized for Sora or Veo. 
    Focus on dynamic motion, physics, lighting, and maintaining the EXACT product features.
    
    Output a JSON array of strings, where each string is the prompt for the corresponding shot.`,
    config: { 
      responseMimeType: "application/json", 
      responseSchema: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING } 
      } 
    }
  });
  return JSON.parse(response.text || "[]");
};

export const brainstormFilmPlot = async (characters: PlotCharacter[], proposal: any): Promise<RemappedShot[]> => {
  const ai = getAI();
  const prompt = `Act as a Cinematic Director. Create a shot-by-shot storyboard for: "${proposal.narrativeArc}".
  MANDATORY RULES:
  1. Each logical SCENE must have exactly 5 frames.
  2. Output a JSON array of shots.`;
  
  const schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sceneId: { type: Type.STRING },
        sceneTitle: { type: Type.STRING },
        shotType: { type: Type.STRING },
        cameraMovement: { type: Type.STRING },
        lighting: { type: Type.STRING },
        subjectAction: { type: Type.STRING },
        dialogue: { type: Type.STRING },
        dialogueType: { type: Type.STRING, enum: ['VO', 'CHARACTER'] },
        timestamp: { type: Type.STRING }
      },
      required: ["sceneId", "sceneTitle", "shotType", "cameraMovement", "lighting", "subjectAction", "dialogue", "dialogueType"]
    }
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: { responseMimeType: "application/json", responseSchema: schema, thinkingConfig: { thinkingBudget: 8192 } }
  });
  return JSON.parse(response.text || "[]");
};

export const proposePlotStrategy = async (characters: PlotCharacter[], requirement: string): Promise<any> => {
  const ai = getAI();
  const prompt = `Propose a film strategy. Brief: ${requirement}. JSON output.`;
  const schema = {
    type: Type.OBJECT,
    properties: {
      filmTitle: { type: Type.STRING },
      directorConcept: { type: Type.STRING },
      narrativeArc: { type: Type.STRING },
      visualTheme: { type: Type.STRING },
      environments: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            name: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["id", "name", "description"]
        }
      },
      keyStyleKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["filmTitle", "directorConcept", "narrativeArc", "visualTheme", "environments", "keyStyleKeywords"]
  };
  const response = await ai.models.generateContent({ model: "gemini-3-pro-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: schema } });
  return JSON.parse(response.text || "{}");
};

export const generateEnvironmentImage = async (env: PlotEnvironment, style: PlotStyle, model: ImageModel): Promise<string> => {
  const ai = getAI();
  const stylePrompt = STYLE_PROMPTS[style] || "";
  const prompt = `ENVIRONMENT RENDER: ${env.name}. Style: ${stylePrompt}. Masterwork atmospheric lighting.`;
  const response = await ai.models.generateContent({ model, contents: [{ parts: [{ text: prompt }] }], config: { imageConfig: { aspectRatio: "16:9", imageSize: "1K" } } });
  const part = response.candidates?.[0].content.parts.find(p => p.inlineData);
  return part?.inlineData ? `data:${part.inlineData.mimeType};base64,${part.inlineData.data}` : "";
};

export const generatePlotVideoPrompts = async (shots: RemappedShot[], plotCharacters: PlotCharacter[]): Promise<{ startShotId: string, endShotId: string, prompt: string }[]> => {
  const ai = getAI();
  const charContext = plotCharacters.map(c => `${c.name}: ${c.token}`).join('. ');
  
  const prompt = `Video transitions. Sequence: ${JSON.stringify(shots.map(s => ({ id: s.id, action: s.subjectAction })))}. Character: ${charContext}. ENSURE PRODUCT CONSISTENCY.`;

  const response = await ai.models.generateContent({ 
    model: "gemini-3-pro-preview", 
    contents: prompt, 
    config: { 
      responseMimeType: "application/json", 
      thinkingConfig: { thinkingBudget: 4096 } 
    } 
  });
  
  try {
    const data = JSON.parse(response.text || '{"results":[]}');
    return data.results || [];
  } catch (e) {
    return [];
  }
};
