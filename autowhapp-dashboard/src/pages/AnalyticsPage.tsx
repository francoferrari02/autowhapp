import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import { useNegocio } from '../NegocioContext';

// Función para obtener el mes y año actual
const getCurrentMonthYear = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 2).padStart(2, '0')}`;
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
  const [selectedDate, setSelectedDate] = useState<string>(getCurrentMonthYear());
  const [error, setError] = useState<string | null>(null);

  // Función para obtener datos basada en la fecha seleccionada
  const fetchData = (date: string) => {
    if (negocioId) {
        
      const [year, month] = date.split('-');
      axios.get<{ count: number }>(`/api/cantVentas/${negocioId}?year=${year}&month=${month}`).then(res => {
        setTotalVentas(res.data.count);
        setError('Los parametros no dependen del mes y año. Y en ingresos no cuenta la cantidad de productos vendidos, solo cuales');
      }).catch(err => {
        console.error('Error al obtener ventas:', err);
        setError('No se pudieron cargar las ventas');
      });

      
      axios.get<{ count: number }>(`/api/cantReservas/${negocioId}?year=${year}&month=${month}`).then(res => {
        setTotalReservas(res.data.count);
      }).catch(err => {
        console.error('Error al obtener reservas:', err);
        setError('No se pudieron cargar las reservas');
      });
      
      axios.get<{ total: number }>(`/api/ingresos/${negocioId}?year=${year}&month=${month}`).then(res => {
        setIngresos(res.data.total);
        //setError('Ingresos no muestra segun mes y año, ni cantidad de productos');
      }).catch(err => {
        console.error('Error al obtener ingresos:', err);
        setError('No se pudieron cargar los ingresos');
      });
    }
  };



  useEffect(() => {
    fetchData(selectedDate);
  }, [negocioId, selectedDate]);

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
    }

    const getVentasPorSemana = () => {
        if (negocioId) {
            axios.get<{ ventasPorSemana: number[]  }>(`/api/ventasPorSemana/${negocioId}`)
            .then(res => {
                setCantVentasEnSemana(res.data.ventasPorSemana);
            })
            .catch(err => {
                console.error('Error al obtener ventas por semana:', err);
                setError('No se pudieron cargar las ventas por semana');
            });
        }
    }

    useEffect(() => {
        getProductosVendidos();
    });

    useEffect(() => {
        getVentasPorSemana();
    });

  // Generar opciones de mes y año (últimos 12 meses)
  const generateDateOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 2).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  };

  const dateOptions = generateDateOptions();


  // Datos de ejemplo para gráficos (reemplazar con datos reales)
  const frecuenciaVentas = [
    //{ name: ventasPorSemana[0], ventas: cantVentasEnSemana[0] },
    //{ name: 'Semana 0', ventas: cantVentasEnSemana[1] },
    { name: 'Semana 1', ventas: 10 },
    { name: 'Semana 2', ventas: 15 },
    { name: 'Semana 3', ventas: 20 },
    { name: 'Semana 4', ventas: 12 },
  ];

    const pastelData = productosVendidos.map((nombre, i) => ({
        name: nombre,
        value: cantProductoVendido[i]
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
            <Box sx={{ backgroundColor: 'white', padding: 2, borderRadius: 8, boxShadow: '0 0 7px 7px rgba(0,0,0,0.2)' }}>
              <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                <InputLabel>Mes y Año</InputLabel>
                <Select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value as string)}
                  label="Mes y Año"
                >
                  {dateOptions.map((date) => (
                    <MenuItem key={date} value={date}>
                      {new Date(date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <PieChart width={400} height={300}>
                    <Pie
                      data={pastelData}
                      cx={200}
                      cy={150}
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
                    <Legend />
                  </PieChart>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default AnalyticsPage;