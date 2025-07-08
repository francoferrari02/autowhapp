// actualizado con gráfico comparativo, ingreso total, producto menos vendido y estilo centrado
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useNegocio } from '../NegocioContext';
import axios from 'axios';
import { useAuth0 } from '@auth0/auth0-react';

const MockAnalyticsPage: React.FC = () => {
    const { negocioId } = useNegocio();
  const [ingresos, setIngresos] = useState(0);
  const { getAccessTokenSilently } = useAuth0();
  const [totalVentas, setTotalVentas] = useState(0);
  const [ventasMesAnterior, setVentasMesAnterior] = useState(0);
  const [totalReservas, setTotalReservas] = useState(0);
  const [productosVendidos, setProductosVendidos] = useState<string[]>([]);
  const [cantProductoVendido, setCantProductoVendido] = useState<number[]>([]);
  const [cantVentasEnSemana, setCantVentasEnSemana] = useState<number[]>([]);
  const [ventasPorHora, setVentasPorHora] = useState<number[]>([]);
  const [historicoDatos, setHistoricoDatos] = useState<Record<string, any>>({});
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [ingresosTotalesPosta, setIngresosTotales] = useState(0);
    const [productoMasVendido, setProductoMasVendido] = useState<string>('no disponible');
    const [productoMenosVendido, setProductoMenosVendido] = useState<string>('no disponible');
  const [error, setError] = useState<string | null>(null);

  const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB'];

  const generarDatosMock = () => {
    const productos = ["Pizza", "Hamburguesa", "Empanada", "Ensalada", "Fideos", "Sushi"];
    const newData: Record<string, any> = {};

    for (let year = 2021; year <= 2025; year++) {
      for (let month = 1; month <= 12; month++) {
        const vendidos = productos.map(() => Math.floor(Math.random() * 30) + 5);
        const semanas = Array.from({ length: 4 }, () => Math.floor(Math.random() * 25) + 5);
        const horas = Array.from({ length: 24 }, () => Math.floor(Math.random() * 15));
        const total = vendidos.reduce((a, b) => a + b, 0);

        newData[`${year}-${month}`] = {
          productosVendidos: [...productos],
          cantProductoVendido: vendidos,
          cantVentasEnSemana: semanas,
          ventasPorHora: horas,
          totalVentas: total,
          ventasMesAnterior: Math.floor(Math.random() * 100),
          totalReservas: Math.floor(Math.random() * 30),
          ingresos: total * 800
        };
      }
    }

    setHistoricoDatos(newData);

    const key = `${selectedYear}-${selectedMonth}`;
    const data = newData[key];

    setProductosVendidos(data.productosVendidos);
    setCantProductoVendido(data.cantProductoVendido);
    setCantVentasEnSemana(data.cantVentasEnSemana);
    setVentasPorHora(data.ventasPorHora);
    setTotalVentas(data.totalVentas);
    setVentasMesAnterior(data.ventasMesAnterior);
    setTotalReservas(data.totalReservas);
    setIngresos(data.ingresos);
  setProductoMasVendido(productosVendidos[cantProductoVendido.indexOf(Math.max(...cantProductoVendido))]);
  setProductoMenosVendido(productosVendidos[cantProductoVendido.indexOf(Math.min(...cantProductoVendido))]);
  };

  useEffect(() => {
    const key = `${selectedYear}-${selectedMonth}`;
    const data = historicoDatos[key];
    if (data) {
      setProductosVendidos(data.productosVendidos);
      setCantProductoVendido(data.cantProductoVendido);
      setCantVentasEnSemana(data.cantVentasEnSemana);
      setVentasPorHora(data.ventasPorHora);
      setTotalVentas(data.totalVentas);
      setVentasMesAnterior(data.ventasMesAnterior);
      setTotalReservas(data.totalReservas);
      setIngresos(data.ingresos);
    }
  }, [selectedMonth, selectedYear, historicoDatos]);

  const fetchData = async () => {
    if (negocioId) {
        const year = selectedYear;
        const month = selectedMonth;
        try{
            const token = await getAccessTokenSilently({
            authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
        });
            const res = await axios.get<{ count: number }>(`${process.env.REACT_APP_API_URL}/api/cantVentas/${negocioId}?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTotalVentas(res.data.count);
            console.log("Year:", year, "Month:", month, "Total Ventas:", res.data.count);
        }
        catch (error) {
            console.error('Error al obtener ventas:', error);
            setTotalVentas(-10);
            setError('No se pudieron cargar las ventas');
        }


        try{
            const token = await getAccessTokenSilently({
            authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
        });
            const res = await axios.get<{ count: number }>(`${process.env.REACT_APP_API_URL}/api/cantReservas/${negocioId}?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTotalReservas(res.data.count);
        }
        catch (error) {
            console.error('Error al obtener reservas:', error);
            setTotalReservas(-10);
            setError('No se pudieron cargar las reservas');
        }
      /*
      axios.get<{ count: number }>(`/api/cantReservas/${negocioId}?year=${year}&month=${month}`).then(res => {
        setTotalReservas(res.data.count);
      console.log("Total Reservas:", res.data.count);
      }).catch(err => {
        console.error('Error al obtener reservas:', err);
        setTotalReservas(-10);
        setError('No se pudieron cargar las reservas');
      });*/



        try{
            const token = await getAccessTokenSilently({
            authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
        });
            const res = await axios.get<{ count: number }>(`${process.env.REACT_APP_API_URL}/api/ingresos/${negocioId}?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIngresos(res.data.count);
            setIngresosTotales(res.data.count);
        }
        catch (error) {
            console.error('Error al obtener ingresos:', error);
            setIngresos(-10);
            setError('No se pudieron cargar los ingresos');
        }


        try{
            const token = await getAccessTokenSilently({
            authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
        });
            const res = await axios.get<{ count: string }>(`${process.env.REACT_APP_API_URL}/api/masVendido/${negocioId}?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProductoMasVendido(res.data.count);
        }
        catch (error) {
            console.error('Error al producto mas vendido:', error);
            setProductoMasVendido('no disponible');
        }


        try{
            const token = await getAccessTokenSilently({
            authorizationParams: {
            audience: 'https://dev-15eg10mp60jkcv6l.us.auth0.com/api/v2/'
            }
        });
            const res = await axios.get<{ count: string }>(`${process.env.REACT_APP_API_URL}/api/menosVendido/${negocioId}?year=${year}&month=${month}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProductoMenosVendido(res.data.count);
        }
        catch (error) {
            console.error('Error al producto mas vendido:', error);
            setProductoMenosVendido('no disponible');
        }


        
      /*
      axios.get<{ total: number }>(`/api/ingresos/${negocioId}?year=${year}&month=${month}`).then(res => {
        setIngresos(res.data.total);
        setIngresos(123);
        //setError('Ingresos no muestra segun mes y año, ni cantidad de productos');
      console.log("Ingresos:", res.data.total);
      }).catch(err => {
        console.error('Error al obtener ingresos:', err);
        setIngresos(-10);
        setError('No se pudieron cargar los ingresos');
      });*/



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

  useEffect(() => {
          fetchData();
      }, [negocioId]);

  const variacionVentas = ventasMesAnterior > 0 ? Math.round(((totalVentas - ventasMesAnterior) / ventasMesAnterior) * 100) : 0;
  const tendenciaCrecimiento = cantVentasEnSemana.reduce((acc, v, i) => acc + i * v, 0);
  const franjaTop = ventasPorHora.indexOf(Math.max(...ventasPorHora));
  const promedioVentasSemana = Math.round(cantVentasEnSemana.reduce((a, b) => a + b, 0) / cantVentasEnSemana.length);
  const ingresoPromedioPorVenta = totalVentas > 0 ? Math.round(ingresos / totalVentas) : 0;
  //const productoMasVendido = productosVendidos[cantProductoVendido.indexOf(Math.max(...cantProductoVendido))];
  //const productoMenosVendido = productosVendidos[cantProductoVendido.indexOf(Math.min(...cantProductoVendido))];

  const frecuenciaVentas = cantVentasEnSemana.map((ventas, i) => {
    const day = new Date(selectedYear, selectedMonth - 1, 1 + i * 7);
    const end = new Date(selectedYear, selectedMonth - 1, 1 + (i + 1) * 7 - 1);
    const formatted = `${day.getDate().toString().padStart(2, '0')}/${(day.getMonth() + 1).toString().padStart(2, '0')} - ${end.getDate().toString().padStart(2, '0')}/${(end.getMonth() + 1).toString().padStart(2, '0')}`;
    return { name: formatted, ventas };
  });

  const pastelData = productosVendidos.map((nombre, i) => ({
    name: nombre,
    value: cantProductoVendido[i]
  }));

  const ingresosTotales = Object.values(historicoDatos).reduce((acc: number, entry: any) => acc + (entry.ingresos || 0), 0);

  const datosComparativos = Object.entries(historicoDatos)
    .filter(([key]) => key.startsWith(`${selectedYear}-`))
    .map(([key, val]) => ({ name: `${key.split('-')[1].padStart(2, '0')}/${key.split('-')[0]}`, ingresos: val.ingresos }));

  return (
    <div className="flex-grow bg-blue-600 p-6 min-h-screen">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-poppins font-bold text-white mt-2">Analíticas</h2>
          <div className="flex-1 flex justify-end max-w-[480px]">
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} sx={{ backgroundColor: '#f5f5f5', borderRadius: 6, fontWeight: 'bold' }} variant="outlined">
                {meses.map((mes, i) => (<MenuItem key={i + 1} value={i + 1}>{mes}</MenuItem>))}
              </Select>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} sx={{ backgroundColor: '#f5f5f5', borderRadius: 6, fontWeight: 'bold' }} variant="outlined">
                {years.map((year) => (<MenuItem key={year} value={year}>{year}</MenuItem>))}
              </Select>
            </Box>
          </div>
        </div>

        <Box sx={{ backgroundColor: 'white', padding: 6, borderRadius: 8 }}>
          <Button variant="contained" onClick={generarDatosMock} sx={{ mb: 4, backgroundColor: '#1e3a8a' }}>Generar datos aleatorios</Button>

          <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2} mb={4}>
            {[{
              label: 'Ingresos totales', value: `${ingresosTotalesPosta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`
            }, {
              label: 'Ingresos este mes', value: `${ingresos.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`
            }, {
              label: 'Total de Ventas', value: totalVentas, extra: variacionVentas
            }, {
              label: 'Ingreso promedio/venta', value: `${ingresoPromedioPorVenta.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`
            }, {
              label: 'Total de Reservas', value: totalReservas
            }, {
              label: 'Más vendido', value: productoMasVendido
            }, {
              label: 'Menos vendido', value: productoMenosVendido
            }, {
              label: 'Tendencia de crecimiento', value: tendenciaCrecimiento > 0 ? '📈 Positiva' : '📉 Negativa'
            }].map((item, i) => (
              <Card key={i} sx={{ minWidth: 200, flex: 1, backgroundColor: '#f5f5f5' }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6">{item.label}</Typography>
                  <Typography variant="h5">{item.value}</Typography>
                  {typeof item.extra === 'number' && (
                    <Typography variant="body2" sx={{ color: item.extra >= 0 ? 'green' : 'red' }}>
                      {item.extra >= 0 ? '📈' : '📉'} {Math.abs(item.extra)}% respecto al mes anterior
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: 1, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Frecuencia de Ventas</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={frecuenciaVentas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" label={{ value: 'Semana', position: 'insideBottom', offset: -5 }} />
                  <YAxis label={{ value: 'Ventas', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: any, name: any) => [`${value}`, name.charAt(0).toUpperCase() + name.slice(1)]} />
                  <Line type="monotone" dataKey="ventas" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </Box>

            <Box sx={{ flex: 1, backgroundColor: '#f5f5f5', borderRadius: 1, p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Distribución de Productos Vendidos</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pastelData} cx="50%" cy="50%" outerRadius={80} labelLine={false} fill="#8884d8" dataKey="value">
                    {pastelData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Box>

          <Box sx={{ backgroundColor: '#f5f5f5', mt: 4, borderRadius: 1, p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>Comparativa de Ingresos por Mes ({selectedYear})</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={datosComparativos}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" label={{ value: 'Mes', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Ingresos', angle: -90, position: 'insideLeft', dx: -10 }} />
                <Tooltip />
                <Bar dataKey="ingresos" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default MockAnalyticsPage;
