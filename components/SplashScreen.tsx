'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_STORAGE_KEY = 'sndrush_splash_shown';
const SPLASH_DURATION = 1000; // 1 seconde totale
const FADE_OUT_DURATION = 300; // Transition de sortie

/**
 * Réinitialise le splash screen (utile pour les tests)
 * Appeler depuis la console : window.resetSplashScreen()
 */
if (typeof window !== 'undefined') {
  (window as any).resetSplashScreen = () => {
    localStorage.removeItem(SPLASH_STORAGE_KEY);
    window.location.reload();
  };
  
  // Mode debug : ajouter ?debugSplash=true dans l'URL pour forcer l'affichage
  (window as any).showSplash = () => {
    localStorage.removeItem(SPLASH_STORAGE_KEY);
    window.location.reload();
  };
}

interface SplashScreenProps {
  onComplete?: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false); // Commencer à false pour éviter l'hydratation
  const [hasShown, setHasShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const handleComplete = useCallback(() => {
    setIsLoading(false);
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // Éviter l'hydratation mismatch en vérifiant uniquement côté client
  useEffect(() => {
    setMounted(true);
    
    // Mode debug : vérifier si ?debugSplash=true est dans l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debugSplash') === 'true';
    
    // Vérifier si le splash a déjà été affiché (sauf en mode debug)
    if (!debugMode) {
      const shown = localStorage.getItem(SPLASH_STORAGE_KEY);
      if (shown) {
        setHasShown(true);
        setIsVisible(false);
        handleComplete();
        return;
      }
    }

    // Afficher le splash immédiatement côté client
    setIsVisible(true);

    // Marquer comme affiché dans localStorage après un court délai
    const timer = setTimeout(() => {
      localStorage.setItem(SPLASH_STORAGE_KEY, 'true');
      setIsVisible(false);
      // Délai pour la transition avant d'appeler onComplete
      setTimeout(() => {
        handleComplete();
      }, FADE_OUT_DURATION);
    }, SPLASH_DURATION);

    return () => clearTimeout(timer);
  }, [handleComplete]);

  // Ne rien afficher si pas encore monté (évite l'hydratation mismatch) ou si déjà montré
  if (!mounted || hasShown) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          style={{ willChange: 'opacity' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_OUT_DURATION / 1000, ease: 'easeInOut' }}
        >
          {/* Flash orange */}
          <motion.div
            className="absolute inset-0 bg-[#F2431E]"
            style={{ willChange: 'opacity' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0.8, 0] }}
            transition={{
              duration: 0.4,
              times: [0, 0.2, 0.5, 1],
              ease: 'easeInOut',
            }}
          />

          {/* Contenu principal */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-6">
            {/* Icône éclair avec animation */}
            <motion.div
              style={{ willChange: 'transform, opacity' }}
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{
                duration: 0.5,
                ease: [0.34, 1.56, 0.64, 1], // easeOutBack
              }}
            >
              <motion.div
                style={{ willChange: 'transform' }}
                animate={isLoading ? { 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                } : { scale: 1, rotate: 0 }}
                transition={{
                  duration: 0.6,
                  repeat: isLoading ? Infinity : 0,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
                className="text-6xl md:text-8xl lg:text-9xl"
              >
                ⚡
              </motion.div>
            </motion.div>

            {/* Texte SoundRush Paris */}
            <motion.div
              style={{ willChange: 'transform, opacity' }}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.1, y: -20 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
              }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-center">
                <span className="text-[#F2431E]">SoundRush</span>
                <span className="text-white"> Paris</span>
              </h1>
            </motion.div>

            {/* Loader rapide */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 flex gap-2"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    style={{ willChange: 'transform, opacity' }}
                    className="w-2 h-2 bg-[#F2431E] rounded-full"
                    animate={isLoading ? {
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5],
                    } : { scale: 1, opacity: 1 }}
                    transition={{
                      duration: 0.6,
                      repeat: isLoading ? Infinity : 0,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </motion.div>
            )}
          </div>

          {/* Effet de vibration subtile sur mobile (optionnel) */}
          {typeof window !== 'undefined' && 'vibrate' in navigator && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              onAnimationStart={() => {
                // Vibration subtile (optionnel, désactivé par défaut pour performance)
                // navigator.vibrate([10]);
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
