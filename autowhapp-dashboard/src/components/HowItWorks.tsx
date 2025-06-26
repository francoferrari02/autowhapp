import { UserPlus, Link, Settings } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      icon: UserPlus,
      title: 'Regístrate',
      description: 'Crea una cuenta y configura el perfil de tu negocio en pocos minutos.',
    },
    {
      number: 2,
      icon: Link,
      title: 'Conecta',
      description: 'Vincula tu número de WhatsApp con Autowhapp de forma segura y sencilla.',
    },
    {
      number: 3,
      icon: Settings,
      title: 'Automatiza',
      description: 'Configura tu bot personalizado y comienza a automatizar la atención al cliente.',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-autowhapp-black mb-4">
            Empieza en 3 Pasos Simples
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Configurar Autowhapp es más fácil de lo que imaginas. 
            Comienza a automatizar tu negocio hoy mismo.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-autowhapp-blue to-blue-300"></div>
          
          {steps.map((step, index) => (
            <div key={index} className="text-center relative">
              {/* Step number */}
              <div className="inline-flex items-center justify-center w-12 h-12 bg-autowhapp-blue text-white rounded-full text-xl font-bold mb-6 relative z-10">
                {step.number}
              </div>
              
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white border-4 border-blue-100 rounded-full mb-6 shadow-lg">
                <step.icon className="h-10 w-10 text-autowhapp-blue" />
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-semibold text-autowhapp-black mb-4">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;