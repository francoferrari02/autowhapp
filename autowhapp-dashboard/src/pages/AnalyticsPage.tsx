import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, TextField, Button } from '@mui/material';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';

// Función para obtener la fecha actual
const getCurrentDate = () => {
  const date = new Date();
  return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
};

const AnalyticsPage: React.FC = () => {
  const { negocioId } = useNegocio();
  const [ingresos, setIngresos] = useState<number>(0);
  const [totalVentas, setTotalVentas] = useState<number>(0);
  const [totalReservas, setTotalReservas] = useState<number>(0);
  const [productosVendidos, setProductosVendidos] = useState<string[]>([]);
  const [cantProductoVendido, setCantProductoVendido] = useState<number[]>([]);
  const [ventasPorSemana, setVentasPorSemana] = useState<string[]>([]);
  const [cantVentasEnSemana, setCantVentasEnSemana] = useState<number[]>([]);
  const [ventasDiarias, setVentasDiarias] = useState<{ date: string; sales: number }[]>([]);
  const [startDate, setStartDate] = useState<string>(getCurrentDate());
  const [endDate, setEndDate] = useState<string>(getCurrentDate());
  const [error, setError] = useState<string | null>(null);

  // Función para obtener datos basada en el rango de fechas
  const fetchData = (start: string, end: string) => {
    if (negocioId) {
      axios.get<{ count: number }>(`/api/cantVentas/${negocioId}?startDate=${start}&endDate=${end}`).then(res => {
        setTotalVentas(res.data.count);
      }).catch(err => {
        console.error('Error al obtener ventas:', err);
        setError('No se pudieron cargar las ventas');
      });

      axios.get<{ count: number }>(`/api/cantReservas/${negocioId}?startDate=${start}&endDate=${end}`).then(res => {
        setTotalReservas(res.data.count);
      }).catch(err => {
        console.error('Error al obtener reservas:', err);
        setError('No se pudieron cargar las reservas');
      });

      axios.get<{ total: number }>(`/api/ingresos/${negocioId}?startDate=${start}&endDate=${end}`).then(res => {
        setIngresos(res.data.total);
      }).catch(err => {
        console.error('Error al obtener ingresos:', err);
        setError('No se pudieron cargar los ingresos');
      });

      // Obtener ventas diarias
      axios.get<{ dailySales: { date: string; sales: number }[] }>(`/api/ventasDiarias/${negocioId}?startDate=${start}&endDate=${end}`).then(res => {
        setVentasDiarias(res.data.dailySales);
      }).catch(err => {
        console.error('Error al obtener ventas diarias:', err);
        setError('No se pudieron cargar las ventas diarias');
      });
    }
  };

  useEffect(() => {
    fetchData(startDate, endDate);
  }, [negocioId, startDate, endDate]);

  const getProductosVendidos = () => {
    if (negocioId) {
      axios.get<{ productosVendidos: Record<string, number> }>(`/api/productosVendidos/${negocioId}`)
        .then(res => {
          const conteo = res.data.productosVendidos;
          const nombres = Object.keys(conteo);
          const cantidades = nombres.map(nombre => conteo[nombre]);

          setProductosVendidos(nombres);
          setCantProductoVendido(cantidades);
        })
        .catch(err => {
          console.error('Error al obtener productos vendidos:', err);
          setError('No se pudieron cargar los productos vendidos');
        });
    }
  };

  const getVentasPorSemana = () => {
    if (negocioId) {
      axios.get<{ ventasPorSemana: number[] }>(`/api/ventasPorSemana/${negocioId}`)
        .then(res => {
          setCantVentasEnSemana(res.data.ventasPorSemana);
        })
        .catch(err => {
          console.error('Error al obtener ventas por semana:', err);
          setError('No se pudieron cargar las ventas por semana');
        });
    }
  };

  useEffect(() => {
    getProductosVendidos();
  }, [negocioId]);

  useEffect(() => {
    getVentasPorSemana();
  }, [negocioId]);

  // Datos de ejemplo para gráficos (reemplazar con datos reales)
  const frecuenciaVentas = [
    { name: 'Semana 1', ventas: 10 },
    { name: 'Semana 2', ventas: 15 },
    { name: 'Semana 3', ventas: 20 },
    { name: 'Semana 4', ventas: 12 },
  ];

  const pastelData = productosVendidos.map((nombre, i) => ({
    name: nombre,
    value: cantProductoVendido[i] || 0
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB', '#FFCE56'];

  return (
    <Box sx={{ backgroundColor: '#2563EB', minHeight: '100vh' }}>
      <Header />
      <Box display="flex">
        <Sidebar selected="analytics" />
        <Box flexGrow={1} sx={{ padding: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1rem' }}>
            <h2 className="text-2xl font-poppins font-bold text-white" style={{ marginTop: '0.5rem' }}>
              Analíticas
            </h2>
            <Box sx={{ backgroundColor: 'white', padding: 2, borderRadius: 8, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)', display: 'flex', gap: 2 }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Fecha Fin"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <Button variant="contained" onClick={() => fetchData(startDate, endDate)}>
                Filtrar
              </Button>
            </Box>
          </Box>
          <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 8, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}>
            {error && <Typography color="error">{error}</Typography>}

            {/* Métricas clave */}
            <Box display="flex" justifyContent="space-between" mb={4}>
              <Card sx={{ minWidth: 200, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <CardContent>
                  <Typography variant="h6">Total de Ventas</Typography>
                  <Typography variant="h4">{totalVentas}</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 200, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <CardContent>
                  <Typography variant="h6">Total de Reservas</Typography>
                  <Typography variant="h4">{totalReservas}</Typography>
                </CardContent>
              </Card>
              <Card sx={{ minWidth: 200, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <CardContent>
                  <Typography variant="h6">Ingresos Generados</Typography>
                  <Typography variant="h4">${ingresos}</Typography>
                </CardContent>
              </Card>
            </Box>

            {/* Gráficos */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              {/* Gráfico de polígono de frecuencias */}
              <Box sx={{ width: '50%', backgroundColor: '#f5f5f5', borderRadius: 1, p: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Poppins', mb: 2 }}>
                  Frecuencia de Ventas
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <LineChart width={500} height={300} data={frecuenciaVentas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="ventas" stroke="#8884d8" />
                  </LineChart>
                </Box>
              </Box>

              {/* Gráfico de pastel */}
              <Box sx={{ width: '50%', backgroundColor: '#f5f5f5', borderRadius: 1, p: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Poppins', mb: 2 }}>
                  Distribución de Ventas
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
                  <PieChart width={400} height={350}>
                    <Pie
                      data={pastelData}
                      cx={200}
                      cy={120}
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pastelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </Box>
              </Box>
            </Box>

            {/* Gráfico de barras para ventas diarias */}
            <Box sx={{ backgroundColor: '#f5f5f5', borderRadius: 1, p: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontFamily: 'Poppins', mb: 2 }}>
                Ventas Diarias
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <BarChart width={800} height={300} data={ventasDiarias}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#82ca9d" />
                </BarChart>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AnalyticsPage;