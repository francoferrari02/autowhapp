import React, { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useNegocio } from '../NegocioContext';
import axios from 'axios';
import { 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Typography, 
  Box,
  Divider,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContactSearchSelector from './ContactSearchSelector';

interface Contact {
  id: string;
  name: string;
  responder: boolean;
}

interface Folder {
  id: number;
  nombre: string;
  contactos: string[];
}

const FolderCreator: React.FC = () => {
  const { negocioId } = useNegocio();
  const { getAccessTokenSilently } = useAuth0();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderContacts, setNewFolderContacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!negocioId) return;
      setLoading(true);
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
        setError('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [negocioId, getAccessTokenSilently]);

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      setError('El nombre de la carpeta no puede estar vacío');
      return;
    }
    
    if (newFolderContacts.length === 0) {
      setError('Debe seleccionar al menos un contacto');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/' }
      });
      
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/carpetas-contactos`,
        { 
          negocioId, 
          nombre: newFolderName.trim(), 
          contactos: newFolderContacts 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const data = res.data as { id: number };
      setFolders([...folders, { 
        id: data.id, 
        nombre: newFolderName.trim(), 
        contactos: newFolderContacts 
      }]);
      
      setNewFolderName('');
      setNewFolderContacts([]);
      setSuccess('Carpeta creada con éxito');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo crear la carpeta');
    } finally {
      setLoading(false);
    }
  };

  const deleteFolder = async (id: number) => {
    setDeleteDialogOpen(null);
    setLoading(true);
    setError(null);
    
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/' }
      });
      
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/carpetas-contactos/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setFolders(folders.filter(f => f.id !== id));
      setSuccess('Carpeta eliminada con éxito');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo eliminar la carpeta');
    } finally {
      setLoading(false);
    }
  };

  const startEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setNewFolderName(folder.nombre);
    setNewFolderContacts(folder.contactos);
  };

  const saveEditFolder = async () => {
    if (!editingFolder) return;
    
    if (!newFolderName.trim()) {
      setError('El nombre de la carpeta no puede estar vacío');
      return;
    }
    
    if (newFolderContacts.length === 0) {
      setError('Debe seleccionar al menos un contacto');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: { audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/' }
      });
      
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/carpetas-contactos/${editingFolder.id}`,
        { 
          nombre: newFolderName.trim(), 
          contactos: newFolderContacts 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setFolders(folders.map(f => 
        f.id === editingFolder.id 
          ? { ...f, nombre: newFolderName.trim(), contactos: newFolderContacts }
          : f
      ));
      
      setEditingFolder(null);
      setNewFolderName('');
      setNewFolderContacts([]);
      setSuccess('Carpeta actualizada con éxito');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'No se pudo actualizar la carpeta');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingFolder(null);
    setNewFolderName('');
    setNewFolderContacts([]);
    setError(null);
  };

  const getContactName = (contactId: string): string => {
    const contact = contacts.find(c => c.id === contactId);
    return contact ? contact.name : contactId;
  };

  return (
    <Box sx={{ 
      backgroundColor: 'white', 
      padding: 3, 
      borderRadius: 2, 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    }}>
      <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}>
        {editingFolder ? 'Editar Carpeta' : 'Crear Nueva Carpeta'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <TextField
        label="Nombre de la carpeta"
        value={newFolderName}
        onChange={(e) => setNewFolderName(e.target.value)}
        fullWidth
        variant="outlined"
        sx={{ mb: 2 }}
        placeholder="Ingresa el nombre de la carpeta"
      />

      <ContactSearchSelector
        selectedContacts={newFolderContacts}
        onContactsChange={setNewFolderContacts}
        label="Contactos para incluir en la carpeta"
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button 
          onClick={editingFolder ? saveEditFolder : createFolder}
          variant="contained" 
          color="primary"
          disabled={loading}
          sx={{ fontFamily: 'Poppins, sans-serif' }}
        >
          {loading ? 'Guardando...' : editingFolder ? 'Actualizar carpeta' : 'Crear carpeta'}
        </Button>
        
        {editingFolder && (
          <Button 
            onClick={cancelEdit}
            variant="outlined" 
            color="secondary"
            sx={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Cancelar
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Typography variant="h6" sx={{ mb: 2, fontFamily: 'Poppins, sans-serif' }}>
        Carpetas Existentes
      </Typography>

      {folders.length === 0 ? (
        <Typography sx={{ fontFamily: 'Poppins, sans-serif', color: 'text.secondary' }}>
          No hay carpetas creadas aún.
        </Typography>
      ) : (
        <List>
          {folders.map(folder => (
            <ListItem 
              key={folder.id}
              sx={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 1, 
                mb: 1,
                bgcolor: 'background.paper'
              }}
            >
              <ListItemText 
                primary={folder.nombre}
                secondary={`${folder.contactos.length} contactos: ${
                  folder.contactos.slice(0, 3).map(getContactName).join(', ')
                }${folder.contactos.length > 3 ? '...' : ''}`}
                primaryTypographyProps={{
                  sx: { fontFamily: 'Poppins, sans-serif', fontWeight: 500 }
                }}
                secondaryTypographyProps={{
                  sx: { fontFamily: 'Poppins, sans-serif' }
                }}
              />
              <IconButton 
                edge="end" 
                onClick={() => startEditFolder(folder)}
                sx={{ mr: 1 }}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                edge="end" 
                onClick={() => setDeleteDialogOpen(folder.id)}
                color="error"
              >
                <DeleteIcon />
              </IconButton>
            </ListItem>
          ))}
        </List>
      )}

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={deleteDialogOpen !== null} onClose={() => setDeleteDialogOpen(null)}>
        <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif' }}>
          Confirmar eliminación
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: 'Poppins, sans-serif' }}>
            ¿Estás seguro de que deseas eliminar esta carpeta? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(null)} 
            color="inherit"
            sx={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={() => deleteFolder(deleteDialogOpen!)} 
            color="error"
            sx={{ fontFamily: 'Poppins, sans-serif' }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FolderCreator;
