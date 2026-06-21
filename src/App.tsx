import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { StockInPage } from '@/pages/StockInPage';
import { PricingPage } from '@/pages/PricingPage';
import { SalesPage } from '@/pages/SalesPage';
import { TradeInPage } from '@/pages/TradeInPage';
import { useEffect } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { useSaleStore } from '@/store/useSaleStore';

function AppInitializer() {
  const initBooks = useBookStore((state) => state.init);
  const initSales = useSaleStore((state) => state.init);

  useEffect(() => {
    initBooks();
    initSales();
  }, [initBooks, initSales]);

  return null;
}

export default function App() {
  return (
    <Router>
      <AppInitializer />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/stock-in" element={<StockInPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/trade-in" element={<TradeInPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
