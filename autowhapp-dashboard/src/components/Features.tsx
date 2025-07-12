import { Calendar, Package, Bell, BarChart3, CreditCard } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Reservas',
      description: 'Gestiona citas y reservas sin esfuerzo. Automatiza confirmaciones y recordatorios.',
      color: 'bg-blue-500',
    },
    {
      icon: Package,
      title: 'Pedidos',
      description: 'Administra pedidos de productos e inventario directamente desde WhatsApp.',
      color: 'bg-green-500',
    },
    {
      icon: Bell,
      title: 'Recordatorios',
      description: 'Envía recordatorios automáticos y promociones personalizadas a tus clientes.',
      color: 'bg-orange-500',
    },
    {
      icon: BarChart3,
      title: 'Analíticas',
      description: 'Obtén información valiosa sobre el comportamiento y preferencias de tus clientes.',
      color: 'bg-purple-500',
    },
    {
      icon: CreditCard,
      title: 'Pagos',
      description: 'Integra pasarelas de pago para transacciones fluidas y seguras.',
      color: 'bg-red-500',
    },
  ];

  return (
    <section id="caracteristicas" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-autowhapp-black mb-4">
            Funcionalidades Poderosas para tu Negocio
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Descubre todos los módulos que harán crecer tu negocio y mejorarán 
            la experiencia de tus clientes.
          </p>
        </div>

        <div className="space-y-8">
          {/* Primera fila: Reservas, Pedidos, Recordatorios */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.slice(0, 3).map((feature, index) => (
              <div 
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-xl transition-shadow group hover:border-autowhapp-blue"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-autowhapp-black mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Segunda fila: Analíticas y Pagos centradas */}
          <div className="grid grid-cols-2 gap-8 justify-center max-w-4xl mx-auto">
            {features.slice(3).map((feature, index) => (
              <div 
                key={index + 3}
                className="bg-white border border-gray-200 rounded-xl p-8 hover:shadow-xl transition-shadow group hover:border-autowhapp-blue"
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 ${feature.color} rounded-xl mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold text-autowhapp-black mb-3">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;