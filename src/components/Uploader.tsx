import React, { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { uploadAndAddFiles } from '../store/filesSlice';
import { Upload as UploadIcon } from 'lucide-react';
import Panel from './Panel';
import { m } from '../lib/paraglide/messages';

interface UploaderProps {
  className?: string;
  onViewChange?: (view: string) => void;
  onUpload?: (files: FileList) => void;
  buttonText?: string;
}

export const Uploader: React.FC<UploaderProps> = ({ className = '', onViewChange, onUpload, buttonText }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onUpload) {
        onUpload(e.target.files);
      } else {
        // @ts-expect-error thunk expects FileList
        dispatch(uploadAndAddFiles(e.target.files));
        if (onViewChange) onViewChange('convert');
      }
    }
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (onUpload) {
        onUpload(e.dataTransfer.files);
      } else {
        // @ts-expect-error thunk expects FileList
        dispatch(uploadAndAddFiles(e.dataTransfer.files));
        if (onViewChange) onViewChange('convert');
      }
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      <button
        type="button"
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-label={buttonText || m["upload.uploader.text"]({ action: m["upload.uploader.convert"]() })}
        className={`active:scale-[0.99] duration-150 border-none bg-transparent w-full h-full cursor-pointer ${className}`}
      >
        <Panel
          className={`flex justify-center items-center w-full h-full flex-col pointer-events-none p-4 min-h-[120px] transition-all duration-150 ${
            isDragOver ? 'bg-[var(--accent-transparent)]' : ''
          }`}
        >
          <div className={`w-10 h-10 rounded-none flex items-center justify-center p-2.5 transition-all duration-150 ${
            isDragOver ? 'bg-accent scale-110' : 'bg-accent'
          }`}>
            <UploadIcon className="w-full h-full text-on-accent" />
          </div>
          <p className="text-center text-sm sm:text-base font-semibold mt-3 text-foreground font-mono">
            {buttonText || m["upload.uploader.text"]({
              action: m["upload.uploader.convert"]()
            })}
          </p>
          <p className="text-xs text-muted font-mono mt-1">
            or paste from clipboard
          </p>
        </Panel>
      </button>
    </>
  );
};
export default Uploader;
