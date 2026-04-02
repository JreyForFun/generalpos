import { Settings as SettingsIcon } from 'lucide-react';
export default function Settings() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <SettingsIcon size={64} className="text-text-muted mx-auto mb-4" />
        <h1 className="font-heading text-h1 text-text-primary">Settings</h1>
        <p className="text-body text-text-secondary mt-2">Store settings — Phase 5</p>
      </div>
    </div>
  );
}
