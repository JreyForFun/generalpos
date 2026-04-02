import { useState, useEffect } from 'react';
import { Minus, Square, X, Maximize2 } from 'lucide-react';
import { useSessionStore } from '../../store/sessionStore';
import { cn } from '../../lib/cn';

export default function Titlebar() {
  const session = useSessionStore((s) => s.session);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI?.isMaximized().then(setIsMaximized);
    window.electronAPI?.onMaximizedChange(setIsMaximized);
  }, []);

  return (
    <div className="drag-region flex items-center justify-between h-10 bg-bg-secondary border-b border-border px-3 shrink-0">
      {/* Left: App name */}
      <div className="flex items-center gap-2">
        <span className="no-drag font-heading text-h3 text-accent-primary tracking-wider">
          FLEX<span className="text-text-primary">POS</span>
        </span>
        {session && (
          <span className="text-small text-text-muted ml-3">
            {session.name} • <span className="capitalize">{session.role}</span>
          </span>
        )}
      </div>

      {/* Right: Window controls */}
      <div className="no-drag flex items-center">
        <button
          onClick={() => window.electronAPI?.minimizeWindow()}
          className="flex items-center justify-center w-10 h-10 text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors duration-150"
          aria-label="Minimize"
        >
          <Minus size={16} />
        </button>
        <button
          onClick={() => window.electronAPI?.maximizeWindow()}
          className="flex items-center justify-center w-10 h-10 text-text-secondary hover:bg-bg-hover hover:text-text-primary transition-colors duration-150"
          aria-label="Maximize"
        >
          {isMaximized ? <Maximize2 size={14} /> : <Square size={14} />}
        </button>
        <button
          onClick={() => window.electronAPI?.closeWindow()}
          className="flex items-center justify-center w-10 h-10 text-text-secondary hover:bg-accent-danger hover:text-white transition-colors duration-150"
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
