import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';

interface Contact {
  id: string;
  name: string;
  responder: boolean;
}

const ContactSelector: React.FC = () => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'ignored' | 'attended'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchContacts = async () => {
    if (!negocioId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/contactos/${negocioId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setContacts(response.data);
      } else {
        console.error('Expected an array but got:', response.data);
        setError('Respuesta inválida del servidor');
        setContacts([]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [negocioId]);

  const handleToggle = async (contactId: string, responder: boolean) => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      await axios.put(`${process.env.REACT_APP_API_URL}/api/contactos/${negocioId}/${contactId}`, { responder }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(contacts.map(c => c.id === contactId ? { ...c, responder } : c));
    } catch (err) {
      console.error('Error updating contact:', err);
      setError('Error al actualizar el contacto.');
    }
  };

  const ignoreAll = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const updatedContacts = contacts.map(contact => ({ ...contact, responder: false }));
      setContacts(updatedContacts);
      await Promise.all(updatedContacts.map(contact =>
        axios.put(`${process.env.REACT_APP_API_URL}/api/contactos/${negocioId}/${contact.id}`, { responder: false }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
    } catch (err) {
      console.error('Error ignoring all contacts:', err);
      setError('Error al ignorar todos los contactos.');
    }
  };

  const attendAll = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
        }
      });
      const updatedContacts = contacts.map(contact => ({ ...contact, responder: true }));
      setContacts(updatedContacts);
      await Promise.all(updatedContacts.map(contact =>
        axios.put(`${process.env.REACT_APP_API_URL}/api/contactos/${negocioId}/${contact.id}`, { responder: true }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
    } catch (err) {
      console.error('Error attending all contacts:', err);
      setError('Error al atender todos los contactos.');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    // Filtrar por estado (todos, atendidos, ignorados)
    let matchesFilter = true;
    if (filter === 'ignored') matchesFilter = !contact.responder;
    if (filter === 'attended') matchesFilter = contact.responder;
    
    // Filtrar por término de búsqueda
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 font-poppins max-w-[1000px] mx-auto mb-6">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2"> 
        <h2 className="text-xl font-bold text-black">Seleccionar Contactos para Responder</h2>
        <button
          onClick={fetchContacts}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? 'Cargando...' : 'Refrescar'}
        </button>
      </div>

      {/* Buscador */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar contacto por nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

        <div className="flex justify-between items-center mb-4">
      {/* Botones de filtro */}
      <div className="space-x-2">
        <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'} hover:bg-blue-500 transition-all font-poppins`}
            >
            Todos
        </button>
        <button
            onClick={() => setFilter('attended')}
            className={`px-4 py-2 rounded ${filter === 'attended' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'} hover:bg-blue-500 transition-all font-poppins`}
            >
            Atendidos
        </button>
        <button
            onClick={() => setFilter('ignored')}
            className={`px-4 py-2 rounded ${filter === 'ignored' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-black'} hover:bg-blue-500 transition-all font-poppins`}
            >
            Ignorados
        </button>
    </div>

      {/* Botones de acción masiva */}
      <div className="space-x-2">
        <button
            onClick={ignoreAll}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-all font-poppins"
            >
            Ignorar Todos
        </button>
            <button
            onClick={attendAll}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-all font-poppins"
            >
            Atender Todos
        </button>
    </div>
    </div>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      
      {/* Mostrar contador de resultados */}
      {!loading && (
        <div className="mb-4 text-sm text-gray-600">
          {searchTerm ? (
            <>Mostrando {filteredContacts.length} de {contacts.length} contactos para "{searchTerm}"</>
          ) : (
            <>Mostrando {filteredContacts.length} contactos</>
          )}
        </div>
      )}
      
      {loading ? (
        <p className="text-gray-600">Cargando contactos...</p>
      ) : filteredContacts.length === 0 ? (
        searchTerm ? (
          <p className="text-gray-600">No se encontraron contactos que coincidan con "{searchTerm}".</p>
        ) : (
          <p className="text-gray-600">No hay contactos disponibles. Conecta WhatsApp para cargar la lista.</p>
        )
      ) : (
        <ul className="space-y-3 max-h-96 overflow-y-auto">
          {filteredContacts.map(contact => (
            <li key={contact.id} className="flex justify-between items-center border-b pb-2">
              <span className="text-black truncate max-w-xs">{contact.name}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={contact.responder}
                  onChange={(e) => handleToggle(contact.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ContactSelector;