import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Main gradient */}
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          
          {/* Inner gradient */}
          <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1f2937" />
            <stop offset="100%" stopColor="#374151" />
          </linearGradient>
          
          {/* Text gradient */}
          <linearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>
        
        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#logoGradient)"
          stroke="#92400e"
          strokeWidth="2"
        />
        
        {/* Inner circle */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="url(#innerGradient)"
          stroke="#fbbf24"
          strokeWidth="1"
        />
        
        {/* Decorative ring */}
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="1"
          strokeDasharray="4,2"
          opacity="0.6"
        />
        
        {/* Center design - CO letters with modern styling */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill="url(#textGradient)"
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >
          CO
        </text>
        
        {/* Decorative dots in cardinal directions */}
        <circle cx="50" cy="20" r="2.5" fill="#fbbf24" />
        <circle cx="80" cy="50" r="2.5" fill="#fbbf24" />
        <circle cx="50" cy="80" r="2.5" fill="#fbbf24" />
        <circle cx="20" cy="50" r="2.5" fill="#fbbf24" />
        
        {/* Small accent dots */}
        <circle cx="35" cy="35" r="1.5" fill="#f59e0b" opacity="0.8" />
        <circle cx="65" cy="35" r="1.5" fill="#f59e0b" opacity="0.8" />
        <circle cx="35" cy="65" r="1.5" fill="#f59e0b" opacity="0.8" />
        <circle cx="65" cy="65" r="1.5" fill="#f59e0b" opacity="0.8" />
      </svg>
    </div>
  );
};

export default Logo;