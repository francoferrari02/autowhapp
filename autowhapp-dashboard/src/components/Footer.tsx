import { MessageCircle, Linkedin, Twitter, Mail, Phone } from 'lucide-react';

const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-autowhapp-black text-white py-16 rounded-xl mx-4 mb-4">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-8 w-8 text-autowhapp-blue" />
              <span className="text-xl font-bold">Autowhapp</span>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Automatiza la atención al cliente de tu negocio con WhatsApp. 
              Gestiona reservas, pedidos y comunicaciones 24/7.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://linkedin.com/company/autowhapp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-autowhapp-blue transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com/autowhapp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-autowhapp-blue transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Navegación</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => scrollToSection('inicio')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Inicio
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('caracteristicas')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Características
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('precios')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Precios
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection('contacto')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Contacto
                </button>
              </li>
            </ul>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Producto</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Gestión de Reservas</li>
              <li>Administración de Pedidos</li>
              <li>Recordatorios Automáticos</li>
              <li>Analíticas en Tiempo Real</li>
              <li>Integración de Pagos</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail className="h-4 w-4" />
                <span>autowhapp@gmail.com</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Phone className="h-4 w-4" />
                <span>+54 (911) 1234-5678</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Autowhapp. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Términos de Servicio
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                Política de Privacidad
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;