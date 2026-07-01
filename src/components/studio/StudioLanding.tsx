import React from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingHeader from '../ui/floating-header';
import ToolCard from './ToolCard';

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
    description: 'Generate a production-ready ZIP with every logo format your project needs: favicons, PWA icons, OG images, SVG variants, and manifest files.',
    status: 'available' as const,
    route: '/studio/logo-pack',
  },
  {
    id: 'sticker-maker',
    name: 'Sticker Maker',
    description: 'Upload images or paste Pinterest links to automatically extract subjects and download transparent stickers.',
    status: 'available' as const,
    route: '/studio/sticker-maker',
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
      {/* ── Shared Floating Header ── */}
      <div className="w-full px-4 pt-4 md:pt-6 flex justify-center">
        <FloatingHeader />
      </div>

      {/* ── Hero ── */}
      <header className="px-6 md:px-8 pt-10 pb-6 max-w-5xl mx-auto w-full text-left flex flex-col">
        <h1 className="text-5xl md:text-7xl font-display font-black text-foreground mb-3 leading-tight tracking-tight">
          Studio<span className="text-accent">.</span>
        </h1>
        <p className="text-base text-muted max-w-xl font-normal">
          Professional tools for designers, agencies, and brand creators.
        </p>
      </header>

      {/* ── Tools Grid ── */}
      <main className="flex-1 px-6 md:px-8 pb-24 max-w-5xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <footer className="px-6 md:px-8 py-5 border-t border-separator flex items-center gap-3 font-mono text-xs text-muted max-w-5xl mx-auto w-full">
        <span>Chng Studio</span>
        <span className="text-separator">·</span>
        <span>Client-side. No uploads.</span>
      </footer>
    </div>
  );
};

export default StudioLanding;
