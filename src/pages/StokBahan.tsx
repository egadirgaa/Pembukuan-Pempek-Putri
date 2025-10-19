import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface StokBahan {
  id: number;
  nama_bahan: string;
  jumlah: number;
  satuan: string;
  tanggal_update: string;
}

export default function StokBahan() {
  const [stok, setStok] = useState<StokBahan[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nama_bahan: '',
    jumlah: '',
    satuan: 'kg',
  });

  useEffect(() => {
    fetchStok();
  }, []);

  const fetchStok = async () => {
    const { data } = await supabase
      .from('stok_bahan')
      .select('*')
      .order('nama_bahan');
    
    if (data) setStok(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nama_bahan: formData.nama_bahan,
      jumlah: Number(formData.jumlah),
      satuan: formData.satuan,
    };

    if (editMode && editId) {
      const { error } = await supabase
        .from('stok_bahan')
        .update(data)
        .eq('id', editId);

      if (error) {
        toast.error('Gagal mengupdate stok: ' + error.message);
      } else {
        toast.success('Stok berhasil diupdate');
      }
    } else {
      const { error } = await supabase
        .from('stok_bahan')
        .insert(data);

      if (error) {
        toast.error('Gagal menambahkan stok: ' + error.message);
      } else {
        toast.success('Stok berhasil ditambahkan');
      }
    }

    setOpen(false);
    resetForm();
    fetchStok();
  };

  const handleEdit = (item: StokBahan) => {
    setEditMode(true);
    setEditId(item.id);
    setFormData({
      nama_bahan: item.nama_bahan,
      jumlah: String(item.jumlah),
      satuan: item.satuan,
    });
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nama_bahan: '',
      jumlah: '',
      satuan: 'kg',
    });
    setEditMode(false);
    setEditId(null);
  };

  const getStokStatus = (jumlah: number) => {
    if (jumlah === 0) return { label: 'Habis', color: 'bg-red-100 text-red-800' };
    if (jumlah < 10) return { label: 'Menipis', color: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Aman', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1>Stok Bahan</h1>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Tambah Bahan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Stok Bahan' : 'Tambah Bahan Baru'}</DialogTitle>
              <DialogDescription>
                {editMode ? 'Update stok bahan' : 'Tambahkan bahan baku baru ke inventory'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_bahan">Nama Bahan</Label>
                  <Input
                    id="nama_bahan"
                    value={formData.nama_bahan}
                    onChange={(e) => setFormData({ ...formData, nama_bahan: e.target.value })}
                    placeholder="Contoh: Ikan Tenggiri"
                    required
                    disabled={editMode}
                  />
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
                  <Label htmlFor="satuan">Satuan</Label>
                  <select
                    id="satuan"
                    value={formData.satuan}
                    onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    required
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="liter">Liter</option>
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="pack">Pack</option>
                    <option value="gram">Gram</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editMode ? 'Update' : 'Simpan'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {stok.filter(item => item.jumlah < 10).length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Peringatan Stok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-800">
              Ada {stok.filter(item => item.jumlah < 10).length} bahan dengan stok menipis atau habis. Segera lakukan pembelian!
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Stok Bahan Baku</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Bahan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terakhir Update</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stok.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500">
                      Belum ada stok bahan. Tambahkan bahan pertama Anda.
                    </TableCell>
                  </TableRow>
                ) : (
                  stok.map((item) => {
                    const status = getStokStatus(item.jumlah);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>{item.nama_bahan}</TableCell>
                        <TableCell>{item.jumlah}</TableCell>
                        <TableCell>{item.satuan}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${status.color}`}>
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(item.tanggal_update).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
