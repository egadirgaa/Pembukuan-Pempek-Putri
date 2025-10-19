# Panduan Mobile & Dark Mode - Pempek Putri

## ✅ Fitur yang Telah Diimplementasikan

### 1. Dark Mode Support
- ✅ ThemeProvider dengan context API (`/contexts/ThemeContext.tsx`)
- ✅ Otomatis detect preferensi sistem
- ✅ Menyimpan preferensi ke localStorage
- ✅ Toggle dark mode di halaman Pengaturan
- ✅ Semua komponen UI mendukung dark mode

### 2. Mobile Responsive Layout
- ✅ Sidebar tersembunyi di mobile, diganti dengan hamburger menu
- ✅ Mobile header dengan logo dan menu button
- ✅ Sheet/drawer untuk sidebar di mobile
- ✅ Responsive padding dan spacing
- ✅ Optimasi untuk layar 320px - 768px - 1024px+

### 3. Komponen yang Telah Di-update

#### Layout & Navigation
- **Layout.tsx** - Responsive dengan mobile header
- **Sidebar.tsx** - Support dark mode dan mobile
- **App.tsx** - Wrapped dengan ThemeProvider

#### Halaman Auth
- **Login.tsx** - Responsive cards, support dark mode
- **Register.tsx** - Responsive cards, support dark mode

#### Halaman Utama
- **Dashboard.tsx** - Responsive grid, dark mode colors
- **Produk.tsx** - Menggunakan ResponsiveTable untuk mobile
- **Pengaturan.tsx** - Toggle dark mode, responsive layout

#### Komponen Helper
- **ResponsiveTable.tsx** - Component untuk tabel responsive:
  - Desktop: Tampilan tabel normal
  - Mobile: Card-based view

## 🎨 Cara Menggunakan Dark Mode

### Untuk User
1. Buka menu **Pengaturan**
2. Cari bagian **Tampilan**
3. Toggle switch **Mode Gelap**

### Untuk Developer
```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

## 📱 Responsive Breakpoints

```css
/* Mobile First */
Default: < 640px

/* Tablet */
sm: 640px
md: 768px

/* Desktop */
lg: 1024px
xl: 1280px
```

## 🎯 Best Practices yang Diterapkan

### 1. Mobile-First Design
```tsx
// Default styling untuk mobile
<div className="flex-col sm:flex-row">

// Hide on mobile, show on desktop
<div className="hidden md:block">
```

### 2. Responsive Tables
```tsx
import { ResponsiveTable } from '../components/ResponsiveTable';

<ResponsiveTable
  columns={[
    { key: 'name', label: 'Nama' },
    { key: 'price', label: 'Harga', render: (v) => formatCurrency(v) },
    { key: 'actions', label: 'Aksi', hideOnMobile: true }
  ]}
  data={items}
  onRowClick={handleEdit} // Mobile tap to edit
/>
```

### 3. Dark Mode Colors
Gunakan semantic tokens yang sudah tersedia:
- `bg-background` - Background utama
- `text-foreground` - Text utama
- `text-muted-foreground` - Text secondary
- `bg-card` - Card background
- `border-border` - Border color
- `bg-accent` - Hover states

### 4. Touch-Friendly Buttons
```tsx
// Minimal target size 44x44px
<Button size="icon" className="h-11 w-11 sm:h-10 sm:w-10">
```

## 🔧 Halaman yang Perlu Di-update (Optional)

Berikut halaman yang bisa di-update untuk lebih mobile-friendly:

- [ ] Penjualan.tsx - Gunakan ResponsiveTable
- [ ] Pengeluaran.tsx - Responsive forms
- [ ] StokBahan.tsx - Card view untuk mobile
- [ ] PembelianBahan.tsx - Responsive table
- [ ] Supplier.tsx - Contact cards
- [ ] Piutang.tsx - Status badges mobile-friendly
- [ ] Hutang.tsx - Due date indicators
- [ ] LaporanKeuangan.tsx - Responsive charts

## 📊 Testing Checklist

### Mobile (320px - 767px)
- [ ] Sidebar terbuka dengan hamburger menu
- [ ] Forms mudah diisi dengan keyboard mobile
- [ ] Buttons cukup besar untuk di-tap
- [ ] Tables berubah menjadi cards
- [ ] No horizontal scrolling
- [ ] Text readable tanpa zoom

### Tablet (768px - 1023px)
- [ ] Sidebar visible/collapsible
- [ ] 2-column grids
- [ ] Forms dengan layout optimal

### Desktop (1024px+)
- [ ] Sidebar always visible
- [ ] 3+ column grids
- [ ] Hover states works
- [ ] Shortcuts keyboard

### Dark Mode
- [ ] Semua text readable
- [ ] Contrast ratio minimal 4.5:1
- [ ] Images/icons visible
- [ ] Forms tidak silau

## 🎨 Color Palette

### Light Mode
- Background: `#ffffff`
- Foreground: `#0a0a0a`
- Primary: `#ea580c` (Orange)
- Muted: `#ececf0`

### Dark Mode
- Background: `#0a0a0a`
- Foreground: `#fafafa`
- Primary: `#fb923c` (Orange lighter)
- Muted: `#27272a`

## 🚀 Next Steps

1. **Test di berbagai devices**
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - Android (360px, 412px)
   - iPad (768px, 1024px)

2. **Optimize Performance**
   - Lazy load komponen besar
   - Debounce search/filter
   - Cache Supabase queries

3. **Accessibility**
   - Test dengan screen reader
   - Keyboard navigation
   - Focus indicators
   - ARIA labels

4. **PWA (Optional)**
   - Add manifest.json
   - Service worker
   - Offline support
   - Install prompt

## 💡 Tips

### Debugging Responsive
```tsx
// Add temporary indicator
<div className="fixed top-0 left-0 bg-red-500 text-white p-2 z-50">
  <span className="sm:hidden">XS</span>
  <span className="hidden sm:inline md:hidden">SM</span>
  <span className="hidden md:inline lg:hidden">MD</span>
  <span className="hidden lg:inline">LG</span>
</div>
```

### Dark Mode Testing
```js
// Toggle via console
localStorage.setItem('pempek-theme', 'dark');
location.reload();
```

### Mobile Testing
- Chrome DevTools: F12 → Toggle Device Toolbar
- Firefox: Ctrl+Shift+M
- Safari: Develop → Enter Responsive Design Mode

## 📚 Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [Web.dev Responsive Design](https://web.dev/responsive-web-design-basics/)
- [WCAG Contrast Checker](https://webaim.org/resources/contrastchecker/)
