import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Penjualan from './pages/Penjualan';
import Produk from './pages/Produk';
import Pengeluaran from './pages/Pengeluaran';
import StokBahan from './pages/StokBahan';
import PembelianBahan from './pages/PembelianBahan';
import Supplier from './pages/Supplier';
import Piutang from './pages/Piutang';
import Hutang from './pages/Hutang';
import LaporanKeuangan from './pages/LaporanKeuangan';
import Pengaturan from './pages/Pengaturan';

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/penjualan" element={<Penjualan />} />
                    <Route path="/produk" element={<Produk />} />
                    <Route path="/pengeluaran" element={<Pengeluaran />} />
                    <Route path="/stok-bahan" element={<StokBahan />} />
                    <Route path="/pembelian-bahan" element={<PembelianBahan />} />
                    <Route path="/supplier" element={<Supplier />} />
                    <Route path="/piutang" element={<Piutang />} />
                    <Route path="/hutang" element={<Hutang />} />
                    <Route path="/laporan" element={<LaporanKeuangan />} />
                    <Route path="/pengaturan" element={<Pengaturan />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </Router>
    </ThemeProvider>
  );
}
