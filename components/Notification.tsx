import React, { useState, useEffect } from 'react';

interface NotificationProps {
    message: string;
    type: 'success' | 'info' | 'error';
    icon?: string;
}

const Notification: React.FC<NotificationProps> = ({ message, type, icon }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2800); // Should be slightly less than the timeout in App.tsx

        return () => clearTimeout(timer);
    }, [message]);
    
    const defaultIconClasses = {
        success: "fas fa-check-circle",
        info: "fas fa-info-circle",
        error: "fas fa-exclamation-circle",
    };
    
    const finalIconClass = icon ? `fas ${icon}` : defaultIconClasses[type];

    const iconColor = {
        success: 'var(--primary-accent)',
        info: '#6955FF',
        error: '#FF6B6B'
    }[type];

    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}>
            <div className="liquid-glass-pane px-6 py-3 rounded-full text-sm font-bold shadow-lg flex items-center">
                <i className={`${finalIconClass} mr-2`} style={{ color: iconColor }}></i>
                <span>{message}</span>
            </div>
        </div>
    );
};

export default Notification;