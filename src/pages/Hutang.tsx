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

interface Hutang {
  id: number;
  nama_pihak: string;
  jumlah: number;
  tanggal_pinjam: string;
  tanggal_jatuh_tempo: string;
  status: string;
}

export default function Hutang() {
  const [hutang, setHutang] = useState<Hutang[]>([]);
  const [open, setOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    nama_pihak: '',
    jumlah: '',
    tanggal_pinjam: new Date().toISOString().split('T')[0],
    tanggal_jatuh_tempo: '',
  });

  useEffect(() => {
    fetchHutang();
  }, []);

  const fetchHutang = async () => {
    const { data } = await supabase
      .from('hutang')
      .select('*')
      .order('tanggal_jatuh_tempo', { ascending: true });
    
    if (data) setHutang(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('hutang')
      .insert({
        nama_pihak: formData.nama_pihak,
        jumlah: Number(formData.jumlah),
        tanggal_pinjam: formData.tanggal_pinjam,
        tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo,
      });

    if (error) {
      toast.error('Gagal menambahkan hutang: ' + error.message);
    } else {
      toast.success('Hutang berhasil ditambahkan');
      setOpen(false);
      setFormData({
        nama_pihak: '',
        jumlah: '',
        tanggal_pinjam: new Date().toISOString().split('T')[0],
        tanggal_jatuh_tempo: '',
      });
      fetchHutang();
    }
  };

  const handleLunasi = async (id: number, jumlah: number) => {
    // Update status hutang
    const { error: hutangError } = await supabase
      .from('hutang')
      .update({ status: 'Lunas' })
      .eq('id', id);

    if (hutangError) {
      toast.error('Gagal mengupdate status: ' + hutangError.message);
      return;
    }

    // Catat sebagai pengeluaran
    await supabase
      .from('pengeluaran')
      .insert({
        kategori: 'Lainnya',
        deskripsi: 'Pelunasan hutang',
        jumlah: jumlah,
      });

    toast.success('Hutang berhasil dilunasi');
    fetchHutang();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalHutangBelumLunas = hutang
    .filter(item => item.status === 'Belum Lunas')
    .reduce((sum, item) => sum + item.jumlah, 0);

  const isJatuhTempo = (tanggal: string) => {
    return new Date(tanggal) < new Date();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1>Hutang</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Hutang
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Hutang</DialogTitle>
              <DialogDescription>
                Catat hutang usaha (misal ke supplier)
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_pihak">Nama Pemberi Pinjaman</Label>
                  <Input
                    id="nama_pihak"
                    value={formData.nama_pihak}
                    onChange={(e) => setFormData({ ...formData, nama_pihak: e.target.value })}
                    placeholder="Contoh: PT Maju Jaya"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah Hutang (Rp)</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    min="0"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    placeholder="1000000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tanggal_pinjam">Tanggal Pinjam</Label>
                  <Input
                    id="tanggal_pinjam"
                    type="date"
                    value={formData.tanggal_pinjam}
                    onChange={(e) => setFormData({ ...formData, tanggal_pinjam: e.target.value })}
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
              <AlertCircle className="h-5 w-5 text-red-600" />
              Total Hutang Belum Lunas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-red-600">{formatCurrency(totalHutangBelumLunas)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Jumlah Hutang Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-800">
              {hutang.filter(item => item.status === 'Belum Lunas').length} Hutang
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Hutang</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pemberi Pinjaman</TableHead>
                  <TableHead>Jumlah Hutang</TableHead>
                  <TableHead>Tanggal Pinjam</TableHead>
                  <TableHead>Jatuh Tempo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hutang.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Tidak ada data hutang
                    </TableCell>
                  </TableRow>
                ) : (
                  hutang.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.nama_pihak}</TableCell>
                      <TableCell className="text-red-600">
                        {formatCurrency(item.jumlah)}
                      </TableCell>
                      <TableCell>
                        {new Date(item.tanggal_pinjam).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {new Date(item.tanggal_jatuh_tempo).toLocaleDateString('id-ID')}
                          {item.status === 'Belum Lunas' && isJatuhTempo(item.tanggal_jatuh_tempo) && (
                            <Badge variant="destructive" className="text-xs">
                              Terlambat
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={item.status === 'Lunas' ? 'default' : 'outline'}
                          className={item.status === 'Lunas' ? 'bg-green-600' : 'text-red-600'}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.status === 'Belum Lunas' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLunasi(item.id, item.jumlah)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Lunasi
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
