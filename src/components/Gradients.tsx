import React from 'react';
import { useSelector } from 'react-redux';
import { selectFiles } from '../store/filesSlice';
import vertBg from '../lib/assets/chng-bg.svg';

interface GradientsProps {
  currentView: string;
}

export const Gradients: React.FC<GradientsProps> = ({ currentView }) => {
  const files = useSelector(selectFiles);
  
  // Resolve background color depending on view and files
  let bgColor = 'transparent';
  let maskHeight = 100;
  let bgImage: string | undefined = undefined;

  // Find dominant file converter type to colorize gradient on convert page
  let fileCategoryColor = '';
  if (files.length > 0) {
    const categories = files.map(f => {
      const ext = f.from.toLowerCase();
      if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].includes(ext)) return 'blue';
      if (['.mp3', '.wav', '.flac', '.ogg', '.m4a'].includes(ext)) return 'purple';
      if (['.mp4', '.webm', '.avi', '.mov', '.mkv'].includes(ext)) return 'red';
      if (['.docx', '.doc', '.pdf', '.md', '.txt'].includes(ext)) return 'green';
      return 'pink';
    });
    const unique = Array.from(new Set(categories));
    if (unique.length === 1) {
      fileCategoryColor = unique[0] + '-';
    }
  }

  switch (currentView) {
    case 'upload':
      bgColor = 'var(--bg-gradient-from)';
      maskHeight = 100;
      break;
    case 'convert':
      bgColor = `var(--bg-gradient-${fileCategoryColor}from)`;
      maskHeight = 25;
      if (files.length === 1 && files[0].blobUrl) {
        bgImage = files[0].blobUrl;
      }
      break;
    case 'settings':
      bgColor = 'var(--bg-gradient-blue-from)';
      maskHeight = 25;
      break;
    case 'about':
      bgColor = 'var(--bg-gradient-from)';
      maskHeight = 25;
      break;
    case 'privacy':
      bgColor = 'var(--bg-gradient-red-from)';
      maskHeight = 100;
      break;
    default:
      bgColor = 'transparent';
  }

  const maskImage = `linear-gradient(to top, transparent ${100 - maskHeight}%, black 100%)`;

  return (
    <>
      {currentView === 'upload' && (
        <div className="fixed -z-30 top-0 left-0 w-screen h-screen flex items-center justify-center overflow-hidden pointer-events-none opacity-10 dark:opacity-5">
          <img
            src={vertBg}
            alt=""
            className="scale-[200%] md:scale-[80%] invert dark:invert-0"
          />
        </div>
      )}

      <div
        className="fixed top-0 left-0 w-screen h-screen -z-40 pointer-events-none transition-all duration-500"
        style={{
          backgroundColor: bgColor,
          maskImage: maskImage,
          WebkitMaskImage: maskImage,
        }}
      />

      {bgImage && (
        <div
          className="fixed top-0 left-0 w-screen h-screen -z-50 pointer-events-none blur-md opacity-30"
          style={{
            backgroundImage: `url(${bgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            maskImage: 'linear-gradient(to top, transparent 5%, rgba(0, 0, 0, 0.5) 100%)',
            WebkitMaskImage: 'linear-gradient(to top, transparent 5%, rgba(0, 0, 0, 0.5) 100%)',
          }}
        />
      )}
    </>
  );
};
export default Gradients;
