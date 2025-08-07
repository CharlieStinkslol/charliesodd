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
        {/* Background circle with gradient */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="chipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>
        
        {/* Main circle background */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="url(#logoGradient)"
          stroke="#92400e"
          strokeWidth="2"
        />
        
        {/* Casino chip design */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="url(#chipGradient)"
          stroke="#374151"
          strokeWidth="1"
        />
        
        {/* Inner circle */}
        <circle
          cx="50"
          cy="50"
          r="25"
          fill="none"
          stroke="#374151"
          strokeWidth="1"
          strokeDasharray="3,2"
        />
        
        {/* Center design - CO letters */}
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontSize="20"
          fontWeight="bold"
          fill="#1f2937"
          fontFamily="Arial, sans-serif"
        >
          CO
        </text>
        
        {/* Decorative elements */}
        <circle cx="30" cy="30" r="3" fill="#fbbf24" />
        <circle cx="70" cy="30" r="3" fill="#fbbf24" />
        <circle cx="30" cy="70" r="3" fill="#fbbf24" />
        <circle cx="70" cy="70" r="3" fill="#fbbf24" />
        
        {/* Dice dots for casino theme */}
        <circle cx="25" cy="50" r="1.5" fill="#374151" />
        <circle cx="75" cy="50" r="1.5" fill="#374151" />
      </svg>
    </div>
  );
};

export default Logo;