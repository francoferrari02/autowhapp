import React, { useState } from "react";
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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

interface Invoice {
  id: string;
  client: string;
  date: string;
  amount: number;
  status: string;
  image?: File | null;
}

const Payments: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState({
    id: '', client: '', date: '', amount: '', status: 'Pendiente', image: null as File | null
  });

  const handleOpenDialog = (factura?: Invoice) => {
    if (factura) {
      setEditando(factura);
      setFormData({ ...factura, amount: factura.amount.toString(), image: factura.image || null });
    } else {
      setEditando(null);
      setFormData({ id: '', client: '', date: '', amount: '', status: 'Pendiente', image: null });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => setDialogOpen(false);

  const handleSave = () => {
    const nuevaFactura: Invoice = {
      id: editando ? editando.id : `FAC-${String(Date.now()).slice(-3)}`,
      client: formData.client,
      date: formData.date,
      amount: parseFloat(formData.amount),
      status: formData.status,
      image: formData.image,
    };
    if (editando) {
      setInvoices(invoices.map(f => f.id === editando.id ? nuevaFactura : f));
    } else {
      setInvoices([...invoices, nuevaFactura]);
    }
    setDialogOpen(false);
  };

  const handleUpload = (id: string, file: File) => {
    setInvoices(invoices.map(f => f.id === id ? { ...f, image: file } : f));
  };

  const total = invoices.reduce((acc, f) => acc + f.amount, 0);
  const pagado = invoices.filter((f) => f.status === "Pagado").reduce((acc, f) => acc + f.amount, 0);
  const pendiente = total - pagado;

  // Generar datos del gráfico basados en las facturas
  const generateChartData = () => {
    const monthlyData: { [key: string]: number } = {};
    
    invoices.forEach(invoice => {
      if (invoice.date && invoice.status === "Pagado") {
        const date = new Date(invoice.date);
        const monthKey = date.toLocaleDateString('es-AR', { year: 'numeric', month: 'long' });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + invoice.amount;
      }
    });

    return Object.entries(monthlyData).map(([mes, ingresos]) => ({
      mes,
      ingresos
    })).sort((a, b) => {
      const dateA = new Date(a.mes + " 1");
      const dateB = new Date(b.mes + " 1");
      return dateA.getTime() - dateB.getTime();
    });
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
          <div className="flex-1 flex justify-end max-w-[480px]">
            <Button variant="outlined" sx={{ backgroundColor: 'white', color: 'black', fontFamily: 'Poppins, sans-serif' }} onClick={() => handleOpenDialog()}>Agregar Factura</Button>
          </div>
        </div>

        <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 8 }}>
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
                  <Typography variant="h6">{item.label}</Typography>
                  <Typography variant="h5">{item.value}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Gráfico */}
          <Card sx={{ mb: 5, p: 3, borderRadius: 3, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>
              Comparativa de Ingresos por Mes
            </Typography>
            <Box sx={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={(v) => {
                    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
                    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
                    return `$${v}`;
                  }} />
                  <Tooltip
                    formatter={(v: number) => `$${v.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`}
                    labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Bar dataKey="ingresos" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Card>

          {/* Tabla de facturas */}
          <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Listado de Facturas
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Factura</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Monto</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((factura) => (
                    <TableRow key={factura.id}>
                      <TableCell>{factura.id}</TableCell>
                      <TableCell>{factura.client}</TableCell>
                      <TableCell>{factura.date}</TableCell>
                      <TableCell>${factura.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell>
                        <Chip label={factura.status} color={factura.status === "Pagado" ? "success" : "error"} />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button variant="outlined" size="small" onClick={() => handleOpenDialog(factura)}>Editar</Button>
                          <Button variant="outlined" component="label" size="small">
                            Subir Imagen
                            <input hidden type="file" accept="image/*" onChange={(e) => {
                              if (e.target.files?.[0]) handleUpload(factura.id, e.target.files[0]);
                            }} />
                          </Button>
                          <Button variant="outlined" color="error" size="small" onClick={() => setInvoices(invoices.filter(f => f.id !== factura.id))}>Eliminar</Button>
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
          <DialogTitle>{editando ? 'Editar Factura' : 'Agregar Factura'}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField label="Cliente" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} fullWidth />
            <TextField label="Fecha" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} InputLabelProps={{ shrink: true }} fullWidth />
            <TextField label="Monto" type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} fullWidth />
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Pagado">Pagado</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave}>Guardar</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
    </ProtectedModule>
  );
};

export default Payments;