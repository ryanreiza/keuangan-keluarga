import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, Eye, EyeOff, ShieldCheck, TrendingUp, PieChart, Loader2 } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, signIn, signUp, loading } = useAuth();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) navigate('/');
  }, [user, loading, navigate]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (password: string) => password.length >= 6;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(loginForm.email)) {
      toast({ title: 'Email tidak valid', description: 'Silakan masukkan email yang benar', variant: 'destructive' });
      return;
    }
    if (!validatePassword(loginForm.password)) {
      toast({ title: 'Password terlalu pendek', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    if (error) {
      toast({
        title: 'Login gagal',
        description: error.message.includes('Invalid login credentials') ? 'Email atau password salah' : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Login berhasil', description: 'Selamat datang kembali!' });
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupForm.fullName.trim()) {
      toast({ title: 'Nama lengkap diperlukan', description: 'Silakan masukkan nama lengkap Anda', variant: 'destructive' });
      return;
    }
    if (!validateEmail(signupForm.email)) {
      toast({ title: 'Email tidak valid', description: 'Silakan masukkan email yang benar', variant: 'destructive' });
      return;
    }
    if (!validatePassword(signupForm.password)) {
      toast({ title: 'Password terlalu pendek', description: 'Password minimal 6 karakter', variant: 'destructive' });
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      toast({ title: 'Password tidak cocok', description: 'Konfirmasi password harus sama', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await signUp(signupForm.email, signupForm.password, signupForm.fullName);
    if (error) {
      toast({
        title: 'Pendaftaran gagal',
        description: error.message.includes('User already registered') ? 'Email sudah terdaftar' : error.message,
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Pendaftaran berhasil', description: 'Akun Anda telah dibuat, silakan login' });
      setSignupForm({ fullName: '', email: '', password: '', confirmPassword: '' });
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const benefits = [
    { icon: TrendingUp, title: 'Pantau arus kas real-time', desc: 'Lihat pemasukan & pengeluaran langsung saat dicatat.' },
    { icon: PieChart, title: 'Analisis kategori otomatis', desc: 'Pahami ke mana uang Anda pergi setiap bulan.' },
    { icon: ShieldCheck, title: 'Data aman & terenkripsi', desc: 'Disimpan di cloud dengan standar keamanan modern.' },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="p-2.5 bg-gradient-primary rounded-xl shadow-elegant">
              <Wallet className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-foreground">Keuangan Keluarga</h1>
              <p className="text-xs text-muted-foreground">Kelola finansial dengan cerdas</p>
            </div>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-bold font-display text-foreground tracking-tight">Selamat datang kembali</h2>
            <p className="text-muted-foreground mt-2">Masuk untuk melanjutkan mengelola keuangan Anda.</p>
          </div>

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-muted/60">
              <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Login</TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">Daftar</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-5 mt-8">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="nama@email.com"
                    className="h-11"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      className="h-11 pr-11"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-primary hover:opacity-90 shadow-elegant transition-all hover:shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Memproses...</> : 'Masuk ke Dashboard'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-5 mt-8">
              <form onSubmit={handleSignup} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nama Lengkap</Label>
                  <Input
                    id="signup-name"
                    placeholder="Masukkan nama lengkap"
                    className="h-11"
                    value={signupForm.fullName}
                    onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="nama@email.com"
                    className="h-11"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 6 karakter"
                      className="h-11 pr-11"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-9 px-2 hover:bg-transparent text-muted-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Konfirmasi Password</Label>
                  <Input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ulangi password"
                    className="h-11"
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-primary hover:opacity-90 shadow-elegant transition-all hover:shadow-glow"
                  disabled={isLoading}
                >
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Memproses...</> : 'Buat Akun Baru'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-muted-foreground mt-8">
            Dengan masuk, Anda menyetujui ketentuan penggunaan & kebijakan privasi kami.
          </p>
        </div>
      </div>

      {/* Right: Brand panel (desktop only) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-sidebar">
        <div className="absolute inset-0 bg-mesh opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent-brand/20" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full text-sidebar-foreground">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-primary rounded-xl shadow-glow">
              <Wallet className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">Keuangan Keluarga</h1>
              <p className="text-xs text-sidebar-foreground/60">Personal Finance Suite</p>
            </div>
          </div>

          <div className="space-y-8 max-w-lg">
            <div>
              <h2 className="text-4xl xl:text-5xl font-bold font-display tracking-tight leading-tight">
                Kelola keuangan keluarga<br />
                <span className="text-gradient-primary">lebih cerdas.</span>
              </h2>
              <p className="text-lg text-sidebar-foreground/70 mt-4 leading-relaxed">
                Catat, lacak, dan analisis pemasukan & pengeluaran rumah tangga Anda dalam satu dashboard yang elegan.
              </p>
            </div>

            <div className="space-y-4">
              {benefits.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 items-start glass rounded-xl p-4 border border-sidebar-border/50">
                  <div className="p-2 bg-gradient-primary rounded-lg shrink-0">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sidebar-foreground">{title}</h3>
                    <p className="text-sm text-sidebar-foreground/70 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-sidebar-foreground/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success-light" />
              <span>Data terenkripsi</span>
            </div>
            <div className="h-4 w-px bg-sidebar-border" />
            <span>© {new Date().getFullYear()} Keuangan Keluarga</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
