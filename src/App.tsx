import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { StockInPage } from '@/pages/StockInPage';
import { PricingPage } from '@/pages/PricingPage';
import { SalesPage } from '@/pages/SalesPage';
import { TradeInPage } from '@/pages/TradeInPage';
import { PointsPage } from '@/pages/PointsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { WishlistPage } from '@/pages/WishlistPage';
import { useEffect } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { useSaleStore } from '@/store/useSaleStore';
import { useBookRequestStore } from '@/store/useBookRequestStore';
import { usePointsStore } from '@/store/usePointsStore';
import { useSystemConfigStore } from '@/store/useSystemConfigStore';

function AppInitializer() {
  const initBooks = useBookStore((state) => state.init);
  const initSales = useSaleStore((state) => state.init);
  const initBookRequests = useBookRequestStore((state) => state.init);
  const initPoints = usePointsStore((state) => state.init);
  const initSystemConfig = useSystemConfigStore((state) => state.init);

  useEffect(() => {
    initSystemConfig();
    initBooks();
    initSales();
    initBookRequests();
    initPoints();
  }, [initBooks, initSales, initBookRequests, initPoints, initSystemConfig]);

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
          <Route path="/points" element={<PointsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
