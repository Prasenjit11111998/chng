import React from 'react';
import { useNavigate } from 'react-router-dom';
import ToolCard from './ToolCard';
import { Logo } from '../Logo';
import '../../lib/css/studio.css';

const STUDIO_TOOLS = [
  {
    id: 'brand-guidelines',
    name: 'Brand Guidelines Generator',
    description: 'Create professional brand guideline PDFs from logos, colors, and typography.',
    status: 'available' as const,
    route: '/studio/brand-guidelines',
  },
  {
    id: 'logo-grid',
    name: 'Logo Grid Generator',
    description: 'Generate clean logo presentation grids for brand books and pitch decks.',
    status: 'coming-soon' as const,
  },
  {
    id: 'logo-export',
    name: 'Logo Export Pack',
    description: 'Export logos in all required formats and color variants in one click.',
    status: 'coming-soon' as const,
  },
  {
    id: 'presentation',
    name: 'Presentation Generator',
    description: 'Build branded slide templates from your design system in seconds.',
    status: 'coming-soon' as const,
  },
];

const StudioLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="studio-landing">
      {/* ── Floating Header ── */}
      <div className="studio-landing__nav">
        <button
          className="studio-back-btn"
          onClick={() => navigate('/')}
          aria-label="Go back to Chng tools"
        >
          <Logo className="text-on-accent text-2xl font-black" />
        </button>
      </div>

      {/* ── Hero ── */}
      <header className="studio-landing__hero">
        <p className="studio-landing__eyebrow">Chng</p>
        <h1 className="studio-landing__title">
          Studio<span className="studio-red-dot">.</span>
        </h1>
        <p className="studio-landing__subtitle">
          Professional tools for designers, agencies, and brand creators.
        </p>
      </header>

      {/* ── Tools Grid ── */}
      <main className="studio-landing__grid">
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
      <footer className="studio-landing__footer">
        <span>Chng Studio</span>
        <span className="studio-dot-sep">·</span>
        <span>Client-side. No uploads. No accounts.</span>
      </footer>
    </div>
  );
};

export default StudioLanding;
