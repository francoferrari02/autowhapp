// components/AnimatedText.tsx
import React from 'react';

interface AnimatedTextProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

const AnimatedGradientText = ({
  children,
  className = '',
  duration = 20
}: AnimatedTextProps) => {
  return (
    <span className={`relative inline-block ${className}`}>
      <span className={`
        absolute inset-0
        bg-gradient-to-r
        from-white via-blue-300 to-white
        animate-gradient-sweep
        bg-[length:400%_100%]
        bg-clip-text
        text-transparent
      `} style={{ animationDuration: `${duration}s` }}>
        {children}
      </span>
      {/* Texto visible para accesibilidad */}
      <span className="opacity-0">{children}</span>
    </span>
  );
};

export default AnimatedGradientText;