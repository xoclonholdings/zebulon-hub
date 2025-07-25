import React from 'react';

interface ZebulonLogoProps {
  className?: string;
  size?: number;
}

const ZebulonLogo: React.FC<ZebulonLogoProps> = ({ className = "", size = 24 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer ring - represents the AI system boundary */}
      <circle
        cx="24"
        cy="24"
        r="22"
        stroke="url(#gradient1)"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      
      {/* Inner neural network pattern */}
      <g opacity="0.9">
        {/* Central core - Zebulon's consciousness */}
        <circle cx="24" cy="24" r="6" fill="url(#gradient2)" />
        
        {/* Neural connections */}
        <path
          d="M24 18 L30 12 M24 18 L18 12 M24 30 L30 36 M24 30 L18 36 M18 24 L12 18 M18 24 L12 30 M30 24 L36 18 M30 24 L36 30"
          stroke="url(#gradient3)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        
        {/* Neural nodes */}
        <circle cx="30" cy="12" r="2" fill="#60A5FA" />
        <circle cx="18" cy="12" r="2" fill="#60A5FA" />
        <circle cx="30" cy="36" r="2" fill="#60A5FA" />
        <circle cx="18" cy="36" r="2" fill="#60A5FA" />
        <circle cx="12" cy="18" r="2" fill="#60A5FA" />
        <circle cx="12" cy="30" r="2" fill="#60A5FA" />
        <circle cx="36" cy="18" r="2" fill="#60A5FA" />
        <circle cx="36" cy="30" r="2" fill="#60A5FA" />
      </g>
      
      {/* Z symbol in the center */}
      <path
        d="M19 20 L29 20 L19 28 L29 28"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        
        <radialGradient id="gradient2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#3B82F6" />
        </radialGradient>
        
        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export default ZebulonLogo;