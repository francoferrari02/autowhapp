import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Chip,
  Container,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import ProtectedModule from '../components/ProtectedModule';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface Invoice {
  id: string;
  client: string;
  date: string;
  amount: number;
  status: string;
  image?: string | null; // Cambiar a string para guardar nombre del archivo o URL
}

const Payments: React.FC = () => {
  // Función para cargar facturas desde localStorage
  const loadInvoicesFromStorage = (): Invoice[] => {
    try {
      const storedInvoices = localStorage.getItem('autowhapp_invoices');
      if (storedInvoices) {
        const parsed = JSON.parse(storedInvoices);
        console.log('Facturas cargadas desde localStorage:', parsed);
        return parsed;
      }
    } catch (error) {
      console.error('Error al cargar facturas desde localStorage:', error);
    }
    return [];
  };

  // Función para guardar facturas en localStorage
  const saveInvoicesToStorage = (invoices: Invoice[]) => {
    try {
      localStorage.setItem('autowhapp_invoices', JSON.stringify(invoices));
      console.log('Facturas guardadas en localStorage:', invoices);
    } catch (error) {
      console.error('Error al guardar facturas en localStorage:', error);
    }
  };

  const [invoices, setInvoices] = useState<Invoice[]>(loadInvoicesFromStorage);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  // useEffect para guardar en localStorage cada vez que cambian las facturas
  useEffect(() => {
    saveInvoicesToStorage(invoices);
  }, [invoices]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    id: '', client: '', date: '', amount: '', status: 'Pendiente', image: null as File | null
  });

  const handleOpenDialog = (factura?: Invoice) => {
    if (factura) {
      setEditando(factura);
      setFormData({ 
        ...factura, 
        amount: factura.amount.toString(), 
        image: null // Reset image field for editing
      });
    } else {
      setEditando(null);
      setFormData({ id: '', client: '', date: '', amount: '', status: 'Pendiente', image: null });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => setDialogOpen(false);

  const handleSave = () => {
    console.log('=== GUARDANDO FACTURA ===');
    console.log('Datos del formulario:', formData);
    
    // Validar formato de fecha
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.date)) {
      alert('Por favor, ingresa una fecha válida en formato YYYY-MM-DD');
      return;
    }
    
    // Validar que la fecha sea válida
    const testDate = new Date(formData.date);
    if (isNaN(testDate.getTime())) {
      alert('La fecha ingresada no es válida');
      return;
    }
    
    console.log('Fecha validada:', formData.date);
    console.log('Fecha parseada:', testDate.toISOString());
    
    const nuevaFactura: Invoice = {
      id: editando ? editando.id : `FAC-${String(Date.now()).slice(-3)}`,
      client: formData.client,
      date: formData.date, // Mantener formato YYYY-MM-DD
      amount: parseFloat(formData.amount),
      status: formData.status,
      image: formData.image ? formData.image.name : (editando?.image || null), // Guardar nombre del archivo
    };
    
    console.log('Nueva factura preparada:', nuevaFactura);
    
    if (editando) {
      const updatedInvoices = invoices.map(f => f.id === editando.id ? nuevaFactura : f);
      setInvoices(updatedInvoices);
      console.log('Factura actualizada. Nuevo array:', updatedInvoices);
    } else {
      const updatedInvoices = [...invoices, nuevaFactura];
      setInvoices(updatedInvoices);
      console.log('Factura agregada. Nuevo array:', updatedInvoices);
    }
    
    setDialogOpen(false);
    console.log('=== FIN GUARDADO ===');
  };

  const handleUpload = (id: string, file: File) => {
    console.log('Subiendo archivo:', file.name, 'para factura:', id);
    setInvoices(invoices.map(f => f.id === id ? { ...f, image: file.name } : f));
  };

  const total = invoices.reduce((acc, f) => acc + f.amount, 0);
  const pagado = invoices.filter((f) => f.status === "Pagado").reduce((acc, f) => acc + f.amount, 0);
  const pendiente = total - pagado;

  // Generar datos del gráfico basados en las facturas y fecha seleccionada
  const generateChartData = () => {
    console.log('=== GENERANDO DATOS DEL GRÁFICO ===');
    console.log('Año seleccionado:', selectedYear, 'Mes seleccionado:', selectedMonth);
    console.log('Total de facturas disponibles:', invoices.length);
    console.log('Facturas disponibles:', invoices);
    
    if (invoices.length === 0) {
      console.log('No hay facturas disponibles');
      return [];
    }
    
    // Filtrar facturas del mes seleccionado
    const filteredInvoices = invoices.filter(invoice => {
      if (!invoice.date) {
        console.log(`Factura ${invoice.id} no tiene fecha`);
        return false;
      }
      
      // Crear fecha desde el string de fecha de la factura
      const invoiceDate = new Date(invoice.date);
      const invoiceYear = invoiceDate.getFullYear();
      const invoiceMonth = invoiceDate.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
      
      console.log(`Factura ${invoice.id}:`);
      console.log(`  - Fecha original: ${invoice.date}`);
      console.log(`  - Fecha parseada: ${invoiceDate.toISOString()}`);
      console.log(`  - Año: ${invoiceYear}, Mes: ${invoiceMonth}`);
      console.log(`  - Monto: ${invoice.amount}, Estado: ${invoice.status}`);
      console.log(`  - ¿Coincide año? ${invoiceYear === selectedYear}`);
      console.log(`  - ¿Coincide mes? ${invoiceMonth === selectedMonth}`);
      
      const matches = invoiceYear === selectedYear && 
                     invoiceMonth === selectedMonth;
      
      console.log(`  - ¿Pasa el filtro? ${matches}`);
      return matches;
    });

    console.log('Facturas que pasaron el filtro:', filteredInvoices.length);
    console.log('Facturas filtradas:', filteredInvoices);

    // Calcular totales para el mes seleccionado
    const totalFacturado = filteredInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalPagado = filteredInvoices
      .filter(invoice => invoice.status === "Pagado")
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const totalPendiente = filteredInvoices
      .filter(invoice => invoice.status === "Pendiente")
      .reduce((sum, invoice) => sum + invoice.amount, 0);

    console.log('Totales calculados:');
    console.log('  - Total Facturado:', totalFacturado);
    console.log('  - Total Pagado:', totalPagado);
    console.log('  - Total Pendiente:', totalPendiente);

    // Si no hay facturas para el mes seleccionado, devolver array vacío
    if (filteredInvoices.length === 0) {
      console.log('No hay facturas para el mes seleccionado');
      return [];
    }

    // Crear el nombre del mes para mostrar
    const monthName = new Date(selectedYear, selectedMonth - 1, 1)
      .toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });

    const result = [{
      mes: monthName,
      facturado: totalFacturado,
      pagado: totalPagado,
      pendiente: totalPendiente
    }];

    console.log('Resultado final del gráfico:', result);
    console.log('=== FIN GENERACIÓN DATOS ===');
    return result;
  };

  const chartData = generateChartData();

  return (
    <ProtectedModule module="payments">
      <div className="flex-grow bg-blue-600 p-6 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-poppins font-bold text-white mt-2">
            Pagos y Facturación
          </h2>
          <div className="flex-1 flex justify-end max-w-[480px] gap-2">
            {/* Indicador de persistencia */}
            {invoices.length > 0 && (
              <div className="text-white text-sm flex items-center gap-1 mr-2">
                <span>💾</span>
                <span>{invoices.length} facturas guardadas</span>
              </div>
            )}
            <Button 
              variant="outlined" 
              sx={{ backgroundColor: 'white', color: 'black', fontFamily: 'Poppins, sans-serif' }} 
              onClick={() => handleOpenDialog()}
            >
              Agregar Factura
            </Button>
            {/* Botón para limpiar datos (solo para testing) */}
            {invoices.length > 0 && (
              <Button 
                variant="outlined" 
                sx={{ backgroundColor: 'red', color: 'white', fontFamily: 'Poppins, sans-serif' }} 
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres eliminar todas las facturas? Esta acción no se puede deshacer.')) {
                    setInvoices([]);
                    localStorage.removeItem('autowhapp_invoices');
                  }
                }}
              >
                Limpiar Todo
              </Button>
            )}
          </div>
        </div>

        <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 8, fontFamily: 'Poppins, sans-serif' }}>
          {/* Resumen */}
          <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2} mb={4}>
            {[{
              label: 'Total Facturado', value: `$${total.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
            }, {
              label: 'Total Pagado', value: `$${pagado.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
            }, {
              label: 'Total Pendiente', value: `$${pendiente.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
            }].map((item, i) => (
              <Card key={i} sx={{ minWidth: 200, flex: 1, backgroundColor: '#f5f5f5' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontFamily: 'Poppins, sans-serif' }}>{item.label}</Typography>
                  <Typography variant="h5" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>{item.value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Gráfico */}
          <Card sx={{ mb: 5, p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>
                Resumen de Facturación por Mes
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ fontFamily: 'Poppins, sans-serif' }}>Año</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value as number)}
                    label="Año"
                    sx={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map((year) => (
                      <MenuItem key={year} value={year} sx={{ fontFamily: 'Poppins, sans-serif' }}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl variant="outlined" sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ fontFamily: 'Poppins, sans-serif' }}>Mes</InputLabel>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value as number)}
                    label="Mes"
                    sx={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {[
                      { value: 1, label: 'Enero' },
                      { value: 2, label: 'Febrero' },
                      { value: 3, label: 'Marzo' },
                      { value: 4, label: 'Abril' },
                      { value: 5, label: 'Mayo' },
                      { value: 6, label: 'Junio' },
                      { value: 7, label: 'Julio' },
                      { value: 8, label: 'Agosto' },
                      { value: 9, label: 'Septiembre' },
                      { value: 10, label: 'Octubre' },
                      { value: 11, label: 'Noviembre' },
                      { value: 12, label: 'Diciembre' }
                    ].map((month) => (
                      <MenuItem key={month.value} value={month.value} sx={{ fontFamily: 'Poppins, sans-serif' }}>
                        {month.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box sx={{ width: '100%', height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                  barCategoryGap="20%"
                >
                  <XAxis 
                    dataKey="mes" 
                    style={{ fontFamily: 'Poppins, sans-serif', fontSize: '12px' }}
                    textAnchor="middle"
                    height={50}
                  />
                  <YAxis 
                    style={{ fontFamily: 'Poppins, sans-serif', fontSize: '12px' }} 
                    tickFormatter={(v) => {
                      if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                      if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
                      return `$${v}`;
                    }} 
                  />
                  <Tooltip
                    formatter={(v: number) => `$${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
                    labelFormatter={(label) => `Mes: ${label}`}
                    contentStyle={{ 
                      fontFamily: 'Poppins, sans-serif',
                      backgroundColor: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontFamily: 'Poppins, sans-serif',
                      paddingTop: '20px'
                    }} 
                  />
                  <Bar 
                    dataKey="facturado" 
                    fill="#3b82f6" 
                    name="Total Facturado"
                    maxBarSize={60}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="pagado" 
                    fill="#10b981" 
                    name="Total Pagado"
                    maxBarSize={60}
                    radius={[2, 2, 0, 0]}
                  />
                  <Bar 
                    dataKey="pendiente" 
                    fill="#f59e0b" 
                    name="Total Pendiente"
                    maxBarSize={60}
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Tabla de facturas */}
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>
                Listado de Facturas
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>Factura</TableCell>
                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>Cliente</TableCell>
                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>Fecha</TableCell>
                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>Monto</TableCell>
                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>Estado</TableCell>
                    <TableCell sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif' }}>{factura.id}</TableCell>
                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif' }}>{factura.client}</TableCell>
                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif' }}>{factura.date}</TableCell>
                      <TableCell sx={{ fontFamily: 'Poppins, sans-serif' }}>${factura.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Chip 
                          label={factura.status} 
                          color={factura.status === "Pagado" ? "success" : "error"}
                          sx={{ fontFamily: 'Poppins, sans-serif' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            onClick={() => handleOpenDialog(factura)}
                            sx={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            Editar
                          </Button>
                          <Button 
                            variant="outlined" 
                            component="label" 
                            size="small"
                            sx={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            Subir Imagen
                            <input hidden type="file" accept="image/*" onChange={(e) => {
                              if (e.target.files?.[0]) handleUpload(factura.id, e.target.files[0]);
                            }} />
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small" 
                            onClick={() => setInvoices(invoices.filter(f => f.id !== factura.id))}
                            sx={{ fontFamily: 'Poppins, sans-serif' }}
                          >
                            Eliminar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Box>

        {/* Diálogo de agregar/editar factura */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
          <DialogTitle sx={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}>
            {editando ? 'Editar Factura' : 'Agregar Factura'}
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField 
              label="Cliente" 
              value={formData.client} 
              onChange={e => setFormData({ ...formData, client: e.target.value })} 
              fullWidth 
              InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
            />
            <TextField 
              label="Fecha" 
              type="date" 
              value={formData.date} 
              onChange={e => setFormData({ ...formData, date: e.target.value })} 
              InputLabelProps={{ shrink: true, style: { fontFamily: 'Poppins, sans-serif' } }} 
              InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              fullWidth 
            />
            <TextField 
              label="Monto" 
              type="number" 
              value={formData.amount} 
              onChange={e => setFormData({ ...formData, amount: e.target.value })} 
              fullWidth 
              InputLabelProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
              InputProps={{ style: { fontFamily: 'Poppins, sans-serif' } }}
            />
            <FormControl fullWidth>
              <InputLabel sx={{ fontFamily: 'Poppins, sans-serif' }}>Estado</InputLabel>
              <Select 
                value={formData.status} 
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                sx={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <MenuItem value="Pendiente" sx={{ fontFamily: 'Poppins, sans-serif' }}>Pendiente</MenuItem>
                <MenuItem value="Pagado" sx={{ fontFamily: 'Poppins, sans-serif' }}>Pagado</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} sx={{ fontFamily: 'Poppins, sans-serif' }}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave} sx={{ fontFamily: 'Poppins, sans-serif' }}>Guardar</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
    </ProtectedModule>
  );
};

export default Payments;