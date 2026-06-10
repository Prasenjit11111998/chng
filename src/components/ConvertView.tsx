import React from 'react';
import { useSelector } from 'react-redux';
import { selectFiles } from '../store/filesSlice';
import ConversionPanel from './ConversionPanel';
import FileItem from './FileItem';
import Uploader from './Uploader';

interface ConvertViewProps {
  onViewChange: (view: string) => void;
}

export const ConvertView: React.FC<ConvertViewProps> = ({ onViewChange }) => {
  const files = useSelector(selectFiles);

  return (
    <div className="flex flex-col justify-center items-center gap-8 px-4 md:p-0 max-w-[778px] mx-auto w-full pb-20">
      <div className="w-full">
        <ConversionPanel />
      </div>

      {/* Uploader dropzone at the top */}
      <div className="w-full h-32 flex-shrink-0">
        <Uploader className="w-full h-full" onViewChange={onViewChange} />
      </div>

      {/* List of files listed row-by-row */}
      {files.length > 0 && (
        <div className="w-full flex flex-col gap-3">
          {files.map((file, i) => (
            <FileItem key={file.id} file={file} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};
export default ConvertView;
