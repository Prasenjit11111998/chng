import React from 'react';
import { m } from '../lib/paraglide/messages';
import { link, sanitize } from '../lib/util/html';
import { ShieldCheck } from 'lucide-react';
import Panel from './Panel';

interface PrivacyViewProps {
  setView: (view: string) => void;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ setView }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/')) {
        e.preventDefault();
        setView(href.substring(1));
      }
    }
  };

  return (
    <div className="flex flex-col h-full items-center">
      <h1 className="hidden md:block text-[40px] tracking-tight leading-[72px] mb-6 font-bold text-foreground">
        <ShieldCheck size={40} className="inline-block -mt-2 mr-2 text-foreground" />
        {m['privacy.title']()}
      </h1>

      <div
        className="w-full max-w-[1280px] flex flex-col md:flex-row gap-4 p-4 md:px-4 md:py-0 animate-fade-in"
        onClick={handleLinkClick}
      >
        <Panel className="p-6 text-lg font-normal text-foreground w-full">
          <h2 className="text-2xl mb-3 font-semibold">{m['privacy.summary.title']()}</h2>
          <p
            className="mb-4 text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitize(
                link(
                  ['vert_link'],
                  m['privacy.summary.description'](),
                  ['https://chng.sh'],
                  [true],
                  ['text-primary hover:underline']
                )
              ),
            }}
          />

          <h2 className="text-2xl mb-3 font-semibold">{m['privacy.conversions.title']()}</h2>
          <p
            className="mb-4 text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitize(m['privacy.conversions.description']()),
            }}
          />



          <h3 className="text-xl mt-4 mb-2 font-semibold">{m['privacy.analytics.title']()}</h3>
          <p
            className="mb-4 text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitize(
                link(
                  ['settings_link', 'plausible_link'],
                  m['privacy.analytics.description'](),
                  ['/settings', 'https://plausible.io/privacy-focused-web-analytics'],
                  [false, true],
                  ['text-primary hover:underline', 'text-primary hover:underline']
                )
              ),
            }}
          />

          <h3 className="text-xl mt-4 mb-2 font-semibold">
            {m['privacy.local_storage.title']()}
          </h3>
          <p
            className="mb-4 text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitize(
                link(
                  ['settings_link'],
                  m['privacy.local_storage.description'](),
                  ['/settings'],
                  [false],
                  ['text-primary hover:underline']
                )
              ),
            }}
          />

          <h3 className="text-xl mt-4 mb-2 font-semibold">{m['privacy.contact.title']()}</h3>
          <p
            className="mb-0 text-muted-foreground"
            dangerouslySetInnerHTML={{
              __html: sanitize(
                link(
                  ['email_link'],
                  m['privacy.contact.description'](),
                  ['mailto:prasenjit.chakraborty1998@gmail.com'],
                  [false],
                  ['text-primary hover:underline']
                )
              ),
            }}
          />

          <p className="text-sm text-muted mt-6">{m['privacy.last_updated']()}</p>
        </Panel>
      </div>
    </div>
  );
};

export default PrivacyView;