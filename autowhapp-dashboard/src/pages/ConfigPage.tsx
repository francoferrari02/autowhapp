import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import BotStatus from '../components/BotStatus';
import MainConfig from '../components/MainConfig';
import Products from '../components/Products';
import axios from 'axios';
import { useNegocio } from '../NegocioContext'; // Importa el hook del contexto

const ConfigPage: React.FC = () => {
  const { negocioId } = useNegocio(); // Usa el negocioId del contexto
  const [negocio, setNegocio] = useState<any>(null);

  // Cargar datos de negocio activo
  useEffect(() => {
    if (negocioId !== null) {
      console.log('Cargando datos del negocio con ID:', negocioId);
      axios.get(`http://localhost:3000/api/negocio/${negocioId}`)
        .then(res => {
          console.log('Datos del negocio recibidos:', res.data);
          setNegocio(res.data);
        })
        .catch(err => {
          console.error('Error al cargar el negocio:', err);
          setNegocio(null);
        });
    }
  }, [negocioId]);

  // Accionado por el switch de BotStatus
  const handleToggleBot = (nuevoEstado: boolean) => {
    if (negocioId !== null) {
      console.log('Actualizando estado del bot:', { negocioId, estadoBot: nuevoEstado });
      axios.post('http://localhost:3000/api/actualizar-estado-bot', { negocioId, estadoBot: nuevoEstado })
        .then(() => {
          setNegocio((prev: any) => prev ? { ...prev, estado_bot: nuevoEstado ? 1 : 0 } : prev);
        })
        .catch(err => {
          console.error('Error al actualizar estado del bot:', err);
        });
    }
  };

  return (
    <div>
      <Header />
      <div className="flex">
        <Sidebar selected="config" />
        <div className="flex-grow bg-blue-600 p-6 min-h-screen">
          {negocioId && negocio ? (
            <>
              {/* Título y BotStatus */}
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-poppins font-bold text-white mt-3">
                  Configuración de Chatbot
                </h2>
                <div className="flex-1 flex justify-end max-w-xl gap-4">
                  <BotStatus 
                    negocioId={negocioId} 
                    active={!!negocio.estado_bot} 
                    onToggle={handleToggleBot}
                  />
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="flex-1 md:flex-[0_0_100%]">
                  <MainConfig negocioId={negocioId} />
                </div>
                <div className="flex-1 md:flex-[0_0_100%]">
                  <Products negocioId={negocioId} />
                </div>
              </div>
            </>
          ) : (
            <div className="text-white font-poppins text-lg">
              Seleccione un negocio para comenzar
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;