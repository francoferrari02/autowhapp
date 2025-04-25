import React, { useState, ChangeEvent, useMemo } from 'react';
import { Card, CardContent, Typography, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Box, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import { Product } from '../types';

const Products: React.FC = () => {
  const mockProducts: Product[] = [
    { id: 1, name: 'Pizza Margherita', description: 'Pizza clásica con tomate', price: '$1500', image: 'pizza.jpg' },
    { id: 2, name: 'Coca-Cola', description: 'Bebida gaseosa 500ml', price: '$500', image: 'coca.jpg' },
  ];

  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [newProduct, setNewProduct] = useState<Product>({ name: '', description: '', price: '', image: '' });
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editProduct) {
      setEditProduct({ ...editProduct, [name]: value });
    } else {
      setNewProduct({ ...newProduct, [name]: value });
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(selectedFiles);
      if (editProduct) {
        setEditProduct({ ...editProduct, image: selectedFiles[0]?.name || '' });
      } else {
        setNewProduct({ ...newProduct, image: selectedFiles[0]?.name || '' });
      }
    }
  };

  const addProduct = () => {
    if (!newProduct.name || !newProduct.price) {
      setMessage('Por favor, completa los campos obligatorios');
      return;
    }

    const newProductWithId = { ...newProduct, id: products.length + 1 };
    const updatedProducts = [...products, newProductWithId];
    setProducts(updatedProducts);
    setNewProduct({ name: '', description: '', price: '', image: '' });
    setFiles([]);
    setMessage('Producto agregado con éxito (simulado)');
    console.log('Simulando envío a n8n:', {
      products: updatedProducts,
      files: files.map(file => file.name),
    });
  };

  const startEditing = (index: number) => {
    setEditIndex(index);
    setEditProduct({ ...products[index] });
    setFiles([]);
  };

  const saveEdit = () => {
    if (!editProduct || !editProduct.name || !editProduct.price) {
      setMessage('Por favor, completa los campos obligatorios');
      return;
    }

    const updatedProducts = products.map((product, index) =>
      index === editIndex ? editProduct : product
    );
    setProducts(updatedProducts);
    setEditProduct(null);
    setEditIndex(null);
    setFiles([]);
    setMessage('Producto actualizado con éxito (simulado)');
    console.log('Simulando envío a n8n:', {
      products: updatedProducts,
      files: files.map(file => file.name),
    });
  };

  const cancelEdit = () => {
    setEditProduct(null);
    setEditIndex(null);
    setFiles([]);
  };

  const deleteProduct = (index: number) => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    setMessage('Producto eliminado con éxito (simulado)');
    console.log('Simulando envío a n8n:', {
      products: updatedProducts,
    });
  };

  // Filtrado según searchTerm, ignorando mayúsculas/minúsculas
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  return (
    <div className="flex justify-center mt-6 mb-12">
      <Card 
        sx={{
          maxWidth: 1000,
          width: '100%',
          boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)',
          borderRadius: '12px',
          backgroundColor: 'white',
        }}
      >
        <CardContent sx={{ paddingBottom: '24px' }}>
          {/* Sección agregar producto */}
          <Box sx={{ mb: 4, px: 2, py: 3, backgroundColor: '#f5f7fa', borderRadius: '8px' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mb: 3 }}>
              Agregar Producto/Servicio
            </Typography>
            <TextField
              fullWidth
              label="Nombre del Producto/Servicio"
              name="name"
              value={editProduct ? editProduct.name : newProduct.name}
              onChange={handleInputChange}
              placeholder="Pizza Margherita"
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Descripción"
              name="description"
              value={editProduct ? editProduct.description : newProduct.description}
              onChange={handleInputChange}
              placeholder="Pizza clásica con tomate"
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              label="Precio"
              name="price"
              value={editProduct ? editProduct.price : newProduct.price}
              onChange={handleInputChange}
              placeholder="$1500"
              variant="outlined"
              sx={{ mb: 3 }}
            />
            <Button
              component="label"
              startIcon={<AttachFileIcon />}
              sx={{ 
                backgroundColor: '#E5E7EB', 
                color: '#111827', 
                mb: 3, 
                '&:hover': { backgroundColor: '#93C5FD' },
                textTransform: 'none',
                fontWeight: '600',
                borderRadius: '8px',
                width: 'fit-content'
              }}
            >
              Adjuntar Imagen
              <input type="file" hidden onChange={handleFileChange} />
            </Button>
            {files.length > 0 && (
              <ul style={{ marginBottom: 24 }}>
                {files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ 
                  backgroundColor: '#34C759', 
                  borderRadius: '8px', 
                  '&:hover': { backgroundColor: '#2EA44F' },
                  color: 'white',
                  fontWeight: '600',
                  textTransform: 'none',
                  flexGrow: 1
                }}
                onClick={editProduct ? saveEdit : addProduct}
              >
                {editProduct ? 'Guardar Cambios' : 'Agregar'}
              </Button>
              {editProduct && (
                <Button
                  variant="contained"
                  startIcon={<CancelIcon />}
                  sx={{ 
                    backgroundColor: '#EF4444', 
                    borderRadius: '8px', 
                    '&:hover': { backgroundColor: '#DC2626' },
                    color: 'white',
                    fontWeight: '600',
                    textTransform: 'none',
                    width: '140px'
                  }}
                  onClick={cancelEdit}
                >
                  Cancelar
                </Button>
              )}
            </div>
          </Box>

          {/* Sección tabla productos */}
          <Box sx={{ px: 2, py: 3, borderTop: '2px solid #e0e0e0' }}>
            <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', mb: 2 }}>
              Lista de Productos/Servicios
            </Typography>
            <TextField
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Precio</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Imagen</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product, index) => (
                  <TableRow key={product.id || index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.description}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>{product.image || 'Sin imagen'}</TableCell>
                    <TableCell>
                      <Button
                        startIcon={<EditIcon />}
                        sx={{ color: '#1E3A8A', mr: 1 }}
                        onClick={() => startEditing(index)}
                        aria-label={`Editar ${product.name}`}
                      />
                      <Button
                        startIcon={<DeleteIcon />}
                        sx={{ color: '#EF4444' }}
                        onClick={() => deleteProduct(index)}
                        aria-label={`Eliminar ${product.name}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ fontStyle: 'italic', color: 'gray' }}>
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
          {message && (
            <Typography sx={{ color: message.includes('Error') ? 'red' : 'green', mt: 3 }}>
              {message}
            </Typography>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Products;