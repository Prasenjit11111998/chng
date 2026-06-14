import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBrandData, selectExportSettings, setExportSettings, setSectionOrder } from '../../../../store';
import type { PDFSection } from '../../../../lib/studio/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

// ─── Section Labels ────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<PDFSection, string> = {
  'cover': 'Cover',
  'about': 'About the Brand',
  'logo-system': 'Logo System',
  'clearspace': 'Clearspace',
  'min-size': 'Minimum Size',
  'color-palette': 'Color Palette',
  'typography': 'Typography',
  'brand-applications': 'Brand Applications',
  'logo-rules': 'Logo Usage Rules',
};

// ─── Sortable Section Item ─────────────────────────────────────────────────────

interface SortableItemProps {
  id: string;
  label: string;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, label }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('section-sort-item', isDragging && 'section-sort-item--dragging')}
      {...attributes}
      {...listeners}
    >
      <span className="section-sort-item__grip" aria-hidden="true">⠿</span>
      <span className="section-sort-item__label">{label}</span>
    </div>
  );
};

// ─── Step 7 ───────────────────────────────────────────────────────────────────

type ExportState = 'idle' | 'generating' | 'done' | 'error';

const Step7Export: React.FC = () => {
  const dispatch = useDispatch();
  const data = useSelector(selectBrandData);
  const exportSettings = useSelector(selectExportSettings);
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = exportSettings.sectionOrder.indexOf(active.id as PDFSection);
      const newIndex = exportSettings.sectionOrder.indexOf(over.id as PDFSection);
      dispatch(setSectionOrder(arrayMove([...exportSettings.sectionOrder], oldIndex, newIndex)));
    }
  };

  const handleExport = useCallback(async () => {
    setExportState('generating');
    setErrorMessage(null);
    try {
      // Lazy import PDF export to avoid bundling @react-pdf/renderer upfront
      const { generatePDF } = await import('../../../../lib/studio/pdfExport');
      await generatePDF(data, exportSettings);
      setExportState('done');
      setTimeout(() => setExportState('idle'), 4000);
    } catch (err) {
      console.error('[Studio] PDF export failed:', err);
      setExportState('error');
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setTimeout(() => {
        setExportState('idle');
        setErrorMessage(null);
      }, 8000);
    }
  }, [data, exportSettings]);

  const themes: { id: 'light' | 'dark'; label: string; desc: string }[] = [
    { id: 'light', label: 'Light', desc: 'White background, clean, editorial' },
    { id: 'dark', label: 'Dark', desc: 'Dark background, Chng-native aesthetic' },
  ];

  return (
    <div className="wizard-step">
      <div className="wizard-step__header">
        <h2 className="wizard-step__name">Export Settings</h2>
        <p className="wizard-step__hint">Configure your PDF before downloading.</p>
      </div>

      {/* PDF Theme */}
      <div className="wizard-field">
        <span className="wizard-label">PDF Theme</span>
        <div className="theme-chips" role="radiogroup" aria-label="PDF theme">
          {themes.map((t) => (
            <button
              key={t.id}
              className={cn('theme-chip', exportSettings.theme === t.id && 'theme-chip--active')}
              role="radio"
              aria-checked={exportSettings.theme === t.id}
              onClick={() => dispatch(setExportSettings({ theme: t.id }))}
            >
              <span className="theme-chip__label">{t.label}</span>
              <span className="theme-chip__desc">{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Section Reorder */}
      <div className="wizard-field">
        <span className="wizard-label">Section Order</span>
        <p className="wizard-hint-text">Drag to reorder sections in the PDF.</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={exportSettings.sectionOrder} strategy={verticalListSortingStrategy}>
            <div className="section-sort-list">
              {exportSettings.sectionOrder.map((section) => (
                <SortableItem
                  key={section}
                  id={section}
                  label={SECTION_LABELS[section] ?? section}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Export button */}
      <div className="export-action">
        <button
          className={cn(
            'export-btn',
            exportState === 'generating' && 'export-btn--loading',
            exportState === 'done' && 'export-btn--done',
            exportState === 'error' && 'export-btn--error',
          )}
          onClick={handleExport}
          disabled={exportState === 'generating'}
          aria-live="polite"
        >
          {exportState === 'idle' && 'Generate PDF →'}
          {exportState === 'generating' && 'Generating PDF...'}
          {exportState === 'done' && (
            <>
              Download Ready{' '}
              <svg className="export-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" className="export-check-line" />
              </svg>
            </>
          )}
          {exportState === 'error' && 'Export failed — try again'}
        </button>
        {errorMessage && (
          <p className="export-error-msg" style={{ color: 'var(--red)', fontSize: '12px', marginTop: '8px', textAlign: 'center' }}>
            Error: {errorMessage}
          </p>
        )}
        {data.brandName && (
          <p className="export-filename">
            {data.brandName.toLowerCase().replace(/\s+/g, '-')}-brand-guidelines.pdf
          </p>
        )}
      </div>
    </div>
  );
};

export default Step7Export;
