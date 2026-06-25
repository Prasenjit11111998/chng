import React from 'react';
import Panel from './Panel';
import { DISCORD_URL, GITHUB_URL_Chng } from '../lib/util/consts';
import { m } from '../lib/paraglide/messages';
import {
  Info as InfoIcon,
  Cpu as CpuIcon,
  ShieldCheck as ShieldCheckIcon,
  Link as LinkIcon,
  MessageCircleMore as MessageCircleMoreIcon,
  User as UserIcon,
} from 'lucide-react';

const GithubIcon: React.FC<{ size?: number; className?: string }> = ({ size = 18, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const AboutView: React.FC = () => {
  return (
    <div className="flex flex-col h-full items-center max-w-4xl w-full mx-auto px-6 pb-20 animate-fade-in">
      <h1 className="text-4xl tracking-tight leading-[72px] mb-6 flex items-center gap-2 text-foreground font-display font-bold">
        <InfoIcon size={36} className="text-foreground" />
        About Chng
      </h1>

      <div className="w-full flex flex-col gap-6">
        {/* Project Overview Card */}
        <Panel className="p-6 flex flex-col gap-3 border border-separator">
          <h2 className="text-xl font-bold text-foreground font-display">
            The Client-Side Image Engine
          </h2>
          <p className="text-sm font-normal text-muted leading-relaxed">
            Chng is a premium, local-first image processing utility designed for designers, developers, and privacy-conscious users. It handles bulk format conversions and target-size image compression directly in the browser. By offloading computations to local WebAssembly sandboxes, your files never upload to any server, offering maximum speed, offline availability, and absolute privacy.
          </p>
        </Panel>

        {/* Home Details Relocated Here */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Card 1: WebAssembly Local Engine */}
          <Panel className="p-6 flex flex-col justify-between border border-separator">
            <div>
              <div className="flex items-center gap-3 text-lg font-bold text-foreground mb-3 font-display">
                <CpuIcon size={22} className="text-accent flex-shrink-0" />
                <span>WebAssembly Local Engine</span>
              </div>
              <p className="text-muted text-sm leading-relaxed font-normal">
                Processes your images directly inside a secure WebAssembly sandbox using <code className="text-xs bg-panel-highlight px-1.5 py-0.5 text-foreground font-mono">magick-wasm</code>. Experience lightning-fast, production-grade format conversions and size adjustments without any external dependencies.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-accent text-xs font-semibold font-mono tracking-wider">
              <span>POWERED BY MAGICK-WASM</span>
            </div>
          </Panel>

          {/* Card 2: Absolute Local Privacy */}
          <Panel className="p-6 flex flex-col justify-between border border-separator">
            <div>
              <div className="flex items-center gap-3 text-lg font-bold text-foreground mb-3 font-display">
                <ShieldCheckIcon size={22} className="text-accent flex-shrink-0" />
                <span>Absolute Local Privacy</span>
              </div>
              <p className="text-muted text-sm leading-relaxed font-normal">
                100% of your images are processed locally within your browser. No files, metadata, or data payloads ever leave your machine. Working entirely offline is fully supported and recommended.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-accent text-xs font-semibold font-mono tracking-wider">
              <span>ZERO SERVER UPLOADS</span>
            </div>
          </Panel>
        </div>

        {/* Why Chng & Creator Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Why Chng Panel */}
          <Panel className="p-6 flex flex-col gap-3 border border-separator">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-display">
              <CpuIcon size={22} className="text-foreground" />
              Why Chng?
            </h2>
            <p className="text-sm font-normal text-muted leading-relaxed">
              Standard file converters are often bloated with cookies, trackers, and intrusive advertising, while enforcing speed or file size limitations. Chng resolves this by serving as a dedicated, quiet, and fast utility built strictly on modern web sandboxing models.
            </p>
          </Panel>

          {/* Creator Profile Panel */}
          <Panel className="p-6 flex flex-col gap-3 border border-separator">
            <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-display">
              <UserIcon size={22} className="text-foreground" />
              Creator & Developer
            </h2>
            <div className="flex flex-col gap-2 mt-1">
              <span className="font-bold text-lg text-foreground font-display">Prasenjit</span>
              <p className="text-sm font-normal text-muted leading-relaxed">
                Lead creator and developer of the Chng local image engine. Focused on building high-performance, private, and developer-centric browser utilities.
              </p>
              <a
                href="https://github.com/Prasenjit11111998"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent font-semibold hover:underline font-mono mt-1 flex items-center gap-1.5 w-fit"
              >
                <GithubIcon size={14} />
                @Prasenjit11111998
              </a>
            </div>
          </Panel>
        </div>

        {/* Resources Panel */}
        <Panel className="flex flex-col gap-4 p-6 border border-separator">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground font-display">
            <LinkIcon size={22} className="text-foreground" />
            Project Resources
          </h2>
          <div className="flex gap-4 w-full flex-wrap">
            <a
              href="https://github.com/Prasenjit11111998/chng"
              target="_blank"
              rel="noopener noreferrer"
              className="btn w-full gap-2 p-3 bg-button text-foreground flex items-center justify-center text-sm font-semibold border-none"
            >
              <GithubIcon size={18} />
              GitHub Source
            </a>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default AboutView;
