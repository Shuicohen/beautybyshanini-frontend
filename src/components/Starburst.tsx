import React from 'react';
import './AnimatedBackground.css';

interface StarburstProps {
  className?: string;
}

const Starburst = React.forwardRef<SVGSVGElement, StarburstProps>(
  ({ className = '' }, ref) => {
    return (
      <svg
        ref={ref}
        className={`starburst ${className}`}
        width="200"
        height="200"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
      <defs>
        <radialGradient id="starburstGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FF9F70" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FF6E8A" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFC8A8" stopOpacity="0.4" />
        </radialGradient>
        <filter id="starburstBlur">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" />
        </filter>
      </defs>
      {/* 8-point starburst */}
      <g filter="url(#starburstBlur)">
        {/* Top point */}
        <path
          d="M 100 20 L 110 50 L 140 50 L 115 70 L 125 100 L 100 85 L 75 100 L 85 70 L 60 50 L 90 50 Z"
          fill="url(#starburstGradient)"
          opacity="0.85"
        />
        {/* Additional rays for more glow */}
        <circle cx="100" cy="100" r="40" fill="url(#starburstGradient)" opacity="0.6" />
        <circle cx="100" cy="100" r="25" fill="url(#starburstGradient)" opacity="0.8" />
      </g>
      </svg>
    );
  }
);

Starburst.displayName = 'Starburst';

export default Starburst;

