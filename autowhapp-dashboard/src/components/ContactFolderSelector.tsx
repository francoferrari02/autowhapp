import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNegocio } from '../NegocioContext';
import axios from 'axios';
import { TextField, Button, MenuItem, List, ListItem, ListItemText, IconButton, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from '@/hooks/use-toast';

interface Contact {
  id: string;
  name: string;
}

interface Folder {
  id: number;
  nombre: string;
  contactos: string[];
}

interface ContactFolderSelectorProps {
  onSelect: (type: 'folder' | 'contacts', value: number | string[]) => void;
  selectedType: 'folder' | 'contacts';
  selectedFolder: number | null;
  selectedContacts: string[];
}

const ContactFolderSelector: React.FC<ContactFolderSelectorProps> = ({
  onSelect,
  selectedType,
  selectedFolder,
  selectedContacts,
}) => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderContacts, setNewFolderContacts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getAccessTokenSilently({
          authorizationParams: { audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/' }
        });
        const [contactsRes, foldersRes] = await Promise.all([
          axios.get<Contact[]>(`${process.env.REACT_APP_API_URL}/api/contactos/${negocioId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get<Folder[]>(`${process.env.REACT_APP_API_URL}/api/carpetas-contactos/${negocioId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setContacts(contactsRes.data);
        setFolders(foldersRes.data);
      } catch (err) {
        toast({ title: 'Error', description: 'No se pudieron cargar los datos', variant: 'destructive' });
      }
    };
    if (negocioId) fetchData();
  }, [negocioId, getAccessTokenSilently]);

  const createFolder = async () => {
    if (!newFolderName || newFolderContacts.length === 0) return;
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/' }
      });
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/carpetas-contactos`,
        { negocioId, nombre: newFolderName, contactos: newFolderContacts },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = res.data as { id: number };
      setFolders([...folders, { id: data.id, nombre: newFolderName, contactos: newFolderContacts }]);
      setNewFolderName('');
      setNewFolderContacts([]);
      toast({ title: 'Éxito', description: 'Carpeta creada con éxito' });
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo crear la carpeta', variant: 'destructive' });
    }
  };

  const deleteFolder = async (id: number) => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/' }
      });
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/carpetas-contactos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFolders(folders.filter(f => f.id !== id));
      if (selectedFolder === id) onSelect('folder', -1);
      toast({ title: 'Éxito', description: 'Carpeta eliminada' });
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo eliminar la carpeta', variant: 'destructive' });
    }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <TextField
        select
        label="Enviar a"
        value={selectedType}
        onChange={(e) => onSelect(e.target.value as 'folder' | 'contacts', selectedType === 'folder' ? -1 : [])}
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
      >
        <MenuItem value="folder">Carpeta de contactos</MenuItem>
        <MenuItem value="contacts">Contactos individuales</MenuItem>
      </TextField>

      {selectedType === 'folder' && (
        <>
          <TextField
            select
            label="Seleccionar carpeta"
            value={selectedFolder === null || selectedFolder === -1 ? '' : selectedFolder}
            onChange={(e) => onSelect('folder', e.target.value === '' ? -1 : Number(e.target.value))}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          >
            <MenuItem value="">Ninguna</MenuItem>
            {folders.map(f => (
              <MenuItem key={f.id} value={f.id}>{f.nombre}</MenuItem>
            ))}
          </TextField>
          <Typography variant="h6" sx={{ mb: 1 }}>Crear nueva carpeta</Typography>
          <TextField
            label="Nombre de la carpeta"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Buscar contactos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {filteredContacts.map(c => (
              <ListItem
                key={c.id}
                component="button"
                onClick={() => {
                  setNewFolderContacts(
                    newFolderContacts.includes(c.id)
                      ? newFolderContacts.filter(id => id !== c.id)
                      : [...newFolderContacts, c.id]
                  );
                }}
                sx={{ bgcolor: newFolderContacts.includes(c.id) ? '#e0f7fa' : 'inherit' }}
              >
                <ListItemText primary={c.name} />
              </ListItem>
            ))}
          </List>
          <Button onClick={createFolder} variant="contained" sx={{ mt: 2 }}>
            Crear carpeta
          </Button>
          <List>
            {folders.map(f => (
              <ListItem key={f.id} secondaryAction={
                <IconButton edge="end" onClick={() => deleteFolder(f.id)}>
                  <DeleteIcon />
                </IconButton>
              }>
                <ListItemText primary={f.nombre} secondary={`${f.contactos.length} contactos`} />
              </ListItem>
            ))}
          </List>
        </>
      )}

      {selectedType === 'contacts' && (
        <>
          <TextField
            label="Buscar contactos"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <List sx={{ maxHeight: 200, overflow: 'auto' }}>
            {filteredContacts.map(c => (
              <ListItem
                key={c.id}
                component="button"
                onClick={() => {
                  const newContacts = selectedContacts.includes(c.id)
                    ? selectedContacts.filter(id => id !== c.id)
                    : [...selectedContacts, c.id];
                  onSelect('contacts', newContacts);
                }}
                sx={{ bgcolor: selectedContacts.includes(c.id) ? '#e0f7fa' : 'inherit' }}
              >
                <ListItemText primary={c.name} />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </div>
  );
};

export default ContactFolderSelector;