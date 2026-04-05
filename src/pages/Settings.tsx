import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Bell, Shield, Palette, Loader2 } from "lucide-react";
import { StaggerContainer, StaggerItem } from "@/components/StaggerItem";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Profile
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  // Appearance
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [animations, setAnimations] = useState(() => localStorage.getItem('animations') !== 'false');

  // Notifications (localStorage-based)
  const [budgetAlert, setBudgetAlert] = useState(() => localStorage.getItem('notif_budget') !== 'false');
  const [debtReminder, setDebtReminder] = useState(() => localStorage.getItem('notif_debt') !== 'false');
  const [weeklyReport, setWeeklyReport] = useState(() => localStorage.getItem('notif_weekly') === 'true');

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast({ title: "Error", description: "Nama tidak boleh kosong", variant: "destructive" });
      return;
    }
    setSavingProfile(true);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName.trim() }
    });
    setSavingProfile(false);
    if (error) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Berhasil", description: "Profil berhasil diperbarui" });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Password tidak cocok", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: "Berhasil", description: "Password berhasil diubah" });
    }
  };

  const handleNotifToggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
    toast({ title: "Preferensi Disimpan", description: "Pengaturan notifikasi diperbarui" });
  };

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
                <Input
                  placeholder="Masukkan nama lengkap"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <Button
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
                size="sm"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
                <Switch checked={budgetAlert} onCheckedChange={(v) => handleNotifToggle('notif_budget', v, setBudgetAlert)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Pengingat Utang</p>
                  <p className="text-xs text-muted-foreground">Ingatkan pembayaran utang</p>
                </div>
                <Switch checked={debtReminder} onCheckedChange={(v) => handleNotifToggle('notif_debt', v, setDebtReminder)} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Laporan Mingguan</p>
                  <p className="text-xs text-muted-foreground">Ringkasan keuangan mingguan</p>
                </div>
                <Switch checked={weeklyReport} onCheckedChange={(v) => handleNotifToggle('notif_weekly', v, setWeeklyReport)} />
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
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Konfirmasi Password</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword}
              >
                {savingPassword && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Ubah Password
              </Button>
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
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Animasi</p>
                  <p className="text-xs text-muted-foreground">Efek animasi transisi halaman</p>
                </div>
                <Switch
                  checked={animations}
                  onCheckedChange={(v) => {
                    setAnimations(v);
                    localStorage.setItem('animations', String(v));
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
