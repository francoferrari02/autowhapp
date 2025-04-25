import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import MainConfig from '../components/MainConfig';
import BotStatus from '../components/BotStatus';
import Products from '../components/Products';

const ConfigPage: React.FC = () => {
  return (
    <div>
      <Header />
      <div className="flex">
        <Sidebar selected="config" />

        <div className="flex-grow bg-blue-600 p-6">
        {/* Header interior */}
        <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-poppins font-bold text-white mt-3">
                Configuración de Chatbot
        </h2>
            <div className="flex-1 flex justify-end max-w-xl">
            <BotStatus />
            </div>
        </div>
        {/* Resto de la configuración */}
        <div className="flex gap-3 flex-wrap">
            <div className="flex-1 md:flex-[0_0_100%]">
                <MainConfig />
            </div>
            <div className="flex-1 md:flex-[0_0_100%]">
                <Products />
            </div>
        </div>
        </div>
            </div>
    </div>
  );
};

export default ConfigPage;