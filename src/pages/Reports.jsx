import { BarChart3 } from 'lucide-react';
export default function Reports() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <BarChart3 size={64} className="text-text-muted mx-auto mb-4" />
        <h1 className="font-heading text-h1 text-text-primary">Reports</h1>
        <p className="text-body text-text-secondary mt-2">Sales reports — Phase 4</p>
      </div>
    </div>
  );
}
