import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Piutang {
  id: number;
  nama_pelanggan: string;
  jumlah_piutang: number;
  tanggal_transaksi: string;
  tanggal_jatuh_tempo: string;
  status: string;
}

export default function Piutang() {
  const [piutang, setPiutang] = useState<Piutang[]>([]);
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nama_pelanggan: '',
    jumlah_piutang: '',
    tanggal_transaksi: new Date().toISOString().split('T')[0],
    tanggal_jatuh_tempo: '',
  });

  useEffect(() => {
    fetchPiutang();
  }, []);

  const fetchPiutang = async () => {
    const { data } = await supabase
      .from('piutang')
      .select('*')
      .order('tanggal_jatuh_tempo', { ascending: true });
    
    if (data) setPiutang(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('piutang')
      .insert({
        nama_pelanggan: formData.nama_pelanggan,
        jumlah_piutang: Number(formData.jumlah_piutang),
        tanggal_transaksi: formData.tanggal_transaksi,
        tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo,
      });

    if (error) {
      toast.error('Gagal menambahkan piutang: ' + error.message);
    } else {
      toast.success('Piutang berhasil ditambahkan');
      setOpen(false);
      setFormData({
        nama_pelanggan: '',
        jumlah_piutang: '',
        tanggal_transaksi: new Date().toISOString().split('T')[0],
        tanggal_jatuh_tempo: '',
      });
      fetchPiutang();
    }
  };

  const handleBayar = async (id: number, jumlah: number) => {
    // Update status piutang
    const { error: piutangError } = await supabase
      .from('piutang')
      .update({ status: 'Sudah Bayar' })
      .eq('id', id);

    if (piutangError) {
      toast.error('Gagal mengupdate status: ' + piutangError.message);
      return;
    }

    // Catat sebagai penjualan tunai
    await supabase
      .from('transaksi_penjualan')
      .insert({
        produk_id: null,
        jumlah: 1,
        harga_satuan: jumlah,
        metode_bayar: 'Tunai',
        keterangan: 'Pelunasan piutang',
      });

    toast.success('Piutang berhasil dilunasi');
    fetchPiutang();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalPiutangBelumBayar = piutang
    .filter(item => item.status === 'Belum Bayar')
    .reduce((sum, item) => sum + item.jumlah_piutang, 0);

  const isJatuhTempo = (tanggal: string) => {
    return new Date(tanggal) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1>Piutang</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Piutang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Piutang</DialogTitle>
              <DialogDescription>
                Catat pelanggan yang memiliki hutang
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_pelanggan">Nama Pelanggan</Label>
                  <Input
                    id="nama_pelanggan"
                    value={formData.nama_pelanggan}
                    onChange={(e) => setFormData({ ...formData, nama_pelanggan: e.target.value })}
                    placeholder="Nama pelanggan"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah_piutang">Jumlah Piutang (Rp)</Label>
                  <Input
                    id="jumlah_piutang"
                    type="number"
                    min="0"
                    value={formData.jumlah_piutang}
                    onChange={(e) => setFormData({ ...formData, jumlah_piutang: e.target.value })}
                    placeholder="50000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_transaksi">Tanggal Transaksi</Label>
                  <Input
                    id="tanggal_transaksi"
                    type="date"
                    value={formData.tanggal_transaksi}
                    onChange={(e) => setFormData({ ...formData, tanggal_transaksi: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_jatuh_tempo">Tanggal Jatuh Tempo</Label>
                  <Input
                    id="tanggal_jatuh_tempo"
                    type="date"
                    value={formData.tanggal_jatuh_tempo}
                    onChange={(e) => setFormData({ ...formData, tanggal_jatuh_tempo: e.target.value })}
                    required
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Total Piutang Belum Bayar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-orange-600">{formatCurrency(totalPiutangBelumBayar)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Jumlah Pelanggan Berutang
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-800">
              {piutang.filter(item => item.status === 'Belum Bayar').length} Pelanggan
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Piutang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pelanggan</TableHead>
                  <TableHead>Jumlah Piutang</TableHead>
                  <TableHead>Tanggal Transaksi</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {piutang.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Tidak ada data piutang
                    </TableCell>
                  </TableRow>
                ) : (
                  piutang.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nama_pelanggan}</TableCell>
                      <TableCell className="text-orange-600">
                        {formatCurrency(item.jumlah_piutang)}
                      </TableCell>
                      <TableCell>
                        {new Date(item.tanggal_transaksi).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {new Date(item.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}
                          {item.status === 'Belum Bayar' && isJatuhTempo(item.tanggal_jatuh_tempo) && (
                            <Badge variant="destructive" className="text-xs">
                              Terlambat
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'Sudah Bayar' ? 'default' : 'outline'}
                          className={item.status === 'Sudah Bayar' ? 'bg-green-600' : 'text-orange-600'}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === 'Belum Bayar' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBayar(item.id, item.jumlah_piutang)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Sudah Bayar
                          </Button>
                        )}
                      </TableCell>
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
