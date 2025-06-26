import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Clock, Users } from 'lucide-react';

const HeroSection = () => {
  const scrollToContact = () => {
    const element = document.getElementById('contacto');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="inicio" className="pt-20 pb-16 bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-autowhapp-black leading-tight">
                Autowhapp: Automatiza tu{' '}
                <span className="text-autowhapp-blue">Atención al Cliente</span>{' '}
                con WhatsApp
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Gestiona reservas, pedidos y comunicaciones con un bot personalizable 
                que impulsa tu negocio las 24 horas del día.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-autowhapp-blue" />
                <span className="text-sm font-medium">Soporte 24/7</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-autowhapp-blue" />
                <span className="text-sm font-medium">+500 PYMES</span>
              </div>
              <div className="flex items-center space-x-2">
                <MessageCircle className="h-5 w-5 text-autowhapp-blue" />
                <span className="text-sm font-medium">Integración Simple</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={scrollToContact}
                size="lg" 
                className="bg-autowhapp-blue hover:bg-blue-700 text-white px-8 py-3 text-lg group"
              >
                Comienza tu Prueba Gratis
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                onClick={scrollToContact}
                variant="outline" 
                size="lg" 
                className="border-autowhapp-blue text-autowhapp-blue hover:bg-autowhapp-blue hover:text-white px-8 py-3 text-lg"
              >
                Solicita una Demo
              </Button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Mujer empresaria usando laptop para gestionar atención al cliente"
                className="w-full h-auto rounded-xl"
              />
            </div>
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 bg-autowhapp-blue text-white p-4 rounded-full shadow-lg animate-bounce">
              <MessageCircle className="h-6 w-6" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-green-500 text-white p-3 rounded-full shadow-lg">
              <span className="text-sm font-bold">24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;