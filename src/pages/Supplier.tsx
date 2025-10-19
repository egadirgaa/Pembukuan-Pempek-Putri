import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Plus, Edit, Trash2, Phone, MapPin } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

interface Supplier {
  id: number;
  nama: string;
  kontak: string;
  alamat: string;
  bahan_dipasok: string;
}

export default function Supplier() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nama: '',
    kontak: '',
    alamat: '',
    bahan_dipasok: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const { data } = await supabase
      .from('supplier')
      .select('*')
      .order('nama');
    
    if (data) setSuppliers(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editMode && editId) {
      const { error } = await supabase
        .from('supplier')
        .update(formData)
        .eq('id', editId);

      if (error) {
        toast.error('Gagal mengupdate supplier: ' + error.message);
      } else {
        toast.success('Supplier berhasil diupdate');
      }
    } else {
      const { error } = await supabase
        .from('supplier')
        .insert(formData);

      if (error) {
        toast.error('Gagal menambahkan supplier: ' + error.message);
      } else {
        toast.success('Supplier berhasil ditambahkan');
      }
    }

    setOpen(false);
    resetForm();
    fetchSuppliers();
  };

  const handleEdit = (item: Supplier) => {
    setEditMode(true);
    setEditId(item.id);
    setFormData({
      nama: item.nama,
      kontak: item.kontak || '',
      alamat: item.alamat || '',
      bahan_dipasok: item.bahan_dipasok || '',
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('supplier')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Gagal menghapus supplier: ' + error.message);
    } else {
      toast.success('Supplier berhasil dihapus');
      fetchSuppliers();
    }

    setDeleteId(null);
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      kontak: '',
      alamat: '',
      bahan_dipasok: '',
    });
    setEditMode(false);
    setEditId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1>Supplier</h1>
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
              Tambah Supplier
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Supplier' : 'Tambah Supplier Baru'}</DialogTitle>
              <DialogDescription>
                {editMode ? 'Update informasi supplier' : 'Tambahkan supplier bahan baku'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nama">Nama Supplier</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Contoh: Toko Bahan Makanan Jaya"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kontak">Kontak / Telepon</Label>
                  <Input
                    id="kontak"
                    value={formData.kontak}
                    onChange={(e) => setFormData({ ...formData, kontak: e.target.value })}
                    placeholder="08123456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Textarea
                    id="alamat"
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    placeholder="Alamat lengkap supplier"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bahan_dipasok">Bahan yang Dipasok</Label>
                  <Input
                    id="bahan_dipasok"
                    value={formData.bahan_dipasok}
                    onChange={(e) => setFormData({ ...formData, bahan_dipasok: e.target.value })}
                    placeholder="Contoh: Ikan, Tepung, Minyak"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">{editMode ? 'Update' : 'Simpan'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">
                Belum ada supplier. Tambahkan supplier pertama Anda.
              </p>
            </CardContent>
          </Card>
        ) : (
          suppliers.map((supplier) => (
            <Card key={supplier.id}>
              <CardHeader>
                <CardTitle>{supplier.nama}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {supplier.kontak && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-gray-600 mt-0.5" />
                    <span className="text-sm">{supplier.kontak}</span>
                  </div>
                )}
                {supplier.alamat && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-600 mt-0.5" />
                    <span className="text-sm">{supplier.alamat}</span>
                  </div>
                )}
                {supplier.bahan_dipasok && (
                  <div className="pt-2">
                    <p className="text-xs text-gray-600 mb-1">Bahan yang dipasok:</p>
                    <div className="flex flex-wrap gap-1">
                      {supplier.bahan_dipasok.split(',').map((bahan, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                          {bahan.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteId(supplier.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus supplier ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
