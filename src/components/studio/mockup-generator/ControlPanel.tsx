import React from 'react';
import type { MockupState, BgFitMode } from './types';
import { DEVICES, PALETTES } from './mockupDrawing';

interface ControlPanelProps {
  state: MockupState;
  onChange: <K extends keyof MockupState>(k: K, v: MockupState[K]) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ state, onChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onChange('screenshotSrc', url);
    onChange('screenshotFileName', file.name);
    e.target.value = '';
  };

  const handleRemoveScreenshot = () => {
    if (state.screenshotSrc) URL.revokeObjectURL(state.screenshotSrc);
    onChange('screenshotSrc', null);
    onChange('screenshotFileName', '');
  };

  const handleCustomBgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    onChange('customBgSrc', url);
    onChange('customBgFileName', file.name);
    // Unset palette so we know to use custom bg
    onChange('backgroundPaletteId', 'custom');
    e.target.value = '';
  };

  const handleRemoveCustomBg = () => {
    if (state.customBgSrc) URL.revokeObjectURL(state.customBgSrc);
    onChange('customBgSrc', null);
    onChange('customBgFileName', '');
    onChange('backgroundPaletteId', 'studio-sand');
  };

  return (
    <div className="lg-controls">
      {/* ── IMAGE UPLOAD ── */}
      <section className="lg-controls__section">
        <h2 className="lg-controls__heading">Your Design</h2>
        <div className="lg-upload-area">
          {!state.screenshotSrc ? (
            <label className="lg-upload-label" style={{ cursor: 'pointer', textAlign: 'center' }}>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <div className="text-foreground text-sm font-medium mb-1">Upload Screenshot</div>
              <div className="text-muted text-xs">PNG, JPG, or WebP</div>
            </label>
          ) : (
            <div className="lg-upload-active">
              <img src={state.screenshotSrc} alt="Preview" className="w-12 h-12 object-cover rounded shadow-sm" />
              <div className="flex-1 min-w-0">
                <div className="text-foreground text-sm truncate">{state.screenshotFileName}</div>
                <button
                  className="text-muted text-xs hover:text-foreground transition-colors p-0 bg-transparent border-none cursor-pointer mt-1"
                  onClick={handleRemoveScreenshot}
                >
                  ✕ Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── DEVICE SELECTOR ── */}
      <section className="lg-controls__section">
        <h2 className="lg-controls__heading">Presentation Device</h2>
        <div className="flex flex-col gap-2">
          {Object.values(DEVICES).map(device => (
            <button
              key={device.id}
              className={`text-left px-3 py-2 rounded text-sm font-medium transition-colors border ${
                state.selectedDeviceId === device.id 
                  ? 'bg-foreground text-background border-foreground' 
                  : 'bg-transparent text-foreground border-separator hover:border-muted'
              }`}
              onClick={() => onChange('selectedDeviceId', device.id)}
            >
              {device.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── BACKGROUNDS ── */}
      <section className="lg-controls__section">
        <h2 className="lg-controls__heading">Background</h2>
        <div className="flex flex-col gap-3">
          
          {/* Custom Image Upload */}
          <div className="lg-upload-area">
            {!state.customBgSrc ? (
              <label className="lg-upload-label" style={{ cursor: 'pointer', textAlign: 'center', padding: '16px' }}>
                <input type="file" accept="image/*" className="hidden" onChange={handleCustomBgChange} />
                <div className="text-foreground text-sm font-medium mb-1">Custom Background Photo</div>
                <div className="text-muted text-xs">JPG, PNG, or WebP</div>
              </label>
            ) : (
              <div className="lg-upload-active">
                <img src={state.customBgSrc} alt="Preview" className="w-12 h-12 object-cover rounded shadow-sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-foreground text-sm truncate">{state.customBgFileName}</div>
                  <button
                    className="text-muted text-xs hover:text-foreground transition-colors p-0 bg-transparent border-none cursor-pointer mt-1"
                    onClick={handleRemoveCustomBg}
                  >
                    ✕ Remove Image
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fit Mode for Custom Bg */}
          {state.customBgSrc && (
            <div className="flex bg-bg3 p-1 rounded-lg border border-border2">
              {['cover', 'contain', 'tile'].map((mode) => (
                <button
                  key={mode}
                  className={`flex-1 text-[11px] font-medium uppercase tracking-wider py-1.5 rounded transition-all ${
                    state.customBgFitMode === mode ? 'bg-bg text-foreground shadow-sm' : 'text-muted hover:text-foreground'
                  }`}
                  onClick={() => onChange('customBgFitMode', mode as BgFitMode)}
                >
                  {mode}
                </button>
              ))}
            </div>
          )}

          <div className="text-[10px] uppercase font-bold text-muted tracking-widest mt-2">Editorial Meshes</div>
          
          {/* Editorial Mesh Grids */}
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(PALETTES).map(paletteId => {
              const p = PALETTES[paletteId];
              return (
                <button
                  key={paletteId}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded transition-colors border ${
                    state.backgroundPaletteId === paletteId && !state.customBgSrc
                      ? 'bg-foreground text-background border-foreground' 
                      : 'bg-transparent text-muted border-separator hover:text-foreground'
                  }`}
                  onClick={() => {
                    onChange('backgroundPaletteId', paletteId);
                    if (state.customBgSrc) {
                      handleRemoveCustomBg(); // Clear custom image if switching to mesh
                    }
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full border border-black/10"
                    style={{ background: p.colors[0] === 'transparent' ? '#ccc' : p.colors[0] }} 
                  />
                  <span className="text-xs">{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── DETAILS ── */}
      <section className="lg-controls__section">
        <h2 className="lg-controls__heading">Details</h2>
        <div className="flex flex-col gap-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-muted hover:text-foreground transition-colors">Screen Glare</span>
            <input 
              type="checkbox" 
              checked={state.showGlare} 
              onChange={e => onChange('showGlare', e.target.checked)}
              className="accent-foreground w-4 h-4"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-muted hover:text-foreground transition-colors">Ambient Shadows</span>
            <input 
              type="checkbox" 
              checked={state.showShadows} 
              onChange={e => onChange('showShadows', e.target.checked)}
              className="accent-foreground w-4 h-4"
            />
          </label>
        </div>
      </section>
    </div>
  );
};
