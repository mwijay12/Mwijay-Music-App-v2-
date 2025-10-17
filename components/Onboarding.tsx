import React, { useState, useRef } from 'react';
import { getRandomCoverArt } from '../constants';

const Onboarding: React.FC<{ onComplete: (data: {name: string, avatarUrl: string}) => void }> = ({ onComplete }) => {
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(getRandomCoverArt());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setAvatarUrl(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = () => {
        if (name.trim()) {
            onComplete({ name, avatarUrl });
        } else {
            const nameInput = document.getElementById('onboarding-name-input');
            nameInput?.classList.add('animate-shake');
            setTimeout(() => nameInput?.classList.remove('animate-shake'), 500);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 text-white onboarding-container">
            <div className="text-center mb-12">
                <h1 className="text-2xl text-white/80 name-anim-fade-in" style={{ animationDelay: '0.2s' }}>Welcome to</h1>
                <h2 className="text-7xl name-anim-fade-in text-glass-chrome" style={{ animationDelay: '0.5s' }}>
                    Mwijay Music
                </h2>
            </div>
            
            <div className="relative mb-8 name-anim-zoom-in" style={{ animationDelay: '0.8s' }}>
                <div className="w-32 h-32 rounded-full pulsing-avatar-ring"></div>
                <img src={avatarUrl} alt="Avatar" className="absolute inset-0 m-auto w-28 h-28 rounded-full object-cover border-4 border-[var(--surface-color)]"/>
                <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-10 h-10 bg-[var(--primary-accent)] text-black rounded-full flex items-center justify-center transition-transform hover:scale-110 border-2 border-[var(--surface-color)]">
                    <i className="fas fa-pen"></i>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden"/>
            </div>
            
            <div className="w-full max-w-sm mb-12 name-anim-slide-up" style={{ animationDelay: '1s' }}>
                 <input 
                    id="onboarding-name-input"
                    type="text" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="What should we call you?" 
                    className="w-full bg-black/30 text-white placeholder:text-white/60 p-4 rounded-full border-2 border-transparent text-center text-lg focus:border-[var(--primary-accent)] focus:ring-0 transition-all" 
                    maxLength={30}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
            </div>

            <button onClick={handleSubmit} className="get-started-button w-full max-w-sm font-bold py-4 rounded-full transition-all duration-300 text-black text-lg flex items-center justify-center gap-2 name-anim-zoom-in" style={{ animationDelay: '1.2s' }}>
                <span>Get Started</span>
                <i className="fas fa-arrow-right"></i>
            </button>
        </div>
    );
};

export default Onboarding;
