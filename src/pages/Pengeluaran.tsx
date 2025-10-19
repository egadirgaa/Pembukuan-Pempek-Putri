import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Filter } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Pengeluaran {
  id: number;
  tanggal: string;
  kategori: string;
  deskripsi: string;
  jumlah: number;
}

const KATEGORI_OPTIONS = [
  'Bahan Baku',
  'Gas',
  'Minyak',
  'Gaji',
  'Sewa',
  'Listrik',
  'Air',
  'Transportasi',
  'Lainnya',
];

export default function Pengeluaran() {
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    kategori: 'Bahan Baku',
    deskripsi: '',
    jumlah: '',
  });

  useEffect(() => {
    fetchPengeluaran();
  }, [filterDate]);

  const fetchPengeluaran = async () => {
    const { data } = await supabase
      .from('pengeluaran')
      .select('*')
      .gte('tanggal', filterDate)
      .lt('tanggal', new Date(new Date(filterDate).getTime() + 86400000).toISOString())
      .order('tanggal', { ascending: false });
    
    if (data) setPengeluaran(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from('pengeluaran')
      .insert({
        kategori: formData.kategori,
        deskripsi: formData.deskripsi,
        jumlah: Number(formData.jumlah),
      });

    if (error) {
      toast.error('Gagal menambahkan pengeluaran: ' + error.message);
    } else {
      toast.success('Pengeluaran berhasil ditambahkan');
      setOpen(false);
      setFormData({
        kategori: 'Bahan Baku',
        deskripsi: '',
        jumlah: '',
      });
      fetchPengeluaran();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalPengeluaran = pengeluaran.reduce((sum, item) => sum + item.jumlah, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1>Pengeluaran</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Pengeluaran
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pengeluaran</DialogTitle>
              <DialogDescription>
                Catat pengeluaran operasional usaha
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori</Label>
                  <Select
                    value={formData.kategori}
                    onValueChange={(value) => setFormData({ ...formData, kategori: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KATEGORI_OPTIONS.map((kategori) => (
                        <SelectItem key={kategori} value={kategori}>
                          {kategori}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Input
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                    placeholder="Contoh: Beli minyak goreng 20 liter"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jumlah">Jumlah (Rp)</Label>
                  <Input
                    id="jumlah"
                    type="number"
                    min="0"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    placeholder="50000"
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Riwayat Pengeluaran</CardTitle>
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
              <span className="text-gray-600">Total Pengeluaran: </span>
              <span className="text-red-600">{formatCurrency(totalPengeluaran)}</span>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pengeluaran.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      Tidak ada pengeluaran pada tanggal ini
                    </TableCell>
                  </TableRow>
                ) : (
                  pengeluaran.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.tanggal).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800">
                          {item.kategori}
                        </span>
                      </TableCell>
                      <TableCell>{item.deskripsi || '-'}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(item.jumlah)}</TableCell>
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
