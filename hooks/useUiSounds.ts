import { useCallback, useRef } from 'react';

export const useUiSounds = () => {
    const audioContextRef = useRef<AudioContext | null>(null);

    const getContext = () => {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            try {
                if (typeof window !== 'undefined') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
                }
            } catch (e) {
                console.error("Web Audio API is not supported in this browser.", e);
                return null;
            }
        }
        return audioContextRef.current;
    };

    const playTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.5) => {
        const context = getContext();
        if (!context) return;

        if (context.state === 'suspended') {
            context.resume();
        }

        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        const now = context.currentTime;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(freq, now);
        
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(volume * 0.1, now + 0.01); 
        
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        oscillator.start(now);
        oscillator.stop(now + duration);
    }, []);

    const playNotificationSound = useCallback((type: 'success' | 'info' | 'error') => {
        switch (type) {
            case 'success':
                playTone(800, 0.1, 'sine', 0.3);
                setTimeout(() => playTone(1200, 0.15, 'sine', 0.3), 100);
                break;
            case 'error':
                playTone(200, 0.15, 'sawtooth', 0.2);
                setTimeout(() => playTone(150, 0.2, 'sawtooth', 0.2), 120);
                break;
            case 'info':
            default:
                playTone(623.25, 0.15, 'triangle', 0.3); // D5
                break;
        }
    }, [playTone]);

    const playToggleSound = useCallback(() => {
        playTone(900, 0.08, 'sine', 0.2);
        setTimeout(() => playTone(1200, 0.1, 'sine', 0.2), 60);
    }, [playTone]);

    return { playNotificationSound, playToggleSound };
};
