import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, updateSettings, setTheme, setEffects, resetSettings, showDialog } from '../store';
import { SHOW_RETRO_THEMES } from '../store/settingsSlice';
import { ToastManager } from '../lib/util/toast';
import Panel from './Panel';
import FancyInput from './FancyInput';
import FormatDropdown from './FormatDropdown';
import { Button } from './ui/button';
import { categories } from '../lib/converters';
import { m } from '../lib/paraglide/messages';
import { swManager, CacheInfo } from '../lib/util/sw';
import {
  Settings,
  RefreshCw,
  ChevronDown,
  Check,
  X,
  Palette,
  Sun,
  Moon,
  ShieldCheck,
  Trash2,
  Gamepad2,
  Terminal,
  SlidersHorizontal
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { theme, effects: effectsEnabled, settings } = useSelector((state: RootState) => state.settings);
  const dispatch = useDispatch();

  const [clickCount, setClickCount] = useState(0);
  const [retroUnlocked, setRetroUnlocked] = useState(false);

  const handleHeaderClick = () => {
    if (retroUnlocked) return;
    const nextCount = clickCount + 1;
    setClickCount(nextCount);
    if (nextCount >= 5) {
      setRetroUnlocked(true);
      ToastManager.add({
        type: 'success',
        message: '🎮 Retro Themes Unlocked! Game Boy and Matrix modes are now selectable.',
      });
    }
  };

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(false);

  const loadCacheInfo = async () => {
    if (!isLoadingCache) {
      setIsLoadingCache(true);
      try {
        await swManager.init();
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.ready;
        }
        const info = await swManager.getCacheInfo();
        setCacheInfo(info);
      } catch (e) {
        console.error('Failed to load cache info:', e);
      } finally {
        setIsLoadingCache(false);
      }
    }
  };

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const handleClearAllData = () => {
    dispatch(showDialog(
      m['settings.privacy.clear_all_data']?.() || 'Clear All Site Data',
      m['settings.privacy.clear_all_data_confirm'](),
      [
        {
          text: 'Cancel',
          action: () => {}
        },
        {
          text: 'Clear Everything',
          action: () => {
            dispatch(resetSettings());
            swManager.clearCache();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/';
          }
        }
      ],
      'warning'
    ) as any);
  };

  const clearCache = async () => {
    setIsLoadingCache(true);
    try {
      await swManager.clearCache();
      setCacheInfo(null);
      await loadCacheInfo();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCache(false);
    }
  };

  return (
    <div className="flex flex-col h-full items-center max-w-3xl w-full mx-auto px-4 pb-6 md:pb-20">
      <h1 
        onClick={handleHeaderClick}
        className="text-4xl tracking-tight leading-[72px] mb-6 flex items-center gap-2 text-foreground font-bold font-display cursor-pointer select-none active:scale-95 transition-transform duration-100"
        title="Click 5 times for a retro surprise"
      >
        <Settings size={36} className="text-foreground" />
        {m['settings.title']()}
      </h1>

      <div className="w-full flex flex-col gap-4">
        {/* Conversion Settings Panel */}
        <Panel className="p-6 w-full">
          <div className="flex flex-col gap-6 w-full">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <SlidersHorizontal size={32} className="bg-accent p-1.5 rounded-full text-on-accent" />
              {m['settings.conversion.title']()}
            </h2>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <p className="text-base font-bold text-foreground">
                  {m['settings.conversion.filename_format']()}
                </p>
                <p
                  className="text-xs text-muted font-normal leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: m['settings.conversion.filename_description']()
                  }}
                />
              </div>

              <FancyInput
                placeholder="CHNG_%name%"
                value={settings.filenameFormat}
                onChange={(e) => dispatch(updateSettings({ filenameFormat: e }))}
                extension=".ext"
              />
            </div>

            <div className="flex flex-col gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between p-4 text-foreground w-full cursor-pointer"
              >
                <span className="text-sm font-bold">
                  {m['settings.conversion.advanced_settings']()}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${showAdvanced ? 'rotate-180' : 'rotate-0'}`}
                />
              </Button>

              {showAdvanced && (
                <div className="flex flex-col gap-6 pt-2 transition-all duration-300">
                  {/* Default Format */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-foreground">
                        {m['settings.conversion.default_format']()}
                      </p>
                      <p className="text-xs text-muted font-normal">
                        {m['settings.conversion.default_format_description']()}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full">
                      <Button
                        type="button"
                        variant={settings.useDefaultFormat ? 'default' : 'outline'}
                        onClick={() => dispatch(updateSettings({ useDefaultFormat: true }))}
                        className="flex-1"
                      >
                        <Check size={16} className="mr-1" />
                        {m['settings.conversion.default_format_enable']()}
                      </Button>

                      <Button
                        type="button"
                        variant={settings.useDefaultFormat ? 'outline' : 'default'}
                        onClick={() => dispatch(updateSettings({ useDefaultFormat: false }))}
                        className="flex-1"
                      >
                        <X size={16} className="mr-1" />
                        {m['settings.conversion.default_format_disable']()}
                      </Button>
                    </div>

                    <div className={`grid gap-2 grid-cols-1 ${settings.useDefaultFormat ? '' : 'opacity-50 pointer-events-none'}`}>
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted font-semibold">
                          {m['settings.conversion.default_format_image']()}
                        </span>
                        <FormatDropdown
                          categories={{ image: categories.image }}
                          from=".png"
                          selected={settings.defaultFormat.image}
                          onselect={(option) => dispatch(updateSettings({
                            defaultFormat: { ...settings.defaultFormat, image: option }
                          }))}
                          disabled={!settings.useDefaultFormat}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Keep Metadata */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-foreground">
                        {m['settings.conversion.metadata']()}
                      </p>
                      <p className="text-xs text-muted font-normal">
                        {m['settings.conversion.metadata_description']()}
                      </p>
                    </div>

                    <div className="flex gap-2 w-full">
                      <Button
                        type="button"
                        variant={settings.metadata ? 'default' : 'outline'}
                        onClick={() => dispatch(updateSettings({ metadata: true }))}
                        className="flex-1"
                      >
                        <Check size={16} className="mr-1" />
                        {m['settings.conversion.keep']()}
                      </Button>

                      <Button
                        type="button"
                        variant={settings.metadata ? 'outline' : 'default'}
                        onClick={() => dispatch(updateSettings({ metadata: false }))}
                        className="flex-1"
                      >
                        <X size={16} className="mr-1" />
                        {m['settings.conversion.remove']()}
                      </Button>
                    </div>
                  </div>

                  {/* Quality Settings */}
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-bold text-foreground">
                        {m['settings.conversion.quality']()}
                      </p>
                      <p className="text-xs text-muted font-normal">
                        {m['settings.conversion.quality_description']()}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted font-semibold">
                          {m['settings.conversion.quality_images']()}
                        </span>
                        <FancyInput
                          value={String(settings.magickQuality)}
                          onChange={(val) => dispatch(updateSettings({ magickQuality: Math.min(95, Number(val) || 82) }))}
                          type="number"
                          min={1}
                          max={95}
                          extension="%"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* Appearance Settings Panel */}
        <Panel className="p-6 w-full">
          <div className="flex flex-col gap-6 w-full">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <Palette size={32} className="bg-accent p-1.5 rounded-full text-on-accent" />
              {m['settings.appearance.title']()}
            </h2>

            {/* Light / Dark Mode Toggle */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground">
                  {m['settings.appearance.brightness_theme']()}
                </span>
                <span className="text-xs text-muted">
                  {m['settings.appearance.brightness_description']()}
                </span>
              </div>

              <div className={(SHOW_RETRO_THEMES || retroUnlocked) ? "grid grid-cols-2 sm:grid-cols-4 gap-2 w-full" : "grid grid-cols-2 gap-2 w-full"}>
                <Button
                  type="button"
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => dispatch(setTheme('light'))}
                  className="w-full"
                >
                  <Sun size={16} className="mr-1.5" />
                  {m['settings.appearance.light']()}
                </Button>

                <Button
                  type="button"
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => dispatch(setTheme('dark'))}
                  className="w-full"
                >
                  <Moon size={16} className="mr-1.5" />
                  {m['settings.appearance.dark']()}
                </Button>

                {(SHOW_RETRO_THEMES || retroUnlocked) && (
                  <>
                    <Button
                      type="button"
                      variant={theme === 'gameboy' ? 'default' : 'outline'}
                      onClick={() => dispatch(setTheme('gameboy'))}
                      className="w-full"
                    >
                      <Gamepad2 size={16} className="mr-1.5" />
                      Game Boy
                    </Button>

                    <Button
                      type="button"
                      variant={theme === 'matrix' ? 'default' : 'outline'}
                      onClick={() => dispatch(setTheme('matrix'))}
                      className="w-full"
                    >
                      <Terminal size={16} className="mr-1.5" />
                      Matrix
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Animation Toggle */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-foreground">
                  {m['settings.appearance.effect_settings']()}
                </span>
                <span className="text-xs text-muted">
                  {m['settings.appearance.effect_description']()}
                </span>
              </div>

              <div className="flex gap-2 w-full">
                <Button
                  type="button"
                  variant={effectsEnabled ? 'default' : 'outline'}
                  onClick={() => dispatch(setEffects(true))}
                  className="flex-1"
                >
                  <Check size={16} className="mr-1" />
                  {m['settings.appearance.enable']()}
                </Button>

                <Button
                  type="button"
                  variant={effectsEnabled ? 'outline' : 'default'}
                  onClick={() => dispatch(setEffects(false))}
                  className="flex-1"
                >
                  <X size={16} className="mr-1" />
                  {m['settings.appearance.disable']()}
                </Button>
              </div>
            </div>
          </div>
        </Panel>

        {/* Privacy & Site Data Panel */}
        <Panel className="p-6 w-full">
          <div className="flex flex-col gap-6 w-full">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
              <ShieldCheck size={32} className="bg-accent p-1.5 rounded-full text-on-accent" />
              {m['settings.privacy.title']()}
            </h2>

            <div className="flex flex-col gap-5">
              {/* Cache size and info */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-foreground">
                    {m['settings.privacy.cache_title']()}
                  </span>
                  <span className="text-xs text-muted">
                    {m['settings.privacy.cache_description']()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-panel p-3 border border-separator flex flex-col justify-center pixel-box">
                    <span className="text-xs text-muted">
                      {m['settings.privacy.total_size']()}
                    </span>
                    <span className="text-sm font-bold text-foreground mt-0.5">
                      {isLoadingCache ? m['settings.privacy.loading_cache']() : cacheInfo ? swManager.formatSize(cacheInfo.totalSize) : '0 B'}
                    </span>
                  </div>

                  <div className="bg-panel p-3 border border-separator flex flex-col justify-center pixel-box">
                    <span className="text-xs text-muted">
                      {m['settings.privacy.files_cached_label']()}
                    </span>
                    <span className="text-sm font-bold text-foreground mt-0.5">
                      {isLoadingCache ? m['settings.privacy.loading_cache']() : cacheInfo?.fileCount ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadCacheInfo}
                    className="flex-1 text-foreground"
                    disabled={isLoadingCache}
                  >
                    <RefreshCw size={16} className={`mr-1 ${isLoadingCache ? 'animate-spin' : ''}`} />
                    {m['settings.privacy.refresh_cache']()}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={clearCache}
                    className="flex-1 text-foreground"
                    disabled={isLoadingCache}
                  >
                    <Trash2 size={16} className="mr-1" />
                    {m['settings.privacy.clear_cache']()}
                  </Button>
                </div>
              </div>

              <div className="w-full bg-separator h-0.5" />

              {/* Clear Site Data */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-foreground">
                    {m['settings.privacy.site_data_title']()}
                  </span>
                  <span className="text-xs text-muted">
                    {m['settings.privacy.site_data_description']()}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearAllData}
                  className="w-full text-foreground"
                >
                  <Trash2 size={16} className="mr-1" />
                  {m['settings.privacy.clear_all_data']()}
                </Button>
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default SettingsView;