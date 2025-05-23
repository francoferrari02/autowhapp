import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

interface Negocio {
  id: number;
  nombre: string;
  // ... otros campos del negocio
}

interface NegocioContextType {
  negocioId: number | null;
  setNegocioId: (id: number) => void;
  negocios: Negocio[];
  isFirstLogin: boolean;
  setIsFirstLogin: (value: boolean) => void;
  refreshNegocios: () => Promise<void>;
  loading: boolean;
}

const NegocioContext = createContext<NegocioContextType | undefined>(undefined);

export const NegocioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [negocioId, setNegocioId] = useState<number | null>(null);
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(true);
  const { getAccessTokenSilently, isAuthenticated, isLoading: authLoading } = useAuth0();

  useEffect(() => {
    if (negocios.length > 0 && negocioId === null) {
      setNegocioId(negocios[0].id);
    }
  }, [negocios /*negocioId*/]);

  const refreshNegocios = async () => {
    try {
      if (!isAuthenticated || authLoading) {
        console.log('Waiting for authentication to complete...');
        return;
      }

      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      console.log('Access token:', token);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/user/negocios`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setNegocios(response.data as Negocio[]);
      console.log('Negocios in context:', response.data);
    } catch (error) {
      console.error('Error fetching negocios:', error);
      setNegocios([]);
    }
  };

  /* const connectWebSocket = async () => {
    try {
      if (!isAuthenticated || authLoading) {
        return;
      }

      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      console.log('Connecting to WebSocket with token:', token ? 'Token present' : 'No token');
      
      if (!token) {
        console.error('No token available for WebSocket connection');
        return;
      }

      const ws = new WebSocket(`${process.env.REACT_APP_API_WS_URL || 'ws://localhost:3000'}/ws`, [token]);
      
      ws.onopen = () => {
        console.log('WebSocket connected successfully');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setTimeout(() => {
          console.log('Attempting to reconnect...');
          connectWebSocket();
        }, 5000);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        if (event.code !== 1000) {
          setTimeout(() => {
            console.log('Attempting to reconnect after close...');
            connectWebSocket();
          }, 5000);
        }
      };

      return ws;
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      return undefined;
    }
  }; */

  useEffect(() => {
    let ws: WebSocket | undefined;

    const setupWebSocket = async () => {
      if (isAuthenticated && !authLoading) {
        await refreshNegocios();
        /* ws = await connectWebSocket(); */
      }
    };

    setupWebSocket();

    /* return () => {
      if (ws) {
        ws.close();
      } */
    /* }; */
  }, [isAuthenticated, authLoading]);

  return (
    <NegocioContext.Provider
      value={{
        negocioId,
        setNegocioId,
        negocios,
        isFirstLogin,
        setIsFirstLogin,
        refreshNegocios,
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