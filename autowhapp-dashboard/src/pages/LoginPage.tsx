import React from 'react';
import { useNavigate } from 'react-router-dom';
import Hero from '../components/Hero';
import AnimatedGradientText from '../components/AnimatedText';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => navigate('/dashboard');
  const handleRegister = () => console.log('Register clicked');

  return (
    <Hero
      title={
        <AnimatedGradientText 
          className="text-5xl font-bold font-poppins"
          duration={6}
        >
          AutoWhapp
        </AnimatedGradientText>
      }
      subtitle={
        <AnimatedGradientText
          className="text-xl font-bold font-poppins" // Added font-bold aquí
          duration={6}
          
        >
          Automatización inteligente para tu negocio
        </AnimatedGradientText>
      }
      actions={[
        { label: 'Iniciar Sesión', onClick: handleLogin, variant: 'default' },
        { label: 'Registrarse', onClick: handleRegister, variant: 'outline' },
      ]}
    />
  );
};

export default LoginPage;