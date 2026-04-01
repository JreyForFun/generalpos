import { Boxes } from 'lucide-react';
export default function Inventory() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Boxes size={64} className="text-text-muted mx-auto mb-4" />
        <h1 className="font-heading text-h1 text-text-primary">Inventory</h1>
        <p className="text-body text-text-secondary mt-2">Stock management — Phase 2</p>
      </div>
    </div>
  );
}
