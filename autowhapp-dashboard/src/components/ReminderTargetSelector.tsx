import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNegocio } from '../NegocioContext';
import axios from 'axios';
import { 
  TextField, 
  MenuItem, 
  Typography, 
  Box,
  Alert
} from '@mui/material';
import ContactSearchSelector from './ContactSearchSelector';

interface Folder {
  id: number;
  nombre: string;
  contactos: string[];
}

interface ReminderTargetSelectorProps {
  selectedType: 'folder' | 'contacts';
  selectedFolder: number | null;
  selectedContacts: string[];
  onTypeChange: (type: 'folder' | 'contacts') => void;
  onFolderChange: (folderId: number | null) => void;
  onContactsChange: (contacts: string[]) => void;
}

const ReminderTargetSelector: React.FC<ReminderTargetSelectorProps> = ({
  selectedType,
  selectedFolder,
  selectedContacts,
  onTypeChange,
  onFolderChange,
  onContactsChange
}) => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!negocioId) return;
      setLoading(true);
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/' }
        });
        
        const response = await axios.get<Folder[]>(`${process.env.REACT_APP_API_URL}/api/carpetas-contactos/${negocioId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        setFolders(response.data);
      } catch (err) {
        setError('No se pudieron cargar las carpetas');
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, [negocioId, getAccessTokenSilently]);

  const handleTypeChange = (type: 'folder' | 'contacts') => {
    onTypeChange(type);
    // Limpiar selecciones al cambiar tipo
    if (type === 'folder') {
      onContactsChange([]);
    } else {
      onFolderChange(null);
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}>
        Destinatarios del Recordatorio
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        select
        label="Enviar recordatorio a"
        value={selectedType}
        onChange={(e) => handleTypeChange(e.target.value as 'folder' | 'contacts')}
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
      >
        <MenuItem value="folder">Carpeta de contactos</MenuItem>
        <MenuItem value="contacts">Contactos individuales</MenuItem>
      </TextField>

      {selectedType === 'folder' && (
        <Box>
          <TextField
            select
            label="Seleccionar carpeta"
            value={selectedFolder || ''}
            onChange={(e) => onFolderChange(e.target.value === '' ? null : Number(e.target.value))}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
            disabled={loading}
          >
            <MenuItem value="">Ninguna carpeta seleccionada</MenuItem>
            {folders.map(folder => (
              <MenuItem key={folder.id} value={folder.id}>
                {folder.nombre} ({folder.contactos.length} contactos)
              </MenuItem>
            ))}
          </TextField>

          {folders.length === 0 && !loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              No hay carpetas disponibles. Crea una carpeta primero en la sección "Gestión de Carpetas" más abajo.
            </Alert>
          )}

          {selectedFolder && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Carpeta seleccionada: {folders.find(f => f.id === selectedFolder)?.nombre} 
              ({folders.find(f => f.id === selectedFolder)?.contactos.length} contactos)
            </Alert>
          )}
        </Box>
      )}

      {selectedType === 'contacts' && (
        <ContactSearchSelector
          selectedContacts={selectedContacts}
          onContactsChange={onContactsChange}
          label="Seleccionar contactos individuales"
        />
      )}
    </Box>
  );
};

export default ReminderTargetSelector;
