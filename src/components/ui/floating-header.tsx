import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { selectFiles } from '../../store/filesSlice';
import { selectCompressorFiles } from '../../store/compressorSlice';
import { RootState } from '../../store';
import { Menu as MenuIcon } from 'lucide-react';
import { Sheet, SheetContent } from './sheet';
import { Button, buttonVariants } from './button';
import { Logo } from '../Logo';
import { m } from '../../lib/paraglide/messages';
import { cn } from '@/lib/utils';
import ThemeToggle from './theme-toggle';

interface FloatingHeaderProps {
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export function FloatingHeader({ currentView, onViewChange }: FloatingHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const converterFiles = useSelector(selectFiles);
  const compressorFiles = useSelector(selectCompressorFiles);
  const theme = useSelector((state: RootState) => state.settings.theme);
  const navigate = useNavigate();
  const location = useLocation();
  const isStudioRoute = location.pathname.startsWith('/studio');

  const links = [
    {
      id: 'converter',
      label: 'Converter',
      badge: converterFiles.length > 0 ? converterFiles.length : undefined,
      isRoute: false,
    },
    {
      id: 'compressor',
      label: 'Compressor',
      badge: compressorFiles.length > 0 ? compressorFiles.length : undefined,
      isRoute: false,
    },
    {
      id: 'settings',
      label: m["navbar.settings"](),
      isRoute: false,
    },
    {
      id: 'studio',
      label: 'Studio',
      isRoute: true,
      route: '/studio',
    },
  ];

  return (
    <header
      className={cn(
        'sticky top-5 z-50',
        'mx-auto w-full max-w-3xl rounded-none border border-separator shadow-panel',
        'bg-panel',
      )}
    >
      <nav className="mx-auto flex items-center justify-between p-2 px-4">
        {/* Left Side: Brand Logo (Black box) */}
        <button
          className="bg-accent hover:opacity-90 text-on-accent rounded-none items-center justify-center flex flex-shrink-0 px-5 py-2 border-none cursor-pointer duration-200"
          onClick={() => onViewChange ? onViewChange('converter') : navigate('/')}
          aria-label="Go to converter (home)"
        >
          <Logo className="text-on-accent text-3xl lg:text-4xl font-black" />
        </button>

        {/* Center: Desktop Links */}
        <div className="hidden lg:flex items-center gap-2">
          {links.map((link) => {
            const isActive = link.isRoute
              ? isStudioRoute
              : currentView === link.id && !isStudioRoute;
            return (
              <button
                key={link.id}
                onClick={() => {
                  if (link.isRoute && link.route) {
                    navigate(link.route);
                  } else if (onViewChange) {
                    onViewChange(link.id);
                  } else {
                    navigate('/');
                  }
                }}
                className={cn(
                  buttonVariants({
                    variant: isActive ? 'secondary' : 'ghost',
                    size: 'default',
                  }),
                  'relative cursor-pointer rounded-none font-bold text-lg lg:text-xl px-4 lg:px-5',
                  link.id === 'studio' && 'border border-separator ml-1',
                )}
              >
                <span>{link.label}</span>
                {link.badge !== undefined && (
                  <span
                    className="absolute -top-1.5 -right-1.5 bg-badge text-on-badge px-1 rounded-none text-center font-display font-semibold"
                    style={{ fontSize: '0.65rem', minWidth: '1rem' }}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Theme Toggle & Menu (Mobile) */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {/* Hamburger Menu (Mobile/Tablet only) */}
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setOpen(!open)}
              className="lg:hidden rounded-none border border-separator cursor-pointer"
            >
              <MenuIcon className="size-5 text-foreground" />
            </Button>
            <SheetContent
              className="bg-black text-[#e4e4db] border-l-4 border-[#e4e4db] gap-0 p-6 w-[280px] sm:max-w-sm font-display shadow-panel"
              showClose={true}
              side="right"
            >
              <div className="grid gap-y-3 overflow-y-auto px-2 pt-16 pb-5">
                {links.map((link) => {
                  const isActive = link.isRoute
                    ? isStudioRoute
                    : currentView === link.id && !isStudioRoute;
                  return (
                    <button
                      key={link.id}
                      onClick={() => {
                        if (link.isRoute && link.route) {
                          navigate(link.route);
                        } else if (onViewChange) {
                          onViewChange(link.id);
                        } else {
                          navigate('/');
                        }
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 text-lg font-bold transition-all duration-150 cursor-pointer rounded-none border-2",
                        isActive
                          ? "bg-[#e4e4db] text-black border-[#e4e4db]"
                          : "bg-transparent text-[#e4e4db] border-transparent hover:bg-white/10"
                      )}
                    >
                      <span className="font-display uppercase tracking-wide">{link.label}</span>
                      {link.badge !== undefined && (
                        <span
                          className={cn(
                            "ml-2 px-1.5 py-0.5 rounded-none text-center font-display font-bold text-xs inline-block",
                            isActive ? "bg-black text-[#e4e4db]" : "bg-[#e4e4db] text-black"
                          )}
                        >
                          {link.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}

export default FloatingHeader;
