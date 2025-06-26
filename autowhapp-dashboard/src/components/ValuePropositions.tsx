import { Clock, Zap, Bot, BarChart3 } from 'lucide-react';

const ValuePropositions = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Soporte 24/7',
      description: 'Nunca pierdas una consulta de cliente. Tu bot responde automáticamente a cualquier hora del día.',
    },
    {
      icon: Zap,
      title: 'Integración Sencilla',
      description: 'Conecta fácilmente con tus sistemas existentes. Configuración en minutos, no horas.',
    },
    {
      icon: Bot,
      title: 'Bots Personalizables',
      description: 'Adapta el bot a las necesidades específicas de tu negocio con respuestas y flujos únicos.',
    },
    {
      icon: BarChart3,
      title: 'Análisis en Tiempo Real',
      description: 'Toma decisiones basadas en datos con métricas detalladas de interacciones y conversiones.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-autowhapp-black mb-4">
            ¿Por qué elegir Autowhapp?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descubre cómo nuestra plataforma puede transformar la forma en que tu negocio 
            interactúa con los clientes.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow group"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6 group-hover:bg-autowhapp-blue group-hover:text-white transition-colors">
                <benefit.icon className="h-8 w-8 text-autowhapp-blue group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-autowhapp-black mb-3">
                {benefit.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValuePropositions;