import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Search, Filter, ArrowUpRight, ArrowDownRight, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function Transactions() {
  const [date, setDate] = useState<Date>();

  const transactions = [
    { id: 1, description: "Gaji Bulanan", amount: 8500000, type: "income", date: "2024-12-15", category: "Gaji", account: "BCA" },
    { id: 2, description: "Belanja Groceries", amount: -450000, type: "expense", date: "2024-12-14", category: "Makanan", account: "BCA" },
    { id: 3, description: "Transfer dari Ayah", amount: 2000000, type: "income", date: "2024-12-13", category: "Transfer", account: "Mandiri" },
    { id: 4, description: "Bayar Listrik", amount: -320000, type: "expense", date: "2024-12-12", category: "Tagihan", account: "BCA" },
    { id: 5, description: "Freelance Project", amount: 1500000, type: "income", date: "2024-12-11", category: "Freelance", account: "BCA" },
    { id: 6, description: "Beli Bensin", amount: -150000, type: "expense", date: "2024-12-10", category: "Transport", account: "BCA" },
    { id: 7, description: "Makan di Restoran", amount: -275000, type: "expense", date: "2024-12-09", category: "Makanan", account: "Mandiri" },
    { id: 8, description: "Bayar Internet", amount: -400000, type: "expense", date: "2024-12-08", category: "Tagihan", account: "BCA" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaksi</h1>
          <p className="text-muted-foreground mt-1">Kelola semua transaksi keuangan Anda</p>
        </div>
        <Button className="bg-gradient-primary text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Transaksi
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Transaction Form */}
        <Card className="xl:col-span-1 shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">Form Transaksi</CardTitle>
            <CardDescription>Tambah transaksi baru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input id="description" placeholder="Masukkan deskripsi transaksi" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Jumlah</Label>
              <Input id="amount" type="number" placeholder="0" />
            </div>

            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Pemasukan</SelectItem>
                  <SelectItem value="expense">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gaji">Gaji</SelectItem>
                  <SelectItem value="makanan">Makanan</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="tagihan">Tagihan</SelectItem>
                  <SelectItem value="hiburan">Hiburan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rekening</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rekening" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bca">BCA - 1234567890</SelectItem>
                  <SelectItem value="mandiri">Mandiri - 0987654321</SelectItem>
                  <SelectItem value="bri">BRI - 1122334455</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
              Simpan Transaksi
            </Button>
          </CardContent>
        </Card>

        {/* Transaction List */}
        <Card className="xl:col-span-3 shadow-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Daftar Transaksi</CardTitle>
                <CardDescription>Riwayat semua transaksi</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-10 w-64" placeholder="Cari transaksi..." />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-0">
              {transactions.map((transaction, index) => (
                <div key={transaction.id} className={`flex items-center justify-between p-4 hover:bg-surface/50 transition-colors ${index !== transactions.length - 1 ? 'border-b border-border' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${transaction.type === 'income' ? 'bg-success-bg' : 'bg-danger-bg'}`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="h-4 w-4 text-success" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-danger" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString('id-ID')}
                        </p>
                        <Badge variant="secondary" className="text-xs">{transaction.category}</Badge>
                        <Badge variant="outline" className="text-xs">{transaction.account}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-lg ${transaction.type === 'income' ? 'text-success' : 'text-danger'}`}>
                      {transaction.type === 'income' ? '+' : '-'}Rp {Math.abs(transaction.amount).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}