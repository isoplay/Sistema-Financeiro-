import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineNotice() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/98 backdrop-blur-sm">
      <div className="text-center px-6">
        <WifiOff className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Você está offline</h2>
        <p className="text-slate-400">Conecte-se para continuar.</p>
      </div>
    </div>
  );
}