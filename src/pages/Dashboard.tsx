import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardStats {
  totalPenjualanHariIni: number;
  totalPengeluaranHariIni: number;
  labaBersihHariIni: number;
  stokMenipis: Array<{ nama_bahan: string; jumlah: number; satuan: string }>;
  hutangJatuhTempo: Array<{ nama_pihak: string; jumlah: number; tanggal_jatuh_tempo: string }>;
  piutangJatuhTempo: Array<{ nama_pelanggan: string; jumlah_piutang: number; tanggal_jatuh_tempo: string }>;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPenjualanHariIni: 0,
    totalPengeluaranHariIni: 0,
    labaBersihHariIni: 0,
    stokMenipis: [],
    hutangJatuhTempo: [],
    piutangJatuhTempo: [],
  });
  const [chartData, setChartData] = useState<Array<{ tanggal: string; penjualan: number; pengeluaran: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];

    // Total penjualan hari ini
    const { data: penjualan } = await supabase
      .from('transaksi_penjualan')
      .select('total')
      .gte('tanggal', today);
    
    const totalPenjualan = penjualan?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

    // Total pengeluaran hari ini
    const { data: pengeluaran } = await supabase
      .from('pengeluaran')
      .select('jumlah')
      .gte('tanggal', today);
    
    const totalPengeluaran = pengeluaran?.reduce((sum, item) => sum + item.jumlah, 0) || 0;

    // Stok menipis (< 10)
    const { data: stok } = await supabase
      .from('stok_bahan')
      .select('nama_bahan, jumlah, satuan')
      .lt('jumlah', 10);

    // Hutang jatuh tempo (7 hari ke depan)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const { data: hutang } = await supabase
      .from('hutang')
      .select('nama_pihak, jumlah, tanggal_jatuh_tempo')
      .eq('status', 'Belum Lunas')
      .lte('tanggal_jatuh_tempo', nextWeek.toISOString().split('T')[0]);

    // Piutang jatuh tempo (7 hari ke depan)
    const { data: piutang } = await supabase
      .from('piutang')
      .select('nama_pelanggan, jumlah_piutang, tanggal_jatuh_tempo')
      .eq('status', 'Belum Bayar')
      .lte('tanggal_jatuh_tempo', nextWeek.toISOString().split('T')[0]);

    // Data chart 7 hari terakhir
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const { data: penjualanData } = await supabase
        .from('transaksi_penjualan')
        .select('total')
        .gte('tanggal', dateStr)
        .lt('tanggal', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);
      
      const { data: pengeluaranData } = await supabase
        .from('pengeluaran')
        .select('jumlah')
        .gte('tanggal', dateStr)
        .lt('tanggal', new Date(date.getTime() + 86400000).toISOString().split('T')[0]);
      
      const totalPenjualanHari = penjualanData?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
      const totalPengeluaranHari = pengeluaranData?.reduce((sum, item) => sum + item.jumlah, 0) || 0;
      
      last7Days.push({
        tanggal: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        penjualan: totalPenjualanHari,
        pengeluaran: totalPengeluaranHari,
      });
    }

    setStats({
      totalPenjualanHariIni: totalPenjualan,
      totalPengeluaranHariIni: totalPengeluaran,
      labaBersihHariIni: totalPenjualan - totalPengeluaran,
      stokMenipis: stok || [],
      hutangJatuhTempo: hutang || [],
      piutangJatuhTempo: piutang || [],
    });

    setChartData(last7Days);
    setLoading(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('id-ID', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Penjualan Hari Ini</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-green-600">{formatCurrency(stats.totalPenjualanHariIni)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Pengeluaran Hari Ini</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-red-600">{formatCurrency(stats.totalPengeluaranHariIni)}</div>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Laba Bersih Hari Ini</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={stats.labaBersihHariIni >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(stats.labaBersihHariIni)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Penjualan vs Pengeluaran (7 Hari Terakhir)</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={250} minWidth={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="tanggal" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Line type="monotone" dataKey="penjualan" stroke="#10b981" strokeWidth={2} name="Penjualan" />
                <Line type="monotone" dataKey="pengeluaran" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Stok Menipis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stok Menipis
            </CardTitle>
            <CardDescription>Bahan dengan stok kurang dari 10</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.stokMenipis.length === 0 ? (
              <p className="text-muted-foreground text-sm">Semua stok aman</p>
            ) : (
              <div className="space-y-2">
                {stats.stokMenipis.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                    <span className="text-sm">{item.nama_bahan}</span>
                    <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900">
                      {item.jumlah} {item.satuan}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hutang Jatuh Tempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Hutang Jatuh Tempo
            </CardTitle>
            <CardDescription>7 hari ke depan</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.hutangJatuhTempo.length === 0 ? (
              <p className="text-muted-foreground text-sm">Tidak ada hutang jatuh tempo</p>
            ) : (
              <div className="space-y-2">
                {stats.hutangJatuhTempo.map((item, index) => (
                  <div key={index} className="p-2 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.nama_pihak}</span>
                      <span className="text-red-600 dark:text-red-500 text-sm">{formatCurrency(item.jumlah)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Jatuh tempo: {new Date(item.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Piutang Jatuh Tempo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Piutang Jatuh Tempo
            </CardTitle>
            <CardDescription>7 hari ke depan</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.piutangJatuhTempo.length === 0 ? (
              <p className="text-muted-foreground text-sm">Tidak ada piutang jatuh tempo</p>
            ) : (
              <div className="space-y-2">
                {stats.piutangJatuhTempo.map((item, index) => (
                  <div key={index} className="p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{item.nama_pelanggan}</span>
                      <span className="text-orange-600 dark:text-orange-500 text-sm">{formatCurrency(item.jumlah_piutang)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Jatuh tempo: {new Date(item.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
