import React, { useMemo } from 'react';
import type { ProfileData } from '../types';

const BackgroundEffects: React.FC<{ settings: ProfileData['settings']['backgroundEffects'] }> = React.memo(({ settings }) => {
    if (!settings.enabled || settings.style === 'none') return null;

    const effectContent = useMemo(() => {
        switch (settings.style) {
            case 'constellationDrift':
                return Array.from({ length: 50 }).map((_, i) => (
                    <div key={i} className="constellation-star" style={{
                        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        // @ts-ignore
                        '--x-end': `${(Math.random() - 0.5) * 80}px`,
                        '--y-end': `${(Math.random() - 0.5) * 80}px`,
                    }} />
                ));
            case 'spiritRise':
                return Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="spirit-particle" style={{
                        left: `${Math.random() * 100}%`,
                        width: `${Math.random() * 5 + 2}px`, height: `${Math.random() * 5 + 2}px`,
                        animationDuration: `${Math.random() * 15 + 10}s`,
                        animationDelay: `${Math.random() * 25}s`,
                    }} />
                ));
            case 'warpPulse':
                 return Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="ripple-circle" style={{
                        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 4}s`,
                    }} />
                ));
            case 'fallingNotes':
                const notes = ['🎵', '🎶', '🎼', '♬'];
                return Array.from({ length: 30 }).map((_, i) => (
                    <span key={i} className="falling-note" style={{
                        left: `${Math.random() * 100}%`,
                        fontSize: `${Math.random() * 12 + 10}px`,
                        animationDuration: `${Math.random() * 8 + 6}s`,
                        animationDelay: `${Math.random() * 14}s`,
                    }}>
                        {notes[i % notes.length]}
                    </span>
                ));
            case 'cosmicDust':
                return Array.from({ length: 70 }).map((_, i) => {
                    const size = Math.random() * 2 + 1;
                    return (
                        <div key={i} className="cosmic-dust-particle" style={{
                            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
                            width: `${size}px`, height: `${size}px`,
                            animationDuration: `${Math.random() * 15 + 10}s`,
                            animationDelay: `${Math.random() * 25}s`,
                            // @ts-ignore
                            '--x-end': `${(Math.random() - 0.5) * 200}px`,
                            '--y-end': `${(Math.random() - 0.5) * 200}px`,
                            '--s-end': `${Math.random() * 0.5 + 0.5}`,
                        }} />
                    )
                });
            case 'fireflies':
                return Array.from({ length: 25 }).map((_, i) => (
                    <div key={i} className="firefly" style={{
                        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 10 + 5}s`,
                        animationDelay: `${Math.random() * 15}s`,
                         // @ts-ignore
                        '--tx': `${(Math.random() - 0.5) * 80}px`,
                        '--ty': `${(Math.random() - 0.5) * 80}px`,
                    }} />
                ));
            case 'bubbles':
                return Array.from({ length: 20 }).map((_, i) => {
                    const size = Math.random() * 40 + 10;
                    return (
                        <div key={i} className="bubble" style={{
                            left: `${Math.random() * 100}%`,
                            width: `${size}px`, height: `${size}px`,
                            animationDuration: `${Math.random() * 15 + 10}s`,
                            animationDelay: `${Math.random() * 25}s`,
                        }} />
                    )
                });
            case 'warpSpeed':
                return (
                    <div className="warp-speed-container">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div key={i} className="warp-star" style={{
                                animationDelay: `${Math.random() * 3}s`,
                                transform: `rotate(${Math.random() * 360}deg) translateZ(-200px) translateX(${(Math.random() - 0.5) * 400}px) translateY(${(Math.random() - 0.5) * 400}px)`,
                            }} />
                        ))}
                    </div>
                );
            case 'stardust':
                 return Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="stardust-particle" style={{
                        top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 10 + 20}s, ${Math.random() * 4 + 3}s`,
                        animationDelay: `${Math.random() * 30}s, ${Math.random() * 7}s`,
                         // @ts-ignore
                        '--tx': `${(Math.random() - 0.5) * 200}px`,
                        '--ty': `${(Math.random() - 0.5) * 200}px`,
                    }} />
                ));
            case 'energyFlow':
                 return Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="energy-flow-line" style={{
                        top: `${Math.random() * 100}%`,
                        animationDuration: `${Math.random() * 3 + 2}s`,
                        animationDelay: `${Math.random() * 5}s`,
                    }} />
                ));
            case 'twinklingStars':
                return Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="twinkle-star" style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 3}s`,
                    }} />
                ));
            default:
                return null;
        }
    }, [settings.style]);
    
    return (
        <div className="background-effects-container">
            {effectContent}
        </div>
    );
});

export default BackgroundEffects;
