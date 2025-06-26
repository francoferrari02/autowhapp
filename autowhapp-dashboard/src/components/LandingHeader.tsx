// src/components/LandingHeader.tsx
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth0 } from '@auth0/auth0-react';
import logo from '../assets/LogoAutoWhappBlanco.png';

const LandingHeader = () => {
  const { loginWithRedirect } = useAuth0();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = () => {
    localStorage.setItem('justLoggedIn', 'true');
    loginWithRedirect();
  };

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-black text-white font-poppins z-50 rounded-b-2xl shadow-md">
      {/* Contenedor centrado al 95% */}
      <div className="w-[95%] mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <img src={logo} alt="Logo AutoWhapp" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold">Autowhapp</span>
        </div>

        {/* Navegación en desktop */}
        <div className="hidden md:flex items-center space-x-8">
          {['inicio', 'caracteristicas', 'precios', 'contacto'].map((sec) => (
            <button
              key={sec}
              onClick={() => scrollToSection(sec)}
              className="hover:text-gray-300 transition-colors"
            >
              {sec.charAt(0).toUpperCase() + sec.slice(1)}
            </button>
          ))}
          <Button onClick={handleLogin} className="bg-autowhapp-blue hover:bg-blue-700 text-white px-6 py-2">
            Iniciar Sesión
          </Button>
        </div>

        {/* Botón menú móvil */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
        </button>
      </div>

      {/* Menú móvil centrado */}
      {isMenuOpen && (
        <div className="md:hidden w-full bg-black/95 text-white rounded-b-2xl">
          <div className="w-[95%] mx-auto px-4 py-4 space-y-4">
            {['inicio', 'caracteristicas', 'precios', 'contacto'].map((sec) => (
              <button
                key={sec}
                onClick={() => scrollToSection(sec)}
                className="w-full text-left hover:text-gray-300 transition-colors"
              >
                {sec.charAt(0).toUpperCase() + sec.slice(1)}
              </button>
            ))}
            <Button onClick={handleLogin} className="bg-autowhapp-blue hover:bg-blue-700 text-white w-full py-2">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default LandingHeader;
