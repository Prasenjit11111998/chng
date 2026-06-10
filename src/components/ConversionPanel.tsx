import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectFiles,
  selectFilesReady,
  selectFilesResults,
  convertAll,
  downloadAll,
  clearAll,
  updateFileTo
} from '../store';
import Panel from './Panel';
import { Button } from './ui/button';
import { categories } from '../lib/converters';
import { m } from '../lib/paraglide/messages';
import FormatDropdown from './FormatDropdown';
import Dropdown from './Dropdown';
import { RefreshCw, FolderArchive, Trash2 } from 'lucide-react';

export const ConversionPanel: React.FC = () => {
  const files = useSelector(selectFiles);
  const ready = useSelector(selectFilesReady);
  const results = useSelector(selectFilesResults);
  const dispatch = useDispatch();

  const handleConvertAll = () => {
    dispatch(convertAll() as any);
  };

  const handleDownloadAll = () => {
    dispatch(downloadAll() as any);
  };

  const handleClearAll = () => {
    dispatch(clearAll());
  };

  const sameCategory = useMemo(() => {
    if (files.length === 0) return false;
    const getCategory = (ext: string) => {
      if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) return 'image';
      if (['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext)) return 'audio';
      if (['.mp4', '.webm', '.avi', '.mov', '.mkv'].includes(ext)) return 'video';
      return 'doc';
    };
    const firstCat = getCategory(files[0].from);
    return files.every(f => getCategory(f.from) === firstCat);
  }, [files]);

  const commonTarget = useMemo(() => {
    if (files.length === 0) return '';
    const firstTo = files[0].to;
    const allSame = files.every(f => f.to === firstTo);
    return allSame ? firstTo : '';
  }, [files]);

  const isProcessingAny = useMemo(() => files.some(f => f.processing), [files]);

  return (
    <Panel className="w-full">
      <div className="p-1 md:p-2 flex flex-col gap-4 w-full">
        <div className="w-full h-auto flex flex-col md:flex-row items-center justify-between gap-4 flex-wrap md:flex-nowrap">
          <div className="flex items-center flex-col sm:flex-row gap-2 max-sm:w-full">
            <Button
              type="button"
              onClick={handleConvertAll}
              variant="default"
              className="flex gap-3 max-sm:w-full sm:max-w-[10.5rem] text-on-accent"
              disabled={!ready}
            >
              <RefreshCw
                size={20}
                className={!ready ? 'animate-spin' : ''}
              />
              <span className="font-semibold">
                {m['convert.panel.convert_all']()}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="flex gap-3 max-sm:w-full sm:max-w-[10.5rem] text-foreground"
              disabled={!ready || !results}
              onClick={handleDownloadAll}
            >
              <FolderArchive size={20} />
              <span className="font-semibold">
                {m['convert.panel.download_all']()}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="p-4 flex gap-3 max-sm:w-full text-foreground"
              disabled={files.length === 0}
              onClick={handleClearAll}
              aria-label={m['convert.panel.remove_all']()}
              title={m['convert.panel.remove_all']()}
            >
              <Trash2 size={20} />
              <span className="inline sm:hidden font-semibold">
                {m['convert.panel.remove_all']()}
              </span>
            </Button>
          </div>

          <div className="w-full bg-separator h-0.5 flex md:hidden" />

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-mono text-xxs uppercase tracking-wider text-muted">
              {m['convert.panel.set_all_to']()}
            </span>
            <div className="w-32">
              {sameCategory ? (
                <FormatDropdown
                  selected={commonTarget}
                  onselect={(targetFormat) => {
                    files.forEach(file => {
                      dispatch(updateFileTo({ id: file.id, to: targetFormat }));
                    });
                  }}
                  categories={categories}
                  dropdownSize="large"
                  from={files[0].from}
                />
              ) : (
                <Dropdown
                  options={[m['convert.panel.na']()]}
                  disabled={true}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default ConversionPanel;