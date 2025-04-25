import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ConfigPage from './pages/ConfigPage';
import OrdersPage from './pages/OrdersPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConfigPage />} />
        <Route path="/orders" element={<OrdersPage />} />
      </Routes>
    </Router>
  );
};

export default App;