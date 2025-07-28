import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';

interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  isIncognito?: boolean;
}

export default function Index() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', title: 'Новая вкладка', url: 'about:blank', isActive: true }
  ]);
  
  const [urlInput, setUrlInput] = useState('');
  const [isVpnActive, setIsVpnActive] = useState(false);
  const [isIncognitoMode, setIsIncognitoMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const mockSuggestions = [
    'поехали.dev - создание сайтов',
    'poehali.dev документация', 
    'поиск в Google',
    'YouTube - видео',
    'GitHub - репозитории'
  ];

  const handleUrlChange = (value: string) => {
    setUrlInput(value);
    if (value.length > 2) {
      const filtered = mockSuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setSearchSuggestions(filtered.slice(0, 5));
    } else {
      setSearchSuggestions([]);
    }
  };

  const navigateToUrl = (url?: string) => {
    const targetUrl = url || urlInput;
    if (!targetUrl) return;
    
    let finalUrl = targetUrl;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      if (targetUrl.includes(' ') || !targetUrl.includes('.')) {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
      } else {
        finalUrl = `https://${targetUrl}`;
      }
    }
    
    const activeTab = tabs.find(tab => tab.isActive);
    if (activeTab) {
      setTabs(tabs.map(tab => 
        tab.id === activeTab.id 
          ? { ...tab, url: finalUrl, title: getDomainFromUrl(finalUrl) }
          : tab
      ));
    }
    setSearchSuggestions([]);
  };

  const getDomainFromUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return 'Новая страница';
    }
  };

  const addNewTab = () => {
    const newTab: Tab = {
      id: Date.now().toString(),
      title: 'Новая вкладка',
      url: 'about:blank',
      isActive: false,
      isIncognito: isIncognitoMode
    };
    
    setTabs([
      ...tabs.map(tab => ({ ...tab, isActive: false })),
      { ...newTab, isActive: true }
    ]);
    setUrlInput('');
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    const closedTabWasActive = tabs.find(tab => tab.id === tabId)?.isActive;
    
    if (closedTabWasActive && updatedTabs.length > 0) {
      updatedTabs[0].isActive = true;
    }
    
    setTabs(updatedTabs);
  };

  const switchTab = (tabId: string) => {
    setTabs(tabs.map(tab => ({
      ...tab,
      isActive: tab.id === tabId
    })));
  };

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Голосовой поиск не поддерживается в этом браузере');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUrlInput(transcript);
      setIsListening(false);
      setTimeout(() => navigateToUrl(transcript), 500);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const activeTab = tabs.find(tab => tab.isActive);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Панель вкладок */}
      <div className="flex items-center gap-1 px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="flex gap-1 flex-1 max-w-4xl">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={`
                group flex items-center gap-2 px-4 py-2 rounded-t-lg cursor-pointer
                transition-all duration-200 min-w-[180px] max-w-[250px]
                ${tab.isActive 
                  ? 'bg-white shadow-sm border-l border-r border-t border-slate-200' 
                  : 'bg-slate-100/50 hover:bg-slate-100'
                }
                ${tab.isIncognito ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white' : ''}
              `}
              onClick={() => switchTab(tab.id)}
            >
              {tab.isIncognito && <Icon name="EyeOff" size={14} />}
              <span className="text-sm font-medium truncate flex-1">
                {tab.title}
              </span>
              {tabs.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 hover:bg-slate-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <Icon name="X" size={12} />
                </Button>
              )}
            </div>
          ))}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={addNewTab}
            className="h-8 w-8 p-0 rounded-full hover:bg-slate-200"
          >
            <Icon name="Plus" size={16} />
          </Button>
        </div>

        {/* Индикаторы режимов */}
        <div className="flex items-center gap-3">
          {isVpnActive && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
              <Icon name="Shield" size={12} className="mr-1" />
              VPN
            </Badge>
          )}
          
          {isIncognitoMode && (
            <Badge variant="secondary" className="bg-slate-700 text-white">
              <Icon name="EyeOff" size={12} className="mr-1" />
              Инкогнито
            </Badge>
          )}
        </div>
      </div>

      {/* Панель навигации */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-sm border-b border-slate-200">
        {/* Кнопки навигации */}
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Icon name="ChevronLeft" size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Icon name="ChevronRight" size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Icon name="RotateCcw" size={16} />
          </Button>
        </div>

        {/* Адресная строка */}
        <div className="flex-1 relative max-w-4xl">
          <div className="relative">
            <Input
              ref={inputRef}
              value={urlInput}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && navigateToUrl()}
              placeholder="Поиск или введите URL..."
              className="pl-10 pr-20 h-11 bg-slate-100/80 border-slate-200 rounded-full focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
            />
            
            <Icon 
              name="Search" 
              size={16} 
              className="absolute left-3 top-3.5 text-slate-500" 
            />
            
            <div className="absolute right-2 top-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={startVoiceSearch}
                className={`h-7 w-7 p-0 rounded-full ${isListening ? 'bg-red-100 text-red-600' : ''}`}
              >
                <Icon name="Mic" size={14} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateToUrl()}
                className="h-7 w-7 p-0 rounded-full"
              >
                <Icon name="ArrowRight" size={14} />
              </Button>
            </div>
          </div>

          {/* Подсказки поиска */}
          {searchSuggestions.length > 0 && (
            <Card className="absolute top-full mt-2 w-full z-50 p-2 bg-white/95 backdrop-blur-sm border shadow-lg">
              {searchSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => {
                    setUrlInput(suggestion);
                    navigateToUrl(suggestion);
                  }}
                >
                  <Icon name="Search" size={14} className="text-slate-400" />
                  <span className="text-sm">{suggestion}</span>
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Панель управления */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <Icon name="Shield" size={14} className={isVpnActive ? 'text-green-600' : 'text-slate-400'} />
            <span className="text-xs font-medium">VPN</span>
            <Switch
              checked={isVpnActive}
              onCheckedChange={setIsVpnActive}
              className="scale-75"
            />
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
            <Icon name="EyeOff" size={14} className={isIncognitoMode ? 'text-slate-700' : 'text-slate-400'} />
            <span className="text-xs font-medium">Инкогнито</span>
            <Switch
              checked={isIncognitoMode}
              onCheckedChange={setIsIncognitoMode}
              className="scale-75"
            />
          </div>

          <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
            <Icon name="MoreVertical" size={16} />
          </Button>
        </div>
      </div>

      {/* Область контента */}
      <div className="flex-1 p-4">
        <Card className="h-full bg-white shadow-sm border-slate-200 overflow-hidden">
          {activeTab?.url === 'about:blank' ? (
            <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="text-center space-y-6 max-w-md">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Добро пожаловать!
                  </h1>
                  <p className="text-slate-600">
                    Введите URL или выполните поиск в адресной строке выше
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 w-full">
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-2 bg-white/50 hover:bg-white/80"
                    onClick={() => navigateToUrl('poehali.dev')}
                  >
                    <Icon name="Rocket" size={20} />
                    <span className="text-sm">poehali.dev</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-2 bg-white/50 hover:bg-white/80"
                    onClick={() => navigateToUrl('google.com')}
                  >
                    <Icon name="Search" size={20} />
                    <span className="text-sm">Google</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-2 bg-white/50 hover:bg-white/80"
                    onClick={() => navigateToUrl('youtube.com')}
                  >
                    <Icon name="Play" size={20} />
                    <span className="text-sm">YouTube</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-16 flex-col gap-2 bg-white/50 hover:bg-white/80"
                    onClick={() => navigateToUrl('github.com')}
                  >
                    <Icon name="Github" size={20} />
                    <span className="text-sm">GitHub</span>
                  </Button>
                </div>

                {isListening && (
                  <div className="flex items-center justify-center gap-2 text-red-600">
                    <div className="animate-pulse bg-red-600 rounded-full h-2 w-2"></div>
                    <span className="text-sm font-medium">Слушаю...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-50">
              <div className="text-center space-y-4">
                <Icon name="Globe" size={48} className="text-slate-400 mx-auto" />
                <div>
                  <h3 className="font-semibold text-slate-700">Загружается</h3>
                  <p className="text-sm text-slate-500">{activeTab?.url}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}