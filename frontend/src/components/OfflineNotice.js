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
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="max-w-md mx-4 text-center">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-red-500/20 rounded-full">
            <WifiOff className="w-16 h-16 text-red-500" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          Você está offline
        </h2>
        
        <p className="text-slate-300 text-lg mb-6">
          Ative os dados ou conecte ao Wi-Fi para voltarmos.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>Aguardando conexão...</span>
        </div>
      </div>
    </div>
  );
}