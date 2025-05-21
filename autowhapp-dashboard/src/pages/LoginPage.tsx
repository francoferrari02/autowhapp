import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Hero from '../components/Hero';
import AnimatedGradientText from '../components/AnimatedText';

const LoginPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

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
          className="text-xl font-bold font-poppins"
          duration={6}
        >
          Automatización inteligente para tu negocio
        </AnimatedGradientText>
      }
      actions={[
        { label: 'Iniciar Sesión', onClick: () => loginWithRedirect(), variant: 'default' }
      ]}
    />
  );
};

export default LoginPage;