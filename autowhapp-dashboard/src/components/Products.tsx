import React, { useState, ChangeEvent } from 'react';
import { Card, CardContent, Typography, Button, TextField, Table, TableBody, TableCell, TableHead, TableRow, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CancelIcon from '@mui/icons-material/Cancel';
import { Product } from '../types';

const Products: React.FC = () => {
  // Datos mockeados para simular los productos
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
    // Simular envío a n8n
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
    // Simular envío a n8n
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
    // Simular envío a n8n
    console.log('Simulando envío a n8n:', {
      products: updatedProducts,
    });
  };

  return (
    <Card sx={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '12px', padding: '16px' }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontFamily: 'Poppins', fontWeight: 'bold', marginBottom: '16px' }}>
          Productos/Servicios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ backgroundColor: '#34C759', borderRadius: '8px', marginBottom: '16px', '&:hover': { backgroundColor: '#2EA44F' } }}
          onClick={editProduct ? saveEdit : addProduct}
        >
          {editProduct ? 'Guardar Cambios' : 'Agregar Producto'}
        </Button>
        {editProduct && (
          <Button
            variant="contained"
            startIcon={<CancelIcon />}
            sx={{ backgroundColor: '#EF4444', borderRadius: '8px', marginBottom: '16px', marginLeft: '8px', '&:hover': { backgroundColor: '#DC2626' } }}
            onClick={cancelEdit}
          >
            Cancelar
          </Button>
        )}
        <TextField
          fullWidth
          label="Nombre del Producto/Servicio"
          name="name"
          value={editProduct ? editProduct.name : newProduct.name}
          onChange={handleInputChange}
          placeholder="Pizza Margherita"
          variant="outlined"
          sx={{ marginBottom: '16px' }}
        />
        <TextField
          fullWidth
          label="Descripción"
          name="description"
          value={editProduct ? editProduct.description : newProduct.description}
          onChange={handleInputChange}
          placeholder="Pizza clásica con tomate"
          variant="outlined"
          sx={{ marginBottom: '16px' }}
        />
        <TextField
          fullWidth
          label="Precio"
          name="price"
          value={editProduct ? editProduct.price : newProduct.price}
          onChange={handleInputChange}
          placeholder="$1500"
          variant="outlined"
          sx={{ marginBottom: '16px' }}
        />
        <Button
          component="label"
          startIcon={<AttachFileIcon />}
          sx={{ backgroundColor: '#E5E7EB', color: '#111827', marginBottom: '16px', '&:hover': { backgroundColor: '#93C5FD' } }}
        >
          Adjuntar Imagen
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
        {files.length > 0 && (
          <ul style={{ marginBottom: '16px' }}>
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        )}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Imagen</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={index}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.description}</TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.image || 'Sin imagen'}</TableCell>
                <TableCell>
                  <Button
                    startIcon={<EditIcon />}
                    sx={{ color: '#1E3A8A', marginRight: '8px' }}
                    onClick={() => startEditing(index)}
                  />
                  <Button
                    startIcon={<DeleteIcon />}
                    sx={{ color: '#EF4444' }}
                    onClick={() => deleteProduct(index)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {message && (
          <Typography sx={{ color: message.includes('Error') ? 'red' : 'green', marginTop: '16px' }}>
            {message}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default Products;