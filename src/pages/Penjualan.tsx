import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Produk {
  id: number;
  nama_produk: string;
  harga_jual: number;
  stok: number;
}

interface Penjualan {
  id: number;
  tanggal: string;
  produk_id: number;
  jumlah: number;
  harga_satuan: number;
  total: number;
  metode_bayar: string;
  keterangan: string;
  produk?: { nama_produk: string };
}

export default function Penjualan() {
  const [penjualan, setPenjualan] = useState<Penjualan[]>([]);
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    produk_id: '',
    jumlah: '',
    metode_bayar: 'Tunai',
    keterangan: '',
    nama_pelanggan: '',
  });

  useEffect(() => {
    fetchProduk();
    fetchPenjualan();
  }, [filterDate]);

  const fetchProduk = async () => {
    const { data } = await supabase
      .from('produk')
      .select('*')
      .order('nama_produk');
    
    if (data) setProdukList(data);
  };

  const fetchPenjualan = async () => {
    const { data } = await supabase
      .from('transaksi_penjualan')
      .select(`
        *,
        produk:produk_id (nama_produk)
      `)
      .gte('tanggal', filterDate)
      .lt('tanggal', new Date(new Date(filterDate).getTime() + 86400000).toISOString())
      .order('tanggal', { ascending: false });
    
    if (data) setPenjualan(data as Penjualan[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const produk = produkList.find(p => p.id === Number(formData.produk_id));
    if (!produk) {
      toast.error('Produk tidak ditemukan');
      return;
    }

    const jumlah = Number(formData.jumlah);
    if (jumlah <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    // Insert transaksi penjualan
    const { data: transaksiData, error: transaksiError } = await supabase
      .from('transaksi_penjualan')
      .insert({
        produk_id: Number(formData.produk_id),
        jumlah: jumlah,
        harga_satuan: produk.harga_jual,
        metode_bayar: formData.metode_bayar,
        keterangan: formData.keterangan,
      })
      .select()
      .single();

    if (transaksiError) {
      toast.error('Gagal menyimpan transaksi: ' + transaksiError.message);
      return;
    }

    // Jika metode bayar Piutang, tambahkan ke tabel piutang
    if (formData.metode_bayar === 'Piutang' && formData.nama_pelanggan) {
      const jatuhTempo = new Date();
      jatuhTempo.setDate(jatuhTempo.getDate() + 7); // Default 7 hari

      await supabase
        .from('piutang')
        .insert({
          nama_pelanggan: formData.nama_pelanggan,
          jumlah_piutang: jumlah * produk.harga_jual,
          tanggal_transaksi: new Date().toISOString().split('T')[0],
          tanggal_jatuh_tempo: jatuhTempo.toISOString().split('T')[0],
        });
    }

    toast.success('Transaksi berhasil ditambahkan');
    setOpen(false);
    setFormData({
      produk_id: '',
      jumlah: '',
      metode_bayar: 'Tunai',
      keterangan: '',
      nama_pelanggan: '',
    });
    fetchPenjualan();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalPenjualan = penjualan.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1>Penjualan</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Transaksi
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Transaksi Penjualan</DialogTitle>
              <DialogDescription>
                Isi form di bawah untuk menambahkan transaksi penjualan baru
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="produk">Produk</Label>
                  <Select
                    value={formData.produk_id}
                    onValueChange={(value) => setFormData({ ...formData, produk_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih produk" />
                    </SelectTrigger>
                    <SelectContent>
                      {produkList.map((produk) => (
                        <SelectItem key={produk.id} value={String(produk.id)}>
                          {produk.nama_produk} - {formatCurrency(produk.harga_jual)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    min="1"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metode_bayar">Metode Pembayaran</Label>
                  <Select
                    value={formData.metode_bayar}
                    onValueChange={(value) => setFormData({ ...formData, metode_bayar: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tunai">Tunai</SelectItem>
                      <SelectItem value="Non-Tunai">Non-Tunai</SelectItem>
                      <SelectItem value="Piutang">Piutang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.metode_bayar === 'Piutang' && (
                  <div className="space-y-2">
                    <Label htmlFor="nama_pelanggan">Nama Pelanggan</Label>
                    <Input
                      id="nama_pelanggan"
                      value={formData.nama_pelanggan}
                      onChange={(e) => setFormData({ ...formData, nama_pelanggan: e.target.value })}
                      placeholder="Nama pelanggan yang berutang"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="keterangan">Keterangan (Opsional)</Label>
                  <Input
                    id="keterangan"
                    value={formData.keterangan}
                    onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Penjualan</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <Input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="text-right">
              <span className="text-gray-600">Total Penjualan: </span>
              <span className="text-green-600">{formatCurrency(totalPenjualan)}</span>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead>Keterangan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {penjualan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Tidak ada transaksi pada tanggal ini
                    </TableCell>
                  </TableRow>
                ) : (
                  penjualan.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.tanggal).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{item.produk?.nama_produk || '-'}</TableCell>
                      <TableCell>{item.jumlah}</TableCell>
                      <TableCell>{formatCurrency(item.harga_satuan)}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.metode_bayar === 'Tunai'
                              ? 'default'
                              : item.metode_bayar === 'Non-Tunai'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {item.metode_bayar}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.keterangan || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
