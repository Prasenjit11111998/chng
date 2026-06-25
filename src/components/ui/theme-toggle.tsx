import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, setTheme } from '../../store';
import { SHOW_RETRO_THEMES } from '../../store/settingsSlice';
import { Sun, Moon, Gamepad2, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const theme = useSelector((state: RootState) => state.settings.theme);
  const dispatch = useDispatch();

  const handleThemeToggle = () => {
    if (SHOW_RETRO_THEMES) {
      const cycle: ('light' | 'dark' | 'gameboy' | 'matrix')[] = ['light', 'dark', 'gameboy', 'matrix'];
      const nextIndex = (cycle.indexOf(theme) + 1) % cycle.length;
      dispatch(setTheme(cycle[nextIndex]));
    } else {
      const nextTheme = theme === 'dark' ? 'light' : 'dark';
      dispatch(setTheme(nextTheme));
    }
  };

  return (
    <button
      onClick={handleThemeToggle}
      className={cn(
        "w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer rounded-none hover:bg-panel-highlight duration-200 text-foreground",
        className
      )}
      aria-label={`Current theme: ${theme}. Click to change.`}
      title="Toggle theme"
    >
      {theme === 'dark' ? (
        <Moon size={20} />
      ) : theme === 'gameboy' ? (
        <Gamepad2 size={20} />
      ) : theme === 'matrix' ? (
        <Terminal size={20} />
      ) : (
        <Sun size={20} />
      )}
    </button>
  );
};

export default ThemeToggle;
