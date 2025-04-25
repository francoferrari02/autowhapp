import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ConfigPage from './pages/ConfigPage';
import OrdersPage from './pages/OrdersPage'; // Importamos OrdersPage

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ConfigPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        {/* Dejamos la ruta de analíticas comentada, ya que no la estamos usando en este sprint */}
        {/* <Route path="/analytics" element={<AnalyticsPage />} /> */}
      </Routes>
    </Router>
  );
};

export default App;