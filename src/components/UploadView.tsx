import React from 'react';
import { useDispatch } from 'react-redux';
import Uploader from './Uploader';
import Panel from './Panel';
import { uploadAndAddFiles } from '../store/filesSlice';
import { uploadCompressorFiles } from '../store/compressorSlice';
import { m } from '../lib/paraglide/messages';
import { Cpu as CpuIcon, ShieldCheck as ShieldCheckIcon } from 'lucide-react';

interface UploadViewProps {
  onViewChange: (view: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onViewChange, activeTab, setActiveTab }) => {
  const dispatch = useDispatch();

  const handleUploadConverter = (fileList: FileList) => {
    // @ts-expect-error thunk expects FileList
    dispatch(uploadAndAddFiles(fileList));
    onViewChange('converter');
  };

  const handleUploadCompressor = (fileList: FileList) => {
    // @ts-expect-error thunk expects FileList
    dispatch(uploadCompressorFiles(fileList));
    onViewChange('compressor');
  };

  return (
    <div className="max-w-6xl w-full mx-auto px-6 md:px-8 pb-10 animate-fade-in">
      {/* Hero section */}
      <div className="flex flex-col items-center justify-center text-center py-2 md:py-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl tracking-[-0.03em] leading-tight mb-2 md:mb-4 text-foreground font-display font-bold">
          {m["upload.title"]()}
        </h1>
        <p className="font-normal text-lg md:text-xl text-muted leading-relaxed max-w-[65ch]">
          {m["upload.subtitle"]()}
        </p>
      </div>

      {/* Switchable tabs & Uploader Dropzone */}
      <div className="flex flex-col items-center w-full max-w-xl mx-auto mb-4">
        {/* Toggle tabs */}
        <div className="flex bg-panel border border-separator p-1 rounded-none w-full mb-4">
          <button
            onClick={() => setActiveTab('converter')}
            className={`flex-1 py-3 px-4 rounded-none text-sm font-semibold transition-all duration-200 cursor-pointer border-none ${
              activeTab === 'converter'
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-panel-highlight bg-transparent'
            }`}
          >
            Convert Image
          </button>
          <button
            onClick={() => setActiveTab('compressor')}
            className={`flex-1 py-3 px-4 rounded-none text-sm font-semibold transition-all duration-200 cursor-pointer border-none ${
              activeTab === 'compressor'
                ? 'bg-accent text-on-accent shadow-sm'
                : 'text-muted hover:text-foreground hover:bg-panel-highlight bg-transparent'
            }`}
          >
            Compress Image
          </button>
        </div>

        {/* Dynamic dropzone uploader */}
        <div className="w-full h-56">
          {activeTab === 'compressor' ? (
            <Uploader
              className="w-full h-full"
              onUpload={handleUploadCompressor}
              buttonText="Drop or click to compress images"
            />
          ) : (
            <Uploader
              className="w-full h-full"
              onUpload={handleUploadConverter}
              buttonText="Drop or click to convert images"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadView;
