import React from 'react';
import { useNavigate } from 'react-router-dom';
import ToolCard from './ToolCard';
import Logo from '../Logo';

const STUDIO_TOOLS = [
  {
    id: 'brand-guidelines',
    name: 'Brand Guidelines',
    description: 'Create professional PDFs from logos, colors, and typography.',
    status: 'available' as const,
    route: '/studio/brand-guidelines',
  },
  {
    id: 'logo-grid',
    name: 'Logo Grid Designer',
    description: 'Build professional logo construction grids with golden ratio, Fibonacci spiral, clearspace zones, and export to PNG or SVG.',
    status: 'available' as const,
    route: '/studio/logo-grid',
  },
  {
    id: 'mockup-generator',
    name: 'Mockup Generator',
    description: 'Instantly frame your screenshots in premium Apple devices and Safari browsers with cinematic lighting and mesh gradients.',
    status: 'available' as const,
    route: '/studio/mockups',
  },
  {
    id: 'logo-export',
    name: 'Logo Pack',
    description: 'Export all formats in one click.',
    status: 'coming-soon' as const,
  },
  {
    id: 'presentation',
    name: 'Presentations',
    description: 'Build slide templates in seconds.',
    status: 'coming-soon' as const,
  },
];

const StudioLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col font-body">
      {/* ── Floating Header ── */}
      <div className="p-6 md:p-8 flex items-center gap-4">
        <button
          className="bg-accent text-on-accent border-none px-5 py-2 cursor-pointer flex flex-shrink-0 items-center justify-center gap-2 hover:opacity-90 pixel-btn"
          onClick={() => navigate('/')}
          aria-label="Go back"
        >
          <Logo className="text-3xl lg:text-4xl font-black" />
        </button>
      </div>

      {/* ── Hero ── */}
      <header className="px-6 md:px-8 pt-12 pb-10 max-w-5xl mx-auto w-full">
        <p className="font-mono text-xs uppercase tracking-[0.1em] text-muted mb-4">Chng</p>
        <h1 className="text-5xl md:text-7xl font-display text-foreground mb-4 font-['Geist_Pixel_Circle']">
          Studio<span className="text-accent">.</span>
        </h1>
        <p className="text-lg text-muted max-w-md">
          Professional tools for designers, agencies, and brand creators.
        </p>
      </header>

      {/* ── Tools Grid ── */}
      <main className="flex-1 px-6 md:px-8 pb-20 max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STUDIO_TOOLS.map((tool) => (
          <ToolCard
            key={tool.id}
            name={tool.name}
            description={tool.description}
            status={tool.status}
            route={tool.route}
          />
        ))}
      </main>

      {/* ── Footer ── */}
      <footer className="p-6 md:p-8 border-t border-separator flex items-center gap-4 font-mono text-xs text-muted max-w-5xl mx-auto w-full">
        <span>Chng Studio</span>
        <span className="text-separator">·</span>
        <span>Client-side. No uploads.</span>
      </footer>
    </div>
  );
};

export default StudioLanding;
