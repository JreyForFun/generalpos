import { UserCog } from 'lucide-react';
export default function Cashiers() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <UserCog size={64} className="text-text-muted mx-auto mb-4" />
        <h1 className="font-heading text-h1 text-text-primary">Cashiers</h1>
        <p className="text-body text-text-secondary mt-2">Cashier management — Phase 4</p>
      </div>
    </div>
  );
}
