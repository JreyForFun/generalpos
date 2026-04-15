import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * CustomSelect — styled dropdown replacement for native <select>.
 * Features: keyboard navigation, animated dropdown, consistent dark theme.
 *
 * @param {object} props
 * @param {Array<{value: string, label: string}>} props.options - Dropdown options
 * @param {string} props.value - Currently selected value
 * @param {function} props.onChange - Called with new value (string) on selection
 * @param {string} [props.placeholder] - Placeholder when no value selected
 * @param {string} [props.className] - Additional container classes
 * @param {string} [props.size] - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} [props.disabled] - Whether select is disabled
 */
export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className,
  size = 'md',
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && listRef.current && focusedIndex >= 0) {
      const items = listRef.current.children;
      if (items[focusedIndex]) {
        items[focusedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      const idx = options.findIndex((o) => o.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    }
  };

  const handleSelect = (option) => {
    onChange(option.value);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleSelect(options[focusedIndex]);
        } else {
          setIsOpen(true);
          const idx = options.findIndex((o) => o.value === value);
          setFocusedIndex(idx >= 0 ? idx : 0);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          const idx = options.findIndex((o) => o.value === value);
          setFocusedIndex(idx >= 0 ? idx : 0);
        } else {
          setFocusedIndex((prev) => Math.min(prev + 1, options.length - 1));
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const heights = { sm: 'h-8', md: 'h-10', lg: 'h-11' };
  const textSizes = { sm: 'text-small', md: 'text-body', lg: 'text-body' };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          'flex items-center justify-between w-full px-3 rounded-lg border transition-all duration-150',
          heights[size],
          textSizes[size],
          'bg-bg-input text-text-primary',
          disabled
            ? 'opacity-50 cursor-not-allowed border-border'
            : isOpen
              ? 'border-border-focus ring-1 ring-accent-primary/20'
              : 'border-border hover:border-border-hover',
        )}
      >
        <span className={cn(!selectedOption && 'text-text-muted')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            'text-text-muted shrink-0 ml-2 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={listRef}
          className={cn(
            'absolute z-50 top-full left-0 right-0 mt-1 py-1 rounded-lg border border-border bg-bg-secondary shadow-xl',
            'max-h-48 overflow-y-auto',
            'animate-in fade-in slide-in-from-top-1 duration-150'
          )}
          role="listbox"
        >
          {options.map((option, i) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setFocusedIndex(i)}
              className={cn(
                'flex items-center w-full px-3 py-2 text-left transition-colors',
                textSizes[size],
                option.value === value
                  ? 'text-accent-primary font-semibold bg-accent-primary/10'
                  : i === focusedIndex
                    ? 'bg-bg-hover text-text-primary'
                    : 'text-text-secondary hover:bg-bg-hover hover:text-text-primary'
              )}
            >
              {option.label}
            </button>
          ))}
          {options.length === 0 && (
            <p className="px-3 py-2 text-small text-text-muted">No options</p>
          )}
        </div>
      )}
    </div>
  );
}
