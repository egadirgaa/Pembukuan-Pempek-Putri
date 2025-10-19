import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Archive, 
  ShoppingBag, 
  Users, 
  CreditCard, 
  FileText, 
  BarChart3, 
  Settings,
  LogOut
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner@2.0.3';

const menuItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/penjualan', icon: ShoppingCart, label: 'Penjualan' },
  { path: '/produk', icon: Package, label: 'Produk' },
  { path: '/pengeluaran', icon: DollarSign, label: 'Pengeluaran' },
  { path: '/stok-bahan', icon: Archive, label: 'Stok Bahan' },
  { path: '/pembelian-bahan', icon: ShoppingBag, label: 'Pembelian Bahan' },
  { path: '/supplier', icon: Users, label: 'Supplier' },
  { path: '/piutang', icon: CreditCard, label: 'Piutang' },
  { path: '/hutang', icon: FileText, label: 'Hutang' },
  { path: '/laporan', icon: BarChart3, label: 'Laporan' },
  { path: '/pengaturan', icon: Settings, label: 'Pengaturan' },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Berhasil logout');
    navigate('/login');
  };

  const handleNavClick = () => {
    if (onNavigate) {
      onNavigate();
    }
  };

  return (
    <aside className="w-64 bg-card border-r border-border min-h-screen flex flex-col">
      {/* Logo - Hidden on mobile (shown in Layout header) */}
      <div className="p-6 hidden md:block">
        <h1 className="text-orange-600">🍢 Pempek Putri</h1>
      </div>

      {/* Mobile Logo */}
      <div className="p-6 md:hidden">
        <h1 className="text-orange-600">🍢 Pempek Putri</h1>
      </div>
      
      <nav className="flex-1 px-3 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                isActive 
                  ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-500' 
                  : 'text-foreground hover:bg-accent'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-lg w-full text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
