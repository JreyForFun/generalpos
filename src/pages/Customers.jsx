import { Users } from 'lucide-react';
export default function Customers() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <Users size={64} className="text-text-muted mx-auto mb-4" />
        <h1 className="font-heading text-h1 text-text-primary">Customers</h1>
        <p className="text-body text-text-secondary mt-2">Customer management — Phase 3</p>
      </div>
    </div>
  );
}
