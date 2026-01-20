'use client';

import React from 'react';

interface P402LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    variant?: 'black' | 'primary';
}

export function P402Logo({ className = '', size = 'md', variant = 'primary' }: P402LogoProps) {
    const sizeMap = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-9 h-9 text-xl',
        lg: 'w-12 h-12 text-3xl',
        xl: 'w-20 h-20 text-5xl',
    };

    const currentSize = sizeMap[size];
    const bgColor = variant === 'primary' ? 'bg-[#B6FF2E]' : 'bg-black';
    const textColor = variant === 'primary' ? 'text-black' : 'text-[#B6FF2E]';

    return (
        <div className={`relative ${currentSize} ${bgColor} border-2 border-black flex items-center justify-center ${className} overflow-visible`}
            style={{ borderRadius: '4px 12px 4px 4px' }}>

            {/* Price Tag Hole Punch */}
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-black rounded-full" />

            {/* The P */}
            <span className={`${textColor} font-black leading-none`}>P</span>

            {/* Structural accent lines to make it look like a physical tag */}
            <div className="absolute -bottom-0.5 -right-0.5 w-full h-full border-b border-r border-black/20 rounded-[inherit] pointer-events-none" />
        </div>
    );
}
