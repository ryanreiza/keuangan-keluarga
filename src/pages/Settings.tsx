import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { Settings as SettingsIcon, User, Bell, Shield, Palette } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/StaggerItem";

export default function Settings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">Kelola preferensi dan konfigurasi akun Anda</p>
      </div>

      <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings */}
        <StaggerItem>
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profil
              </CardTitle>
              <CardDescription>Informasi akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>Nama Lengkap</Label>
                <Input placeholder="Masukkan nama lengkap" defaultValue={user?.user_metadata?.full_name || ''} />
              </div>
              <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90" size="sm">
                Simpan Perubahan
              </Button>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Notification Settings */}
        <StaggerItem>
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifikasi
              </CardTitle>
              <CardDescription>Atur preferensi notifikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Peringatan Anggaran</p>
                  <p className="text-xs text-muted-foreground">Notifikasi saat melebihi anggaran</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Pengingat Utang</p>
                  <p className="text-xs text-muted-foreground">Ingatkan pembayaran utang</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Laporan Mingguan</p>
                  <p className="text-xs text-muted-foreground">Ringkasan keuangan mingguan</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Security Settings */}
        <StaggerItem>
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Keamanan
              </CardTitle>
              <CardDescription>Pengaturan keamanan akun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Password Baru</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <Button variant="outline" size="sm">Ubah Password</Button>
            </CardContent>
          </Card>
        </StaggerItem>

        {/* Appearance */}
        <StaggerItem>
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Tampilan
              </CardTitle>
              <CardDescription>Sesuaikan tampilan aplikasi</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Mode Gelap</p>
                  <p className="text-xs text-muted-foreground">Aktifkan tema gelap</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Animasi</p>
                  <p className="text-xs text-muted-foreground">Efek animasi transisi halaman</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
