import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface LaporanData {
  totalPemasukan: number;
  totalPengeluaran: number;
  labaBersih: number;
  chartData: Array<{ kategori: string; jumlah: number }>;
  penjualanPerProduk: Array<{ produk: string; jumlah: number; total: number }>;
}

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

export default function LaporanKeuangan() {
  const [periode, setPeriode] = useState<'harian' | 'mingguan' | 'bulanan'>('harian');
  const [tanggalMulai, setTanggalMulai] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalSelesai, setTanggalSelesai] = useState(new Date().toISOString().split('T')[0]);
  const [laporan, setLaporan] = useState<LaporanData>({
    totalPemasukan: 0,
    totalPengeluaran: 0,
    labaBersih: 0,
    chartData: [],
    penjualanPerProduk: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handlePeriodeChange(periode);
  }, []);

  const handlePeriodeChange = (newPeriode: 'harian' | 'mingguan' | 'bulanan') => {
    setPeriode(newPeriode);
    const today = new Date();
    
    if (newPeriode === 'harian') {
      setTanggalMulai(today.toISOString().split('T')[0]);
      setTanggalSelesai(today.toISOString().split('T')[0]);
    } else if (newPeriode === 'mingguan') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      setTanggalMulai(weekAgo.toISOString().split('T')[0]);
      setTanggalSelesai(today.toISOString().split('T')[0]);
    } else if (newPeriode === 'bulanan') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      setTanggalMulai(monthAgo.toISOString().split('T')[0]);
      setTanggalSelesai(today.toISOString().split('T')[0]);
    }
  };

  const generateLaporan = async () => {
    setLoading(true);

    // Hitung total pemasukan dari penjualan
    const { data: penjualan } = await supabase
      .from('transaksi_penjualan')
      .select('total, produk:produk_id(nama_produk), jumlah')
      .gte('tanggal', tanggalMulai)
      .lte('tanggal', tanggalSelesai + 'T23:59:59');

    const totalPemasukan = penjualan?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;

    // Hitung total pengeluaran
    const { data: pengeluaran } = await supabase
      .from('pengeluaran')
      .select('*')
      .gte('tanggal', tanggalMulai)
      .lte('tanggal', tanggalSelesai + 'T23:59:59');

    const totalPengeluaran = pengeluaran?.reduce((sum, item) => sum + item.jumlah, 0) || 0;

    // Pengeluaran per kategori untuk chart
    const pengeluaranPerKategori: { [key: string]: number } = {};
    pengeluaran?.forEach(item => {
      pengeluaranPerKategori[item.kategori] = (pengeluaranPerKategori[item.kategori] || 0) + item.jumlah;
    });

    const chartData = Object.entries(pengeluaranPerKategori).map(([kategori, jumlah]) => ({
      kategori,
      jumlah,
    }));

    // Penjualan per produk
    const penjualanPerProduk: { [key: string]: { jumlah: number; total: number } } = {};
    penjualan?.forEach(item => {
      const produkNama = item.produk?.nama_produk || 'Lainnya';
      if (!penjualanPerProduk[produkNama]) {
        penjualanPerProduk[produkNama] = { jumlah: 0, total: 0 };
      }
      penjualanPerProduk[produkNama].jumlah += item.jumlah;
      penjualanPerProduk[produkNama].total += item.total || 0;
    });

    const penjualanProdukArray = Object.entries(penjualanPerProduk).map(([produk, data]) => ({
      produk,
      jumlah: data.jumlah,
      total: data.total,
    }));

    setLaporan({
      totalPemasukan,
      totalPengeluaran,
      labaBersih: totalPemasukan - totalPengeluaran,
      chartData,
      penjualanPerProduk: penjualanProdukArray,
    });

    setLoading(false);
  };

  useEffect(() => {
    if (tanggalMulai && tanggalSelesai) {
      generateLaporan();
    }
  }, [tanggalMulai, tanggalSelesai]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleExport = () => {
    const csvContent = [
      ['Laporan Keuangan Pempek Putri'],
      [`Periode: ${new Date(tanggalMulai).toLocaleDateString('id-ID')} - ${new Date(tanggalSelesai).toLocaleDateString('id-ID')}`],
      [],
      ['Total Pemasukan', formatCurrency(laporan.totalPemasukan)],
      ['Total Pengeluaran', formatCurrency(laporan.totalPengeluaran)],
      ['Laba Bersih', formatCurrency(laporan.labaBersih)],
      [],
      ['Pengeluaran per Kategori'],
      ['Kategori', 'Jumlah'],
      ...laporan.chartData.map(item => [item.kategori, formatCurrency(item.jumlah)]),
      [],
      ['Penjualan per Produk'],
      ['Produk', 'Jumlah Terjual', 'Total Penjualan'],
      ...laporan.penjualanPerProduk.map(item => [item.produk, item.jumlah, formatCurrency(item.total)]),
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `laporan_keuangan_${tanggalMulai}_${tanggalSelesai}.csv`;
    link.click();

    toast.success('Laporan berhasil diunduh');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1>Laporan Keuangan</h1>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Ekspor CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pilih Periode Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Periode</Label>
              <Select value={periode} onValueChange={(value: any) => handlePeriodeChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="harian">Harian</SelectItem>
                  <SelectItem value="mingguan">Mingguan</SelectItem>
                  <SelectItem value="bulanan">Bulanan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Pemasukan</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-green-600">{formatCurrency(laporan.totalPemasukan)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-red-600">{formatCurrency(laporan.totalPengeluaran)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Laba Bersih</CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className={laporan.labaBersih >= 0 ? 'text-green-600' : 'text-red-600'}>
              {formatCurrency(laporan.labaBersih)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran per Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            {laporan.chartData.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data pengeluaran</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={laporan.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="kategori" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="jumlah" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Penjualan per Produk</CardTitle>
          </CardHeader>
          <CardContent>
            {laporan.penjualanPerProduk.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Tidak ada data penjualan</p>
            ) : (
              <div className="space-y-3">
                {laporan.penjualanPerProduk.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p>{item.produk}</p>
                      <p className="text-sm text-gray-600">{item.jumlah} terjual</p>
                    </div>
                    <div className="text-green-600">{formatCurrency(item.total)}</div>
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
