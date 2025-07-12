import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

interface Negocio {
  id: number;
  nombre: string;
  plan?: string;
  // ... otros campos del negocio
}

interface NegocioContextType {
  negocio: Negocio | null;
  setNegocio: (negocio: Negocio | null) => void;
  negocioId: number | null;
  setNegocioId: (id: number | null) => void;
  isFirstLogin: boolean;
  setIsFirstLogin: (value: boolean) => void;
  refreshNegocio: () => Promise<Negocio | null>;
  loading: boolean;
}

const NegocioContext = createContext<NegocioContextType | undefined>(undefined);

export const NegocioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [negocio, setNegocio] = useState<Negocio | null>(null);
  const [negocioId, setNegocioId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const { getAccessTokenSilently, isAuthenticated, isLoading: authLoading } = useAuth0();

  const refreshNegocio = async (): Promise<Negocio | null> => {
    setLoading(true);
    try {
      if (!isAuthenticated || authLoading) {
        console.log('Waiting for authentication to complete...');
        return null;
      }

      const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: process.env.REACT_APP_AUTH0_AUDIENCE!
          }
        });

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/negocios`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const negociosData = response.data as Negocio[];
      const negocio= negociosData.length > 0 ? negociosData[0] : null; //primer negocio o null si no hay

      setNegocio(negocio);

      if(negocio){
        setNegocioId(negocio.id);
      }else{
        setNegocioId(null);
      }

      console.log('Negocio in context:', negocio);
      setLoading(false);
      return negocio;
    } catch (error) {
      console.error('Error fetching negocios:', error);
      setNegocio(null);
      setNegocioId(null);
      setLoading(false);
      return null;
    }
  };

 
  useEffect(() => {
    if(isAuthenticated && !authLoading){
      refreshNegocio();
    }
  }, [isAuthenticated, authLoading]);

  return (
    <NegocioContext.Provider
      value={{
        negocio,
        setNegocio,
        negocioId,
        setNegocioId,
        isFirstLogin,
        setIsFirstLogin,
        refreshNegocio,
        loading,
      }}
    >
      {children}
    </NegocioContext.Provider>
  );
};

export const useNegocio = () => {
  const context = useContext(NegocioContext);
  if (context === undefined) {
    throw new Error('useNegocio must be used within a NegocioProvider');
  }
  return context;
};