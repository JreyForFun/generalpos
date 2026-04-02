import { ShoppingCart } from 'lucide-react';

export default function Checkout() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <ShoppingCart size={64} className="text-text-muted mx-auto mb-4" />
        <h1 className="font-heading text-h1 text-text-primary">Checkout</h1>
        <p className="text-body text-text-secondary mt-2">Checkout screen — Phase 1</p>
      </div>
    </div>
  );
}
