import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNegocio } from '../NegocioContext';
import axios from 'axios';
import { 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  Checkbox, 
  Typography, 
  Box 
} from '@mui/material';

interface Contact {
  id: string;
  name: string;
  responder: boolean;
}

interface ContactSearchSelectorProps {
  selectedContacts: string[];
  onContactsChange: (contacts: string[]) => void;
  label?: string;
}

const ContactSearchSelector: React.FC<ContactSearchSelectorProps> = ({
  selectedContacts,
  onContactsChange,
  label = 'Seleccionar contactos'
}) => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      if (!negocioId) return;
      setLoading(true);
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
          }
        });
        const response = await axios.get<Contact[]>(`${process.env.REACT_APP_API_URL}/api/contactos/${negocioId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(response.data)) {
          setContacts(response.data);
        } else {
          setContacts([]);
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [negocioId, getAccessTokenSilently]);

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactToggle = (contactId: string) => {
    const newSelected = selectedContacts.includes(contactId)
      ? selectedContacts.filter(id => id !== contactId)
      : [...selectedContacts, contactId];
    onContactsChange(newSelected);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 1, fontFamily: 'Poppins, sans-serif' }}>
        {label}
      </Typography>
      
      <TextField
        label="Buscar contactos"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
        placeholder="Buscar contacto por nombre..."
        InputProps={{
          startAdornment: (
            <Box sx={{ mr: 1 }}>
              <svg 
                className="w-4 h-4 text-gray-400"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Box>
          )
        }}
      />

      {loading ? (
        <Typography sx={{ fontFamily: 'Poppins, sans-serif' }}>Cargando contactos...</Typography>
      ) : filteredContacts.length === 0 ? (
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: 'text.secondary' }}>
          {searchTerm ? `No se encontraron contactos que coincidan con "${searchTerm}"` : 'No hay contactos disponibles'}
        </Typography>
      ) : (
        <>
          <Typography variant="caption" sx={{ mb: 1, display: 'block', fontFamily: 'Poppins, sans-serif' }}>
            {searchTerm ? 
              `Mostrando ${filteredContacts.length} de ${contacts.length} contactos` : 
              `${filteredContacts.length} contactos disponibles`
            }
          </Typography>
          
          <List sx={{ 
            maxHeight: 300, 
            overflow: 'auto',
            border: '1px solid #e0e0e0',
            borderRadius: 1,
            bgcolor: 'background.paper'
          }}>
            {filteredContacts.map(contact => (
              <ListItem
                key={contact.id}
                dense
                onClick={() => handleContactToggle(contact.id)}
                sx={{
                  bgcolor: selectedContacts.includes(contact.id) ? 'primary.light' : 'inherit',
                  '&:hover': {
                    bgcolor: selectedContacts.includes(contact.id) ? 'primary.main' : 'action.hover'
                  },
                  cursor: 'pointer'
                }}
              >
                <Checkbox
                  checked={selectedContacts.includes(contact.id)}
                  onChange={() => handleContactToggle(contact.id)}
                  sx={{ mr: 1 }}
                />
                <ListItemText 
                  primary={contact.name}
                  primaryTypographyProps={{
                    sx: {
                      fontFamily: 'Poppins, sans-serif',
                      color: selectedContacts.includes(contact.id) ? 'primary.contrastText' : 'text.primary'
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
      
      {selectedContacts.length > 0 && (
        <Typography variant="caption" sx={{ mt: 1, display: 'block', fontFamily: 'Poppins, sans-serif' }}>
          {selectedContacts.length} contacto{selectedContacts.length > 1 ? 's' : ''} seleccionado{selectedContacts.length > 1 ? 's' : ''}
        </Typography>
      )}
    </Box>
  );
};

export default ContactSearchSelector;
