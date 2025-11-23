import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileBarChart, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export default function Reports() {
  const [monthsToShow, setMonthsToShow] = useState<number>(6);
  const [viewType, setViewType] = useState<'expense' | 'income'>('expense');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { transactions, categories, loading: dataLoading } = useFinancialData();
  const { budgets, loading: budgetsLoading } = useMonthlyBudgets();

  // Generate array of last N months
  const monthsArray = useMemo(() => {
    const months = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(startOfMonth(new Date()), i);
      months.push({
        date,
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        label: format(date, 'MMM yyyy', { locale: id })
      });
    }
    return months;
  }, [monthsToShow]);

  // Calculate data for charts
  const chartData = useMemo(() => {
    const filteredCategories = categories.filter(cat => cat.type === viewType);
    
    return monthsArray.map(({ date, month, year, label }) => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() + 1 === month && 
               tDate.getFullYear() === year && 
               t.type === viewType;
      });

      let totalActual = 0;
      let totalExpected = 0;

      filteredCategories.forEach(cat => {
        const categoryTransactions = monthTransactions.filter(t => t.category_id === cat.id);
        const actualAmount = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        const budget = budgets.find(
          b => b.category_id === cat.id && b.month === month && b.year === year
        );
        const expectedAmount = budget?.expected_amount || 0;

        totalActual += actualAmount;
        totalExpected += expectedAmount;
      });

      return {
        month: label,
        actual: totalActual,
        expected: totalExpected,
        difference: totalActual - totalExpected
      };
    });
  }, [monthsArray, transactions, categories, budgets, viewType]);

  // Calculate category breakdown for current period
  const categoryData = useMemo(() => {
    const filteredCategories = categories.filter(cat => cat.type === viewType);
    const lastMonth = monthsArray[monthsArray.length - 1];
    
    if (!lastMonth) return [];

    return filteredCategories.map(cat => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() + 1 === lastMonth.month && 
               tDate.getFullYear() === lastMonth.year && 
               t.type === viewType &&
               t.category_id === cat.id;
      });

      const actualAmount = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
      
      const budget = budgets.find(
        b => b.category_id === cat.id && 
        b.month === lastMonth.month && 
        b.year === lastMonth.year
      );
      const expectedAmount = budget?.expected_amount || 0;

      return {
        name: cat.name,
        actual: actualAmount,
        expected: expectedAmount,
        color: cat.color || '#3B82F6'
      };
    }).filter(item => item.actual > 0 || item.expected > 0);
  }, [categories, transactions, budgets, viewType, monthsArray]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const exportToPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    toast({
      title: "Memproses...",
      description: "Sedang membuat file PDF",
    });

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height in mm

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      const fileName = `Laporan_${viewType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Berhasil!",
        description: "Laporan PDF telah diunduh",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Gagal",
        description: "Tidak dapat membuat PDF",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);
    toast({
      title: "Memproses...",
      description: "Sedang membuat file Excel",
    });

    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: Monthly Summary
      const monthlySummary = chartData.map(item => ({
        'Bulan': item.month,
        'Yang Diharapkan': item.expected,
        'Yang Sebenarnya': item.actual,
        'Selisih': item.difference
      }));
      const ws1 = XLSX.utils.json_to_sheet(monthlySummary);
      XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Bulanan');

      // Sheet 2: Category Breakdown
      if (categoryData.length > 0) {
        const categoryBreakdown = categoryData.map(item => ({
          'Kategori': item.name,
          'Yang Diharapkan': item.expected,
          'Yang Sebenarnya': item.actual,
          'Selisih': item.actual - item.expected
        }));
        const ws2 = XLSX.utils.json_to_sheet(categoryBreakdown);
        XLSX.utils.book_append_sheet(wb, ws2, 'Per Kategori');
      }

      // Sheet 3: Summary Statistics
      const summaryStats = [
        {
          'Keterangan': 'Total Yang Diharapkan',
          'Jumlah': chartData.reduce((sum, item) => sum + item.expected, 0)
        },
        {
          'Keterangan': 'Total Yang Sebenarnya',
          'Jumlah': chartData.reduce((sum, item) => sum + item.actual, 0)
        },
        {
          'Keterangan': 'Selisih Total',
          'Jumlah': chartData.reduce((sum, item) => sum + item.difference, 0)
        }
      ];
      const ws3 = XLSX.utils.json_to_sheet(summaryStats);
      XLSX.utils.book_append_sheet(wb, ws3, 'Ringkasan Total');

      // Save file
      const fileName = `Laporan_${viewType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Berhasil!",
        description: "Laporan Excel telah diunduh",
      });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast({
        title: "Gagal",
        description: "Tidak dapat membuat Excel",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (dataLoading || budgetsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  // Check if there's any data to display
  const hasData = chartData.some(item => item.actual > 0 || item.expected > 0);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <FileBarChart className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Laporan Keuangan</h1>
            <p className="text-muted-foreground">Analisis perbandingan budget vs aktual</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={exportToExcel} 
            disabled={isExporting}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </Button>
          <Button 
            onClick={exportToPDF} 
            disabled={isExporting}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Tipe</label>
            <Select value={viewType} onValueChange={(value: 'expense' | 'income') => setViewType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Pengeluaran</SelectItem>
                <SelectItem value="income">Pemasukan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Periode</label>
            <Select value={monthsToShow.toString()} onValueChange={(value) => setMonthsToShow(parseInt(value))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 Bulan</SelectItem>
                <SelectItem value="6">6 Bulan</SelectItem>
                <SelectItem value="12">12 Bulan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* No Data Message */}
      {!hasData && (
        <Card>
          <CardContent className="py-12 text-center">
            <FileBarChart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Tidak Ada Data</h3>
            <p className="text-muted-foreground mb-4">
              Belum ada data {viewType === 'expense' ? 'pengeluaran' : 'pemasukan'} untuk periode {monthsToShow} bulan terakhir.
            </p>
            <p className="text-sm text-muted-foreground">
              Pastikan Anda sudah menambahkan transaksi dan budget untuk kategori {viewType === 'expense' ? 'pengeluaran' : 'pemasukan'}.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {hasData && (
        <div ref={reportRef} className="space-y-6">
          {/* Budget vs Actual Trend */}
          <Card>
        <CardHeader>
          <CardTitle>Tren Budget vs Aktual</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="expected" 
                name="Yang Diharapkan" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="actual" 
                name="Yang Sebenarnya" 
                stroke={viewType === 'expense' ? '#ef4444' : '#22c55e'} 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Comparison Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Bulanan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="expected" 
                name="Yang Diharapkan" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="actual" 
                name="Yang Sebenarnya" 
                fill={viewType === 'expense' ? '#ef4444' : '#22c55e'} 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown for Latest Month */}
      {categoryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Perbandingan per Kategori ({monthsArray[monthsArray.length - 1]?.label})</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={categoryData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  type="number"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                />
                <YAxis 
                  type="category"
                  dataKey="name" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--foreground))' }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="expected" 
                  name="Yang Diharapkan" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 4, 4, 0]}
                />
                <Bar 
                  dataKey="actual" 
                  name="Yang Sebenarnya" 
                  fill={viewType === 'expense' ? '#ef4444' : '#22c55e'} 
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

        {/* Summary Statistics */}
        <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Yang Diharapkan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(chartData.reduce((sum, item) => sum + item.expected, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Yang Sebenarnya</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${viewType === 'expense' ? 'text-red-500' : 'text-green-500'}`}>
              {formatCurrency(chartData.reduce((sum, item) => sum + item.actual, 0))}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selisih Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${
              chartData.reduce((sum, item) => sum + item.difference, 0) > 0 
                ? 'text-red-500' 
                : 'text-green-500'
            }`}>
              {formatCurrency(Math.abs(chartData.reduce((sum, item) => sum + item.difference, 0)))}
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
      )}
    </div>
  );
}
