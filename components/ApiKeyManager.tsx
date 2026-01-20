import React, { useState, useEffect } from 'react';
import { Key, Check, X, Eye, EyeOff } from 'lucide-react';

interface ApiKeyManagerProps {
  onKeySet: (key: string) => void;
}

const API_KEY_STORAGE_KEY = 'gemini_api_key';

export const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ onKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!apiKey.trim()) {
      setError('请输入有效的 API Key');
      return;
    }
    
    if (!apiKey.startsWith('AIza')) {
      setError('API Key 格式不正确，应以 AIza 开头');
      return;
    }

    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    onKeySet(apiKey.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-white/10 p-8 rounded-3xl space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Key size={24} className="text-amber-500" />
          </div>
          <h2 className="text-2xl font-black text-white">输入 API Key</h2>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              placeholder="AIza..."
              className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500/50 pr-10"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs px-2">
              <X size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-all"
        >
          保存
        </button>
      </div>
    </div>
  );
};

export const getStoredApiKey = (): string | null => {
  return localStorage.getItem(API_KEY_STORAGE_KEY);
};

export const clearStoredApiKey = (): void => {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
};

export default ApiKeyManager;
