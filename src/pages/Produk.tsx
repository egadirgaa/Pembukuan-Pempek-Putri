import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ResponsiveTable } from '../components/ResponsiveTable';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';

interface Produk {
  id: number;
  nama_produk: string;
  harga_jual: number;
  stok: number;
}

export default function Produk() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    nama_produk: '',
    harga_jual: '',
    stok: '0',
  });

  useEffect(() => {
    fetchProduk();
  }, []);

  const fetchProduk = async () => {
    const { data } = await supabase
      .from('produk')
      .select('*')
      .order('nama_produk');
    
    if (data) setProduk(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      nama_produk: formData.nama_produk,
      harga_jual: Number(formData.harga_jual),
      stok: Number(formData.stok),
    };

    if (editMode && editId) {
      const { error } = await supabase
        .from('produk')
        .update(data)
        .eq('id', editId);

      if (error) {
        toast.error('Gagal mengupdate produk: ' + error.message);
      } else {
        toast.success('Produk berhasil diupdate');
      }
    } else {
      const { error } = await supabase
        .from('produk')
        .insert(data);

      if (error) {
        toast.error('Gagal menambahkan produk: ' + error.message);
      } else {
        toast.success('Produk berhasil ditambahkan');
      }
    }

    setOpen(false);
    resetForm();
    fetchProduk();
  };

  const handleEdit = (item: Produk) => {
    setEditMode(true);
    setEditId(item.id);
    setFormData({
      nama_produk: item.nama_produk,
      harga_jual: String(item.harga_jual),
      stok: String(item.stok),
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const { error } = await supabase
      .from('produk')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast.error('Gagal menghapus produk: ' + error.message);
    } else {
      toast.success('Produk berhasil dihapus');
      fetchProduk();
    }

    setDeleteId(null);
  };

  const resetForm = () => {
    setFormData({
      nama_produk: '',
      harga_jual: '',
      stok: '0',
    });
    setEditMode(false);
    setEditId(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      key: 'nama_produk',
      label: 'Nama Produk',
    },
    {
      key: 'harga_jual',
      label: 'Harga Jual',
      render: (value: number) => formatCurrency(value),
    },
    {
      key: 'stok',
      label: 'Stok',
      render: (value: number) => `${value} unit`,
    },
    {
      key: 'actions',
      label: 'Aksi',
      hideOnMobile: true,
      render: (_: any, item: Produk) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(item.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1>Produk</h1>
          <p className="text-muted-foreground">Kelola daftar produk pempek</p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2 bg-orange-600 hover:bg-orange-700 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
              <DialogDescription>
                {editMode ? 'Update informasi produk' : 'Isi form di bawah untuk menambahkan produk baru'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nama_produk">Nama Produk</Label>
                  <Input
                    id="nama_produk"
                    value={formData.nama_produk}
                    onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })}
                    placeholder="Contoh: Pempek Kapal Selam"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="harga_jual">Harga Jual (Rp)</Label>
                  <Input
                    id="harga_jual"
                    type="number"
                    min="0"
                    value={formData.harga_jual}
                    onChange={(e) => setFormData({ ...formData, harga_jual: e.target.value })}
                    placeholder="15000"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stok">Stok</Label>
                  <Input
                    id="stok"
                    type="number"
                    min="0"
                    value={formData.stok}
                    onChange={(e) => setFormData({ ...formData, stok: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700">{editMode ? 'Update' : 'Simpan'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Produk</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveTable
            columns={columns}
            data={produk}
            onRowClick={(item) => {
              // On mobile, clicking row opens edit
              if (window.innerWidth < 768) {
                handleEdit(item);
              }
            }}
          />
        </CardContent>
      </Card>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan.
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
