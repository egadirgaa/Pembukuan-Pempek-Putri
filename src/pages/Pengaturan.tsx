import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { User, Database, Moon, Sun, Download, Upload } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export default function Pengaturan() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      // Ambil semua data dari tabel
      const tables = [
        'produk',
        'transaksi_penjualan',
        'pengeluaran',
        'supplier',
        'pembelian_bahan',
        'hutang',
        'piutang',
        'stok_bahan',
      ];

      const backupData: any = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {},
      };

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (!error && data) {
          backupData.data[table] = data;
        }
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup_pempek_putri_${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast.success('Backup berhasil diunduh');
    } catch (error) {
      toast.error('Gagal membuat backup');
    }
    setLoading(false);
  };

  const handleRestore = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      setLoading(true);
      try {
        const text = await file.text();
        const backupData = JSON.parse(text);

        if (!backupData.data) {
          throw new Error('Format backup tidak valid');
        }

        // Konfirmasi terlebih dahulu
        if (!confirm('PERHATIAN: Restore akan menghapus semua data saat ini dan menggantinya dengan data backup. Lanjutkan?')) {
          setLoading(false);
          return;
        }

        // Restore data untuk setiap tabel
        for (const [table, data] of Object.entries(backupData.data)) {
          // Insert data baru
          if (Array.isArray(data) && data.length > 0) {
            const { error } = await supabase.from(table).insert(data as any);
            if (error) {
              console.error(`Error restoring ${table}:`, error);
            }
          }
        }

        toast.success('Data berhasil direstore');
      } catch (error) {
        toast.error('Gagal restore data: ' + (error as Error).message);
      }
      setLoading(false);
    };
    input.click();
  };

  const handleToggleDarkMode = () => {
    toggleTheme();
    toast.success(theme === 'light' ? 'Mode gelap diaktifkan' : 'Mode terang diaktifkan');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1>Pengaturan</h1>
        <p className="text-muted-foreground">Kelola pengaturan dan preferensi aplikasi</p>
      </div>

      {/* Informasi Akun */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informasi Akun
          </CardTitle>
          <CardDescription>Detail akun pengguna</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="mt-1">{user?.email || '-'}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Terdaftar sejak</Label>
              <p className="mt-1">{user?.created_at ? new Date(user.created_at).toLocaleDateString('id-ID') : '-'}</p>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground">User ID</Label>
            <p className="mt-1 text-sm break-all">{user?.id || '-'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Tampilan */}
      <Card>
        <CardHeader>
          <CardTitle>Tampilan</CardTitle>
          <CardDescription>Sesuaikan tampilan aplikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              <div>
                <Label>Mode Gelap</Label>
                <p className="text-sm text-muted-foreground">Aktifkan tema gelap</p>
              </div>
            </div>
            <Switch checked={theme === 'dark'} onCheckedChange={handleToggleDarkMode} />
          </div>
        </CardContent>
      </Card>

      {/* Manajemen Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manajemen Data
          </CardTitle>
          <CardDescription>Backup dan restore data aplikasi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <p>Backup Data</p>
              <p className="text-sm text-muted-foreground">Unduh semua data dalam format JSON</p>
            </div>
            <Button onClick={handleBackup} disabled={loading} variant="outline" className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Backup
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t">
            <div className="flex-1">
              <p>Restore Data</p>
              <p className="text-sm text-muted-foreground">Pulihkan data dari file backup</p>
            </div>
            <Button onClick={handleRestore} disabled={loading} variant="outline" className="gap-2 w-full sm:w-auto">
              <Upload className="h-4 w-4" />
              Restore
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tentang Aplikasi */}
      <Card>
        <CardHeader>
          <CardTitle>Tentang Aplikasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Nama Aplikasi</Label>
            <p>Pempek Putri</p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Versi</Label>
            <p>1.0.0</p>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground">Dibuat dengan</Label>
            <p>React + Supabase</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
