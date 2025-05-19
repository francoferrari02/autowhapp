import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import logo from '../assets/LogoAutoWhappBlanco.png';

interface HeroProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: { label: string; onClick: () => void; variant?: 'default' | 'outline' }[];
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, actions }) => {
  return (
    <section className="relative min-h-screen bg-black flex items-center justify-center overflow-hidden">
      
      {/* Efecto de luz en forma de campana */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[100vh]"
        style={{ 
          background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.8) 0%, rgba(37,99,235,0.4) 40%, transparent 80%)',
          filter: 'blur(30px)' 
        }}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0.99 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4">
        {title && (
          <div className="flex flex-col items-center">
            <img src={logo} alt="AutoWhapp Logo" className="w-48 h-48 mb-6" />
            <h1 className="text-5xl font-bold text-white font-poppins">{title}</h1>
          </div>
        )}
        {subtitle && <div className="text-gray-300 font-poppins mt-4 max-w-md">{subtitle}</div>}
        {actions && actions.length > 0 && (
          <div className="flex gap-4 mt-8">
            {actions.map((action, index) => (
              <Button
                key={index}
                className="transform transition duration-300 hover:scale-105"
                variant={action.variant === 'outline' ? 'outlined' : 'contained'}
                onClick={action.onClick}
                sx={{
                  color: action.variant === 'outline' ? '#3b82f6' : '#FFFFFF',
                  borderColor: '#3b82f6',
                  backgroundColor: action.variant === 'outline' ? 'transparent' : '#3b82f6',
                  borderBlockStyle: 'border-top-style',
                  '&:hover': {
                    backgroundColor: action.variant === 'outline' ? '#3b82f6' : '#2563EB',
                    color: '#FFFFFF',
                  },
                  fontFamily: 'Poppins',
                  fontSize: '1rem',
                  padding: '8px 16px',
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;