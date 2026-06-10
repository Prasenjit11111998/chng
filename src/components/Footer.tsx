import React from 'react';
import { m } from '../lib/paraglide/messages';

interface FooterProps {
  onViewChange: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onViewChange }) => {
  const year = new Date().getFullYear();

  return (
    <footer className="hidden md:block w-full h-14 border-t border-separator fixed bottom-0 mt-12 bg-transparent z-40">
      <div className="w-full h-full flex items-center justify-center text-muted gap-3 relative">
        <p>{m["footer.copyright"]({ year })}</p>
        <p>•</p>
        <button
          className="hover:underline font-normal text-muted bg-transparent border-none p-0 cursor-pointer"
          onClick={() => onViewChange('about')}
        >
          {m["navbar.about"]()}
        </button>
        <p>•</p>
        <button
          className="hover:underline font-normal text-muted bg-transparent border-none p-0 cursor-pointer"
          onClick={() => onViewChange('privacy')}
        >
          {m["footer.privacy_policy"]()}
        </button>
      </div>

      <div
        className="absolute bottom-0 left-0 w-full h-24 -z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--bg) 100%)' }}
      />
    </footer>
  );
};
export default Footer;
