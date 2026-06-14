import React, { useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectBrandData } from '../../../../store';
import type { PDFSection } from '../../../../lib/studio/types';
import {
  PreviewCover,
  PreviewAbout,
  PreviewLogoSystem,
  PreviewClearspace,
  PreviewColors,
  PreviewTypography,
  PreviewApplications,
  PreviewLogoRules,
} from './PreviewPages';

interface LivePreviewPanelProps {
  sectionOrder?: PDFSection[];
  compact?: boolean; // true = scaled down sidebar panel
  currentStep?: number;
}

const STEP_TO_SECTION: Record<number, PDFSection> = {
  1: 'cover',
  2: 'logo-system',
  3: 'color-palette',
  4: 'typography',
  5: 'logo-rules',
};

const PAGE_MAP: Partial<Record<PDFSection, React.ComponentType<{ data: any }>>> = {
  cover: PreviewCover,
  about: PreviewAbout,
  'logo-system': PreviewLogoSystem,
  clearspace: PreviewClearspace,
  'min-size': undefined, // omit — duplicate of clearspace; PDF shows both combined
  'color-palette': PreviewColors,
  typography: PreviewTypography,
  'brand-applications': PreviewApplications,
  'logo-rules': PreviewLogoRules,
};

const DEFAULT_ORDER: PDFSection[] = [
  'cover', 'about', 'logo-system', 'clearspace', 'color-palette', 'typography', 'brand-applications', 'logo-rules'
];

export const LivePreviewPanel: React.FC<LivePreviewPanelProps> = ({
  sectionOrder = DEFAULT_ORDER,
  compact = true,
  currentStep,
}) => {
  const data = useSelector(selectBrandData);
  const [activePage, setActivePage] = React.useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const pages = useMemo(() =>
    sectionOrder.filter((s) => PAGE_MAP[s] != null),
    [sectionOrder]
  );

  React.useEffect(() => {
    if (currentStep !== undefined) {
      const section = STEP_TO_SECTION[currentStep];
      if (section) {
        const idx = pages.indexOf(section);
        if (idx !== -1) {
          setActivePage(idx);
        }
      }
    }
  }, [currentStep, pages]);

  const ActivePage = PAGE_MAP[pages[activePage]] ?? PreviewCover;

  return (
    <div className={`live-preview ${compact ? 'live-preview--compact' : 'live-preview--full'}`}
      ref={panelRef}
      aria-label="Live brand guidelines preview"
    >
      {compact && (
        <p className="live-preview__label">Live Preview</p>
      )}

      {/* Scaled A4 page */}
      <div className="live-preview__scale-wrap">
        <div className="live-preview__page">
          <ActivePage data={data} />
        </div>
      </div>

      {/* Page navigation dots */}
      <div className="live-preview__dots" role="tablist" aria-label="Preview pages">
        {pages.map((section, idx) => (
          <button
            key={section}
            className={`live-preview__dot ${idx === activePage ? 'live-preview__dot--active' : ''}`}
            onClick={() => setActivePage(idx)}
            role="tab"
            aria-selected={idx === activePage}
            aria-label={`Preview: ${section.replace(/-/g, ' ')}`}
          />
        ))}
      </div>
    </div>
  );
};

export default LivePreviewPanel;
