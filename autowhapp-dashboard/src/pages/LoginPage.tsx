import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Hero from '../components/Hero';
import AnimatedGradientText from '../components/AnimatedText';
import { Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { loginWithRedirect } = useAuth0();

  return (
    <div className="relative">
      <Link 
        to="/pricing" 
        className="absolute top-6 right-12 text-white font-poppins text-lg font-bold underline decoration-2 decoration-white z-50"
      >
        Pricing
      </Link>
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
    </div>
  );
};

export default LoginPage;