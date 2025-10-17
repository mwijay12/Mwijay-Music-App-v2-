import React from 'react';

const UploadToast: React.FC<{ progress: { current: number; total: number; fileName: string } | null; onClose: () => void }> = ({ progress, onClose }) => {
    if (!progress || progress.total === 0) return null;
    
    const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;
    const isComplete = progress.current === progress.total;

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[100]">
            <div className="liquid-glass-pane rounded-full p-3 shadow-lg">
                <div className="flex justify-between items-center mb-1 px-2">
                    <p className="text-sm font-bold">{isComplete ? 'Import Complete!' : 'Importing Media...'}</p>
                    <p className="text-xs font-mono text-neutral-300">{progress.current} / {progress.total}</p>
                </div>
                <div className="w-full bg-black/20 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-[var(--primary-accent)] to-[var(--secondary-accent-start)] h-1.5 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
                </div>
            </div>
        </div>
    );
};

export default UploadToast;
