import React, { useState, useEffect, useCallback } from 'react';
import { useNegocio } from '../NegocioContext';
import { toast } from '@/hooks/use-toast';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';

interface QRData {
  negocioId: number;
  qr: string | null;
  authenticated: boolean;
  nombre: string;
}

const WhatsAppConnection: React.FC = () => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [successMessage, setSuccessMessage] = useState(false);

  // Obtener QR desde el backend usando /api/qrs
  const fetchQR = useCallback(async () => {
    if (!negocioId) {
      toast({
        title: "Error",
        description: "No se pudo identificar el negocio",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const response = await axios.get<QRData[]>(`${process.env.REACT_APP_API_URL}/api/qrs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const qrs = response.data;
      const qrData = qrs.find(qr => qr.negocioId === negocioId);

      if (qrData) {
        if (qrData.authenticated) {
          setIsConnected(true);
          setConnectionStatus('connected');
          setShowQR(false);
          toast({
            title: "Conectado",
            description: "WhatsApp ya está conectado",
            variant: "default",
          });
        } else if (qrData.qr) {
          setQrCode(qrData.qr);
          setShowQR(true);
          setConnectionStatus('connecting');
          startConnectionPolling();
        } else {
          toast({
            title: "Error",
            description: "No se pudo generar el código QR",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "No se encontró información para este negocio",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching QR:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener el código QR. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [negocioId, getAccessTokenSilently]);

  // Polling para verificar el estado de conexión
  const startConnectionPolling = useCallback(() => {
    const pollInterval = setInterval(async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
          }
        });
        const response = await axios.get<QRData[]>(`${process.env.REACT_APP_API_URL}/api/qrs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const qrs = response.data;
        const qrData = qrs.find(qr => qr.negocioId === negocioId);

        if (qrData && qrData.authenticated) {
          setIsConnected(true);
          setConnectionStatus('connected');
          setShowQR(false);
          setSuccessMessage(true);
          clearInterval(pollInterval);
          toast({
            title: "¡Éxito!",
            description: "WhatsApp conectado exitosamente",
            variant: "default",
          });
          setTimeout(() => setSuccessMessage(false), 2000);
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
      }
    }, 2000); // Verifica cada 2 segundos

    // Timeout de 30 segundos
    setTimeout(() => {
      if (!isConnected) {
        clearInterval(pollInterval);
        setConnectionStatus('disconnected');
        setShowQR(false);
        setQrCode(null);
        toast({
          title: "Tiempo agotado",
          description: "No se pudo conectar. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    }, 30000);
  }, [negocioId, getAccessTokenSilently, isConnected]);

  // Manejar desconexión
  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.post(`${process.env.REACT_APP_API_URL}/api/negocio/${negocioId}/disconnect`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setQrCode(null);
      setShowQR(false);
      toast({
        title: "Desconectado",
        description: "WhatsApp ha sido desconectado",
        variant: "default",
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "No se pudo desconectar. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verificar estado inicial al montar el componente
  useEffect(() => {
    const checkConnection = async () => {
      if (negocioId) {
        await fetchQR();
      }
    };
    checkConnection();
  }, [negocioId, fetchQR]);

  // Componentes de UI
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin-slow"></div>
    </div>
  );

  const ConnectedSwitch = () => (
    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-400 to-green-500 rounded-lg border border-green-500">
      <div className="flex flex-col">
        <span className="font-poppins font-semibold text-lg text-gray-800">WhatsApp Bot</span>
        <span className="font-poppins text-sm text-gray-600">Conectado y funcionando</span>
      </div>
      <div className="flex items-center space-x-3">
        {successMessage && (
          <span className="font-poppins text-sm text-success-green font-medium animate-fade-in">
            ¡Conectado exitosamente!
          </span>
        )}
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-success-green focus:ring-offset-2 ${
            isConnected ? 'bg-success-green border-2 border-green-600 shadow-lg' : 'bg-gray-300'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300 border-2 ${
              isConnected ? 'translate-x-10 border-green-200' : 'translate-x-1 border-gray-200'
            }`}
          />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  const QRDisplay = () => (
    <div className="text-center animate-fade-in">
      <div className="mb-4">
        <div className="inline-block p-4 bg-white rounded-lg shadow-md border-2 border-gray-200">
          <img 
            src={qrCode || ''} 
            alt="WhatsApp QR Code" 
            className="w-48 h-48 mx-auto"
            onError={(e) => {
              e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23f0f0f0'/%3E%3Ctext x='100' y='100' text-anchor='middle' dy='0.3em' font-family='Arial' font-size='14' fill='%23666'%3EQR Code%3C/text%3E%3C/svg%3E";
            }}
          />
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-poppins text-sm text-gray-700 max-w-md mx-auto">
          Abre WhatsApp, ve a <span className="font-semibold">Configuración → Dispositivos Vinculados</span> y escanea este código.
        </p>
        <div className="flex items-center justify-center space-x-2 text-blue-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span className="font-poppins text-sm font-medium">Esperando conexión...</span>
        </div>
      </div>
    </div>
  );

  const InitialState = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-poppins font-bold text-xl text-black mb-2">
            Conectar WhatsApp
          </h2>
          <p className="font-poppins text-sm text-gray-600 max-w-sm">
            Escanea el código QR con WhatsApp para conectar tu negocio y comenzar a usar el bot automático.
          </p>
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-600 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
          </svg>
        </div>
      </div>
      <button
        onClick={fetchQR}
        disabled={loading}
        className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-poppins font-semibold text-sm rounded-lg transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
            Generando QR...
          </>
        ) : (
          'Generar Código QR'
        )}
      </button>
    </div>
  );

  if (!negocioId) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 max-w-[1000px] mx-auto mb-6">
        <div className="text-center">
          <p className="font-poppins text-sm text-red-600">
            Error: No se pudo identificar el negocio
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 max-w-[1000px] mx-auto mb-6">
      {isConnected ? (
        <ConnectedSwitch />
      ) : showQR ? (
        <QRDisplay />
      ) : (
        <InitialState />
      )}
    </div>
  );
};

export default WhatsAppConnection;