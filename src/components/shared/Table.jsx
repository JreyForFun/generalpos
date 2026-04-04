import { cn } from '../../lib/cn';

/**
 * Table — reusable data table component.
 * Supports column definitions, empty state, and responsive scrolling.
 */
export default function Table({ columns, data, emptyMessage = 'No data found', emptyIcon, onRowClick }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="bg-bg-tertiary">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-tiny font-semibold text-text-muted uppercase tracking-wider',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  col.className
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center"
              >
                {emptyIcon && (
                  <div className="flex justify-center mb-3 text-text-muted">{emptyIcon}</div>
                )}
                <p className="text-body text-text-muted">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-t border-border transition-colors duration-100',
                  onRowClick && 'cursor-pointer hover:bg-bg-hover',
                  !onRowClick && 'hover:bg-bg-hover/50'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-body text-text-primary',
                      col.align === 'right' && 'text-right tabular-nums',
                      col.align === 'center' && 'text-center',
                      col.cellClass
                    )}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
