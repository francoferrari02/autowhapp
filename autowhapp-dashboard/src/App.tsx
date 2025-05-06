import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ConfigPage from './pages/ConfigPage';
import OrdersPage from './pages/OrdersPage';
import AddBusinessPage from './pages/AddBusinessPage';
import ReservationsPage from './pages/ReservationsPage';
import RemindersPage from './pages/RemindersPage';
import { NegocioProvider } from './NegocioContext';

const App: React.FC = () => {
  return (
    <NegocioProvider>
      <Router>
        <Routes>
          <Route path="/" element={<ConfigPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/add-business" element={<AddBusinessPage />} />
          <Route path="/reservations" element={<ReservationsPage />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="*" element={<div>404 - Página no encontrada</div>} />
        </Routes>
      </Router>
    </NegocioProvider>
  );
};

export default App;