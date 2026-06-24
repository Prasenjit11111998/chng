import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, selectFiles, uploadAndAddFiles, uploadCompressorFiles, selectCompressorFiles, setTheme } from './store';
import { ToastManager } from './lib/util/toast';
import { m } from './lib/paraglide/messages';
import { DISABLE_ALL_EXTERNAL_REQUESTS, CHNG_NAME } from './lib/util/consts';
import { blinkService } from './lib/util/blinkService';

import FloatingHeader from './components/ui/floating-header';
import Footer from './components/Footer';
import Gradients from './components/Gradients';
import Toasts from './components/Toasts';
import { Dialogs } from './components/Dialogs';
import Logo from './components/Logo';

import UploadView from './components/UploadView';
import ConvertView from './components/ConvertView';
import CompressorView from './components/CompressorView';
import SettingsView from './components/SettingsView';
import AboutView from './components/AboutView';
import { PrivacyView } from './components/PrivacyView';
import { MatrixRain } from './components/ui/matrix-rain';

const StudioLanding = lazy(() => import('./components/studio/StudioLanding'));
const BrandGuidelinesWizard = lazy(() => import('./components/studio/brand-guidelines/BrandGuidelinesWizard'));
const LogoGridTool = lazy(() => import('./components/studio/logo-grid/LogoGridTool'));
const MockupTool = lazy(() => import('./components/studio/mockup-generator/MockupTool'));
const LogoPackTool = lazy(() => import('./components/studio/logo-pack/LogoPackTool'));

import './lib/css/app.scss';

export const App: React.FC = () => {
  const [view, setView] = useState<string>('converter');
  const [dropping, setDropping] = useState<boolean>(false);
  const [isAprilFools, setIsAprilFools] = useState<boolean>(false);
  const [easterEggMessage, setEasterEggMessage] = useState<string | null>(null);

  const dispatch = useDispatch();
  const files = useSelector(selectFiles);
  const compressorFiles = useSelector(selectCompressorFiles);
  const settings = useSelector((state: RootState) => state.settings.settings);
  const effects = useSelector((state: RootState) => state.settings.effects);
  const theme = useSelector((state: RootState) => state.settings.theme);

  // April Fools & Insecure context warnings & Chngd load check
  useEffect(() => {
    document.title = CHNG_NAME;
    console.log(
      `%c\n ██████╗██╗  ██╗███╗   ██╗ ██████╗ \n██╔════╝██║  ██║████╗  ██║██╔════╝ \n██║     ███████║██╔██╗ ██║██║  ███╗\n██║     ██╔══██║██║╚██╗██║██║   ██║\n╚██████╗██║  ██║██║ ╚████║╚██████╔╝\n ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ \n\n%cCHNG%c — Client-Side Retro Image Toolkit.\n%cTry typing the Konami Code: ↑ ↑ ↓ ↓ ← → ← → B A to cycle themes!\n`,
      "color: #00ff00; font-family: monospace; font-weight: bold; background: #000000; padding: 4px;",
      "color: #00ff00; font-weight: bold; font-family: monospace;",
      "color: #888888; font-family: monospace;",
      "color: #ff00ff; font-style: italic; font-family: monospace;"
    );
    // 1. April Fools check (April 1st)
    const now = new Date();
    const aprilFools = now.getDate() === 1 && now.getMonth() === 3;
    setIsAprilFools(aprilFools);

    // 2. Insecure context warning
    if (!window.isSecureContext) {
      console.warn("Insecure context (HTTP) detected, some features may not work as expected.");
      ToastManager.add({
        type: 'warning',
        message: m["toast.insecure_context"](),
        disappearing: false,
      });
    }
  }, [dispatch]);

  // Blinking favicon dot in browser tab
  useEffect(() => {
    const faviconLink = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!faviconLink) return;

    const originalHref = "/favicon.svg";
    const transparentHref = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E";

    const unsubscribe = blinkService.subscribe((visible) => {
      faviconLink.href = visible ? originalHref : transparentHref;
    });

    return () => {
      unsubscribe();
      faviconLink.href = originalHref;
    };
  }, []);

  // Plausible analytics script loading dynamically
  useEffect(() => {
    const pubPlausibleUrl = import.meta.env.VITE_PLAUSIBLE_URL;
    const pubHostname = import.meta.env.VITE_HOSTNAME || "chng.sh";
    const enablePlausible = !!pubPlausibleUrl && settings.plausible && !DISABLE_ALL_EXTERNAL_REQUESTS;

    let scriptEl: HTMLScriptElement | null = null;

    if (enablePlausible) {
      scriptEl = document.createElement("script");
      scriptEl.defer = true;
      scriptEl.setAttribute("data-domain", pubHostname);
      scriptEl.src = `${pubPlausibleUrl}/js/script.js`;
      document.head.appendChild(scriptEl);
    }

    return () => {
      if (scriptEl && document.head.contains(scriptEl)) {
        document.head.removeChild(scriptEl);
      }
    };
  }, [settings.plausible]);

  // Sync HTML class with Redux theme
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark', 'gameboy', 'matrix');
    document.documentElement.classList.add(theme);
  }, [theme]);

  // Konami Code Easter Egg Theme Switcher
  useEffect(() => {
    const konamiCode = [
      'ArrowUp', 'ArrowUp',
      'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight',
      'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    let konamiIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const expectedKey = konamiCode[konamiIndex];

      if (key === expectedKey) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          konamiIndex = 0;

          const themes: ('light' | 'dark' | 'gameboy' | 'matrix')[] = ['light', 'dark', 'gameboy', 'matrix'];
          const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
          const nextTheme = themes[nextIndex];

          dispatch(setTheme(nextTheme));

          // Trigger screen overlay animation
          setEasterEggMessage(nextTheme);
          setTimeout(() => {
            setEasterEggMessage(null);
          }, 1800);

          ToastManager.add({
            type: 'info',
            message: `🎮 RETRO THEME UNLOCKED: ${nextTheme.toUpperCase()} MODE! 🎮`,
          });
        }
      } else {
        konamiIndex = key === 'ArrowUp' ? 1 : 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, theme]);

  // Handle global paste event
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const clipboardData = e.clipboardData;
      if (!clipboardData || !clipboardData.files.length) return;
      e.preventDefault();
      
      if (view === 'compressor') {
        // @ts-expect-error thunk expects FileList
        dispatch(uploadCompressorFiles(clipboardData.files));
      } else {
        dispatch(uploadAndAddFiles(clipboardData.files) as any);
        setView('converter');
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [dispatch, files.length, view]);

  // Global drag-and-drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropping(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      if (view === 'compressor') {
        // @ts-expect-error thunk expects FileList
        dispatch(uploadCompressorFiles(e.dataTransfer.files));
      } else {
        dispatch(uploadAndAddFiles(e.dataTransfer.files) as any);
        setView('converter');
      }
    }
  };

  // Switch between views
  const renderView = () => {
    switch (view) {
      case 'converter':
        if (files.length === 0) {
          return <UploadView onViewChange={setView} activeTab={view} setActiveTab={setView} />;
        }
        return <ConvertView onViewChange={setView} />;
      case 'compressor':
        if (compressorFiles.length === 0) {
          return <UploadView onViewChange={setView} activeTab={view} setActiveTab={setView} />;
        }
        return <CompressorView />;
      case 'settings':
        return <SettingsView />;
      case 'about':
        return <AboutView />;
      case 'privacy':
        return <PrivacyView setView={setView} />;
      default:
        if (files.length === 0) {
          return <UploadView onViewChange={setView} activeTab="converter" setActiveTab={setView} />;
        }
        return <ConvertView onViewChange={setView} />;
    }
  };

  return (
    <Routes>
      {/* ── Studio Routes (full-page, no tool chrome) ── */}
      <Route
        path="/studio"
        element={
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-foreground font-mono text-sm">Loading Studio...</div>}>
            <StudioLanding />
          </Suspense>
        }
      />
      <Route
        path="/studio/brand-guidelines"
        element={
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-foreground font-mono text-sm">Loading Brand Guidelines...</div>}>
            <BrandGuidelinesWizard />
          </Suspense>
        }
      />
      <Route
        path="/studio/logo-grid"
        element={
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-foreground font-mono text-sm">Loading Logo Grid Designer...</div>}>
            <LogoGridTool />
          </Suspense>
        }
      />
      <Route
        path="/studio/mockups"
        element={
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-foreground font-mono text-sm">Loading Mockup Generator...</div>}>
            <MockupTool />
          </Suspense>
        }
      />
      <Route
        path="/studio/logo-pack"
        element={
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-foreground font-mono text-sm">Loading Logo Pack...</div>}>
            <LogoPackTool />
          </Suspense>
        }
      />

      {/* ── Existing Tool Views ── */}
      <Route
        path="*"
        element={
          <div
            className="flex flex-col min-h-screen h-full w-full overflow-x-hidden relative"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {/* Easter Egg style override for April Fools */}
            {isAprilFools && (
              <style dangerouslySetInnerHTML={{ __html: `* { font-family: "Comic Sans MS", "Comic Sans", cursive !important; }` }} />
            )}

            {/* Easter Egg Full Screen CRT Overlay */}
            {easterEggMessage && (
              <div className="crt-overlay">
                <div className="crt-glitch-text">
                  🎮 Retro Mode Unlocked! 🎮
                </div>
                <div className="crt-sub-text">
                  &gt;&gt;&gt; {easterEggMessage} &lt;&lt;&lt;
                </div>
              </div>
            )}

            {/* Drag Zone Blur Overlay */}
            {dropping && (
              <div
                className={`fixed inset-0 w-screen h-screen opacity-40 dark:opacity-20 z-[100] pointer-events-none blur-2xl transition-all duration-300 ${
                  effects ? 'dragoverlay' : 'bg-accent'
                }`}
              />
            )}

            {/* Header / Brand & Navigation */}
            <div className="w-full px-4 pt-4 md:pt-6 flex justify-center">
              <FloatingHeader currentView={view} onViewChange={setView} />
            </div>

            {/* Page Content Area */}
            <div className="flex-grow pb-16 pt-4 md:pt-6 flex flex-col justify-start">
              {renderView()}
            </div>

            {/* Toasts and Dialogs */}
            <Toasts />
            <Dialogs />

            {/* Footer */}
            <div>
              <Footer onViewChange={setView} />
            </div>

            {/* Dynamic Animated background gradients */}
            <Gradients currentView={view} />

            {/* Matrix falling code effect */}
            {theme === 'matrix' && effects && <MatrixRain />}
          </div>
        }
      />
    </Routes>
  );
};

export default App;

