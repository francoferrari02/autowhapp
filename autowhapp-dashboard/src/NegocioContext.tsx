import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

interface Negocio {
  id: number;
  nombre: string;
}

interface NegocioContextType {
  negocioId: number | null;
  setNegocioId: (id: number) => void;
  negocios: Negocio[];
}

const NegocioContext = createContext<NegocioContextType | undefined>(undefined);

export const NegocioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [negocioId, setNegocioId] = useState<number | null>(null);
  const [negocios, setNegocios] = useState<Negocio[]>([]);

  useEffect(() => {
    axios.get<Negocio[]>('http://localhost:3000/api/negocios')
      .then(response => {
        const negociosRes = Array.isArray(response.data) ? response.data : [];
        setNegocios(negociosRes);
        if (negociosRes.length > 0 && negocioId === null) {
          setNegocioId(negociosRes[0].id); // Establecer el primer negocio solo si no hay uno seleccionado
        }
      })
      .catch(error => {
        console.error('Error al obtener los negocios:', error);
        setNegocios([]);
      });
  }, []); // Se ejecuta solo al montar el proveedor

  return (
    <NegocioContext.Provider value={{ negocioId, setNegocioId, negocios }}>
      {children}
    </NegocioContext.Provider>
  );
};

export const useNegocio = () => {
  const context = useContext(NegocioContext);
  if (!context) {
    throw new Error('useNegocio debe ser usado dentro de un NegocioProvider');
  }
  return context;
};