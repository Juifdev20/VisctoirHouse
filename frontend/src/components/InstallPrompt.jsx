import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (isInstalled || !isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-[420px]">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 animate-slide-up">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center flex-shrink-0">
            <img src="/logo.png" alt="La Victoire House" className="w-10 h-10 rounded-lg object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                Installer l'application
              </h3>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors -mt-1"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 leading-relaxed">
              Installez <span className="font-semibold text-navy dark:text-gold-400">La Victoire House</span> sur votre appareil pour y accéder rapidement, même hors connexion.
            </p>
            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1">
                <Monitor size={13} /> PC
              </span>
              <span className="flex items-center gap-1">
                <Smartphone size={13} /> Téléphone
              </span>
            </div>
            <button
              onClick={handleInstall}
              className="mt-4 w-full bg-navy hover:bg-navy/90 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-navy/25 active:scale-[0.98]"
            >
              <Download size={18} />
              Installer maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
