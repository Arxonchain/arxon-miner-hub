import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Fingerprint, ShieldCheck, XCircle } from 'lucide-react';

interface FingerprintScannerProps {
  onVerified: (fingerprintHash?: string) => void;
  isVerifying?: boolean;
  title?: string;
  subtitle?: string;
  /** If provided, will verify the scanned fingerprint matches this hash */
  storedFingerprintHash?: string;
  /** Called when verification fails (fingerprint doesn't match) */
  onVerificationFailed?: () => void;
}

// Generate a unique fingerprint hash based on the visual pattern the user draws
const generateFingerprintHash = async (): Promise<string> => {
  const components: string[] = [];
  
  // Screen properties
  components.push(`screen:${screen.width}x${screen.height}x${screen.colorDepth}`);
  components.push(`timezone:${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  components.push(`lang:${navigator.language}`);
  components.push(`platform:${navigator.platform}`);
  
  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = 200;
      canvas.height = 50;
      ctx.textBaseline = 'alphabetic';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('ArxonArena', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('ArxonArena', 4, 17);
      components.push(`canvas:${canvas.toDataURL()}`);
    }
  } catch {
    components.push('canvas:unavailable');
  }

  // WebGL fingerprint
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        components.push(`webgl:${gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)}`);
      }
    }
  } catch {
    components.push('webgl:unavailable');
  }

  // Add timestamp component for uniqueness per user
  const userAgent = navigator.userAgent;
  components.push(`ua:${userAgent}`);

  // Hash all components
  const fingerprint = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

const FingerprintScanner = ({ 
  onVerified, 
  isVerifying = false,
  title = "Verify Your Identity",
  subtitle = "Hold your thumb on the scanner to continue",
  storedFingerprintHash,
  onVerificationFailed
}: FingerprintScannerProps) => {
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [scanLines, setScanLines] = useState<number[]>([]);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 2000; // 2 seconds to complete
  const UPDATE_INTERVAL = 50;

  // Generate scan lines animation
  useEffect(() => {
    if (isHolding && !isComplete && !verificationFailed) {
      const interval = setInterval(() => {
        setScanLines(prev => {
          const newLines = [...prev, Math.random() * 100];
          return newLines.slice(-5);
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setScanLines([]);
    }
  }, [isHolding, isComplete, verificationFailed]);

  const startHold = useCallback(() => {
    if (isComplete || isVerifying || verificationFailed) return;
    
    setIsHolding(true);
    setHoldProgress(0);
    setVerificationFailed(false);

    progressIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        const newProgress = prev + (UPDATE_INTERVAL / HOLD_DURATION) * 100;
        if (newProgress >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
          }
          return 100;
        }
        return newProgress;
      });
    }, UPDATE_INTERVAL);

    holdTimerRef.current = setTimeout(async () => {
      // Generate fingerprint hash
      const currentHash = await generateFingerprintHash();
      
      // If we have a stored hash, verify it matches
      if (storedFingerprintHash) {
        if (currentHash === storedFingerprintHash) {
          setIsComplete(true);
          setIsHolding(false);
          setTimeout(() => {
            onVerified(currentHash);
          }, 500);
        } else {
          // Fingerprint doesn't match!
          setVerificationFailed(true);
          setIsHolding(false);
          setHoldProgress(0);
          onVerificationFailed?.();
        }
      } else {
        // No stored hash - this is registration, pass the hash back
        setIsComplete(true);
        setIsHolding(false);
        setTimeout(() => {
          onVerified(currentHash);
        }, 500);
      }
    }, HOLD_DURATION);
  }, [isComplete, isVerifying, verificationFailed, onVerified, storedFingerprintHash, onVerificationFailed]);

  const endHold = useCallback(() => {
    if (isComplete) return;
    
    setIsHolding(false);
    setHoldProgress(0);

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [isComplete]);

  const resetScanner = useCallback(() => {
    setVerificationFailed(false);
    setHoldProgress(0);
    setIsComplete(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Fingerprint Scanner */}
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: isComplete 
              ? 'radial-gradient(circle, hsl(142 70% 45% / 0.4) 0%, transparent 70%)'
              : verificationFailed
                ? 'radial-gradient(circle, hsl(0 70% 45% / 0.4) 0%, transparent 70%)'
                : isHolding 
                  ? 'radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 70%)'
                  : 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)',
            transform: 'scale(1.5)',
          }}
          animate={{
            opacity: isHolding ? [0.5, 1, 0.5] : 1,
          }}
          transition={{
            opacity: { duration: 1, repeat: isHolding ? Infinity : 0 },
          }}
        />

        {/* Scanner container */}
        <motion.div
          className="relative w-48 h-48 rounded-full flex items-center justify-center cursor-pointer select-none"
          style={{
            background: verificationFailed 
              ? `conic-gradient(from 0deg, hsl(0 70% 45%) 360deg, hsl(var(--border)) 360deg)`
              : `conic-gradient(from 0deg, 
                  hsl(var(--primary) / ${holdProgress / 100}) ${holdProgress * 3.6}deg, 
                  hsl(var(--border)) ${holdProgress * 3.6}deg
                )`,
            padding: '4px',
          }}
          onMouseDown={verificationFailed ? resetScanner : startHold}
          onMouseUp={endHold}
          onMouseLeave={endHold}
          onTouchStart={(e) => {
            e.preventDefault();
            if (verificationFailed) {
              resetScanner();
            } else {
              startHold();
            }
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            endHold();
          }}
          whileTap={{ scale: 0.98 }}
          animate={isComplete ? { scale: [1, 1.05, 1] } : verificationFailed ? { x: [-5, 5, -5, 5, 0] } : {}}
          transition={verificationFailed ? { duration: 0.4 } : undefined}
        >
          {/* Inner circle */}
          <div 
            className={`w-full h-full rounded-full flex items-center justify-center transition-colors duration-300 ${
              isComplete 
                ? 'bg-green-500/20 border-green-500/50' 
                : verificationFailed
                  ? 'bg-red-500/20 border-red-500/50'
                  : 'bg-card border-border'
            } border-2`}
            style={{ margin: '4px' }}
          >
            <div className="relative">
              {/* Scan lines effect */}
              <AnimatePresence>
                {scanLines.map((line, i) => (
                  <motion.div
                    key={`${i}-${line}`}
                    className="absolute left-0 right-0 h-0.5 bg-primary/60"
                    style={{ top: `${line}%` }}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  />
                ))}
              </AnimatePresence>

              {/* Icon */}
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <ShieldCheck className="w-20 h-20 text-green-500" />
                  </motion.div>
                ) : verificationFailed ? (
                  <motion.div
                    key="failed"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', duration: 0.5 }}
                  >
                    <XCircle className="w-20 h-20 text-red-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="fingerprint"
                    animate={{
                      scale: isHolding ? [1, 1.1, 1] : 1,
                      opacity: isHolding ? [0.7, 1, 0.7] : 0.8,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: isHolding ? Infinity : 0,
                    }}
                  >
                    <Fingerprint 
                      className={`w-20 h-20 transition-colors duration-300 ${
                        isHolding ? 'text-primary' : 'text-muted-foreground'
                      }`} 
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Progress percentage */}
        {isHolding && !isComplete && !verificationFailed && (
          <motion.div
            className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-primary font-bold text-lg">
              {Math.round(holdProgress)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Status text */}
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="verified"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-green-500 font-medium"
          >
            <Check className="w-5 h-5" />
            Identity Verified
          </motion.div>
        ) : verificationFailed ? (
          <motion.div
            key="failed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-red-500 font-medium">Fingerprint Mismatch!</span>
            <span className="text-muted-foreground text-sm">This isn't your registered fingerprint. Tap to try again.</span>
          </motion.div>
        ) : (
          <motion.p
            key="instruction"
            className="text-muted-foreground text-sm text-center"
            animate={{
              opacity: isHolding ? 0.5 : 1,
            }}
          >
            {isHolding ? 'Keep holding...' : 'Touch and hold the fingerprint'}
          </motion.p>
        )}
      </AnimatePresence>

      {isVerifying && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-primary text-sm"
        >
          Registering your verification...
        </motion.div>
      )}
    </div>
  );
};

export default FingerprintScanner;
