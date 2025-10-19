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

interface PembelianBahan {
  id: number;
  tanggal: string;
  supplier_id: number;
  nama_bahan: string;
  jumlah: number;
  harga_satuan: number;
  total: number;
  supplier?: { nama: string };
}

interface Supplier {
  id: number;
  nama: string;
}

interface StokBahan {
  id: number;
  nama_bahan: string;
}

export default function PembelianBahan() {
  const [pembelian, setPembelian] = useState<PembelianBahan[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stokBahan, setStokBahan] = useState<StokBahan[]>([]);
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [formData, setFormData] = useState({
    supplier_id: '',
    nama_bahan: '',
    jumlah: '',
    harga_satuan: '',
  });

  useEffect(() => {
    fetchSuppliers();
    fetchStokBahan();
    fetchPembelian();
  }, [filterDate]);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('supplier')
      .select('id, nama')
      .order('nama');
    
    if (data) setSuppliers(data);
  };

  const fetchStokBahan = async () => {
    const { data } = await supabase
      .from('stok_bahan')
      .select('id, nama_bahan')
      .order('nama_bahan');
    
    if (data) setStokBahan(data);
  };

  const fetchPembelian = async () => {
    const { data } = await supabase
      .from('pembelian_bahan')
      .select(`
        *,
        supplier:supplier_id (nama)
      `)
      .gte('tanggal', filterDate)
      .lt('tanggal', new Date(new Date(filterDate).getTime() + 86400000).toISOString())
      .order('tanggal', { ascending: false });
    
    if (data) setPembelian(data as PembelianBahan[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Insert pembelian bahan
    const { error: pembelianError } = await supabase
      .from('pembelian_bahan')
      .insert({
        supplier_id: Number(formData.supplier_id),
        nama_bahan: formData.nama_bahan,
        jumlah: Number(formData.jumlah),
        harga_satuan: Number(formData.harga_satuan),
      });

    if (pembelianError) {
      toast.error('Gagal menambahkan pembelian: ' + pembelianError.message);
      return;
    }

    // Update stok bahan
    const { data: existingStok } = await supabase
      .from('stok_bahan')
      .select('*')
      .eq('nama_bahan', formData.nama_bahan)
      .single();

    if (existingStok) {
      await supabase
        .from('stok_bahan')
        .update({ 
          jumlah: existingStok.jumlah + Number(formData.jumlah),
          tanggal_update: new Date().toISOString()
        })
        .eq('id', existingStok.id);
    }

    // Catat sebagai pengeluaran
    await supabase
      .from('pengeluaran')
      .insert({
        kategori: 'Bahan Baku',
        deskripsi: `Pembelian ${formData.nama_bahan}`,
        jumlah: Number(formData.jumlah) * Number(formData.harga_satuan),
      });

    toast.success('Pembelian bahan berhasil ditambahkan');
    setOpen(false);
    setFormData({
      supplier_id: '',
      nama_bahan: '',
      jumlah: '',
      harga_satuan: '',
    });
    fetchPembelian();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalPembelian = pembelian.reduce((sum, item) => sum + item.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1>Pembelian Bahan</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Pembelian
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Pembelian Bahan</DialogTitle>
              <DialogDescription>
                Catat pembelian bahan baku dari supplier
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={String(supplier.id)}>
                          {supplier.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nama_bahan">Nama Bahan</Label>
                  <Select
                    value={formData.nama_bahan}
                    onValueChange={(value) => setFormData({ ...formData, nama_bahan: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih bahan" />
                    </SelectTrigger>
                    <SelectContent>
                      {stokBahan.map((bahan) => (
                        <SelectItem key={bahan.id} value={bahan.nama_bahan}>
                          {bahan.nama_bahan}
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
                    min="0"
                    step="0.01"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: e.target.value })}
                    placeholder="10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_satuan">Harga Satuan (Rp)</Label>
                  <Input
                    id="harga_satuan"
                    type="number"
                    min="0"
                    value={formData.harga_satuan}
                    onChange={(e) => setFormData({ ...formData, harga_satuan: e.target.value })}
                    placeholder="50000"
                    required
                  />
                </div>

                {formData.jumlah && formData.harga_satuan && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="text-orange-600">
                        {formatCurrency(Number(formData.jumlah) * Number(formData.harga_satuan))}
                      </span>
                    </div>
                  </div>
                )}
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
            <CardTitle>Riwayat Pembelian Bahan</CardTitle>
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
              <span className="text-gray-600">Total Pembelian: </span>
              <span className="text-red-600">{formatCurrency(totalPembelian)}</span>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pembelian.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Tidak ada pembelian pada tanggal ini
                    </TableCell>
                  </TableRow>
                ) : (
                  pembelian.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {new Date(item.tanggal).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>{item.supplier?.nama || '-'}</TableCell>
                      <TableCell>{item.nama_bahan}</TableCell>
                      <TableCell>{item.jumlah}</TableCell>
                      <TableCell>{formatCurrency(item.harga_satuan)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(item.total)}</TableCell>
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
