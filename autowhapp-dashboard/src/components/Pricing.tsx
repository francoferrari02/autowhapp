import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Pricing = () => {
  const plans = [
    {
      name: 'Plan Servicios',
      description: 'Ideal para negocios de servicios',
      price: '$50.000',
      features: ['Reservas automatizadas', 'Recordatorios', 'Soporte básico', 'Hasta 100 clientes'],
      popular: false,
    },
    {
      name: 'Plan Servicios Plus',
      description: 'Servicios con análisis avanzados',
      price: '$70.000',
      features: ['Todo en Plan Servicios', 'Analíticas avanzadas', 'Soporte prioritario', 'Hasta 500 clientes'],
      popular: false,
    },
    {
      name: 'Plan Tienda',
      description: 'Perfecto para comercios minoristas',
      price: '$60.000',
      features: ['Gestión de pedidos', 'Inventario básico', 'Analíticas', 'Hasta 200 productos'],
      popular: false,
    },
    {
      name: 'Plan Tienda Plus',
      description: 'Comercios con pagos integrados',
      price: '$80.000',
      features: ['Todo en Plan Tienda', 'Pagos integrados', 'Inventario avanzado', 'Productos ilimitados'],
      popular: false,
    },
    {
      name: 'Plan Premium',
      description: 'Solución completa para tu negocio',
      price: '$100.000',
      features: ['Todos los módulos', 'Reservas + Pedidos + Pagos', 'Analíticas premium', 'Soporte 24/7', 'Clientes ilimitados'],
      popular: true,
    },
    {
      name: 'Plan Personalizado',
      description: 'Soluciones a medida',
      price: 'Desde $70.000',
      features: ['Funcionalidades específicas', 'Integraciones personalizadas', 'Soporte dedicado', 'Escalabilidad empresarial'],
      popular: false,
    },
  ];

  const scrollToContact = () => {
    const element = document.getElementById('contacto');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="precios" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-autowhapp-black mb-4">
            Elige el Plan Perfecto para tu Negocio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Planes flexibles que se adaptan al tamaño y necesidades de tu empresa. 
            Comienza gratis y escala cuando necesites.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow relative ${
                plan.popular ? 'border-2 border-autowhapp-blue transform scale-105' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-autowhapp-blue text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center">
                    <Star className="h-4 w-4 mr-1" fill="currentColor" />
                    Más Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-autowhapp-black mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 mb-4">
                  {plan.description}
                </p>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-autowhapp-black">
                    {plan.price}
                  </span>
                  {!plan.price.includes('Desde') && plan.price !== 'Consultar' && (
                    <span className="text-gray-600">/mes</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={scrollToContact}
                className={`w-full py-3 ${
                  plan.popular
                    ? 'bg-autowhapp-blue hover:bg-blue-700 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-autowhapp-black'
                }`}
              >
                {plan.name === 'Plan Personalizado' ? 'Contáctanos' : 'Seleccionar Plan'}
              </Button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            ¿Necesitas ayuda para elegir el plan adecuado?
          </p>
          <Button 
            onClick={scrollToContact}
            variant="outline" 
            className="border-autowhapp-blue text-autowhapp-blue hover:bg-autowhapp-blue hover:text-white"
          >
            Habla con nuestro equipo
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;