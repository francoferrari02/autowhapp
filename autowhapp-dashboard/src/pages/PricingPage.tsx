import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { CalendarIcon, ShoppingCartIcon, ChartBarIcon, CreditCardIcon, CogIcon } from '@heroicons/react/24/solid';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// Definición de los planes
const plans = [
  
  {
    name: 'Plan Servicios Plus',
    icon: <CalendarIcon className="text-sm w-12 h-12" />,
    modules: ['Chatbot', 'Reservas', 'Recordatorios', 'Analíticas'],
    description: 'Todo lo del plan Servicios más herramientas de análisis para optimizar tu negocio.',
    price: '30.000 ARS/mes'
  },
  {
    name: 'Plan Tienda',
    icon: <ShoppingCartIcon className="text-sm w-12 h-12" />,
    modules: ['Chatbot', 'Pedidos', 'Análisis'],
    description: 'Perfecto para tiendas que quieren gestionar pedidos y analizar su rendimiento.',
    price: '25.000 ARS/mes'
  },
  {
    name: 'Plan Tienda Plus',
    icon: <ShoppingCartIcon className="text-sm w-12 h-12" />,
    modules: ['Chatbot', 'Pedidos', 'Análisis', 'Gestión de Pagos'],
    description: 'Incluye todo del plan Tienda más gestión de pagos para una experiencia completa.',
    price: '35.000 ARS/mes'
  },
  {
    name: 'Plan Premium',
    icon: <ChartBarIcon className="text-sm w-12 h-12" />,
    modules: ['Chatbot', 'Pedidos', 'Reservas', 'Análisis', 'Recordatorios', 'Pagos'],
    description: 'El plan más completo para maximizar tu negocio con todas las funcionalidades.',
    price: '45.000 ARS/mes'
  },
  {
    name: 'Plan Personalizado',
    icon: <CogIcon className="text-sm w-12 h-12" />,
    modules: ['A medida'],
    description: 'Combina los módulos que necesites. ¡Habla con nuestro equipo para personalizarlo!',
    price: 'Precio a convenir'
  },
  {
    name: 'Plan Servicios',
    icon: <CalendarIcon className="text-sm w-12 h-12" />,
    modules: ['Chatbot', 'Reservas', 'Recordatorios'],
    description: 'Ideal para negocios de servicios que necesitan gestionar reservas y recordatorios.',
    price: '20.000 ARS/mes'
  }
];

// Componente para cada módulo
const ModuleTag: React.FC<{ module: string }> = ({ module }) => (
  <div className="bg-white text-black font-poppins text-sm px-4 py-2 rounded-md shadow-sm w-full mb-2 font-bold">
    {module}
  </div>
);

// Componente para cada plan
const PlanCard: React.FC<{ plan: typeof plans[0] }> = ({ plan }) => (
  <div className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg p-6 rounded-lg shadow-lg flex flex-col justify-between text-white h-145 min-h-[520px]">
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center mb-4">
        {plan.icon}
        <h2 className="text-2xl font-poppins font-bold mt-2">{plan.name}</h2>
      </div>
      <div className="flex flex-col gap-2 mb-4 w-full">
        {plan.modules.map((module, index) => (
          <ModuleTag key={index} module={module} />
        ))}
      </div>
      <p className="text-xs text-center mb-4 font-bold">{plan.description}</p>
    </div>
    <p className="text-lg font-bold">{plan.price}</p>
  </div>
);

// Componente principal de la página de pricing
const PricingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Efecto de luz en forma de campana */}
      <motion.div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[100vh]"
        style={{ 
          background: 'radial-gradient(ellipse at top, rgba(59,130,246,0.8) 0%, rgba(37,99,235,0.4) 40%, transparent 80%)',
          filter: 'blur(30px)' 
        }}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0.99 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
      />
      {/* Contenido principal */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <h1 className="text-4xl font-poppins font-bold text-white mb-8">
          Explorá nuestros planes y potenciá tu chatbot con las mejores herramientas.
        </h1>
        <Swiper
          spaceBetween={50}
          slidesPerView={3}
          centeredSlides={true}
          loop={true}
          className="w-full max-w-6xl"
        >
          {plans.map((plan, index) => (
            <SwiperSlide key={index}>
              <PlanCard plan={plan} />
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="mt-8">
          <Link to="/" className="text-white font-poppins text-lg underline decoration-2">
            Volver a Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;