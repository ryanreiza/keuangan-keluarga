import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useFinancialData } from '@/hooks/useFinancialData';
import { useMonthlyBudgets } from '@/hooks/useMonthlyBudgets';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { format, subMonths, startOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileBarChart, FileSpreadsheet, FileText, ChevronDown, ChevronUp, ArrowUpDown, Filter, Table as TableIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type SortField = 'category' | 'expected' | 'actual' | 'difference' | 'percentage';
type SortDirection = 'asc' | 'desc';

export default function Reports() {
  const [monthsToShow, setMonthsToShow] = useState<number>(6);
  const [viewType, setViewType] = useState<'expense' | 'income'>('expense');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [compareYear, setCompareYear] = useState<number | null>(null);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('actual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [activeTab, setActiveTab] = useState<'charts' | 'table'>('charts');
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { transactions, categories, loading: dataLoading } = useFinancialData();
  const { budgets, loading: budgetsLoading } = useMonthlyBudgets();

  // Get available years from transactions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    transactions.forEach(t => {
      const year = new Date(t.transaction_date).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // Filter categories by type
  const filteredCategories = useMemo(() => {
    return categories.filter(cat => cat.type === viewType);
  }, [categories, viewType]);

  // Initialize selected categories when type changes
  useMemo(() => {
    if (selectedCategories.length === 0 && filteredCategories.length > 0) {
      setSelectedCategories(filteredCategories.map(c => c.id));
    }
  }, [filteredCategories]);

  // Update selected categories when view type changes
  const handleViewTypeChange = (value: 'expense' | 'income') => {
    setViewType(value);
    const newCategories = categories.filter(cat => cat.type === value);
    setSelectedCategories(newCategories.map(c => c.id));
  };

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

  // Generate comparison year months
  const compareMonthsArray = useMemo(() => {
    if (!compareYear) return [];
    
    const months = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const currentDate = subMonths(startOfMonth(new Date()), i);
      const compareDate = new Date(compareYear, currentDate.getMonth(), 1);
      months.push({
        date: compareDate,
        month: compareDate.getMonth() + 1,
        year: compareYear,
        label: format(compareDate, 'MMM yyyy', { locale: id })
      });
    }
    return months;
  }, [compareYear, monthsToShow]);

  // Calculate data for charts with category filter
  const chartData = useMemo(() => {
    const activeCategories = filteredCategories.filter(cat => selectedCategories.includes(cat.id));
    
    return monthsArray.map(({ date, month, year, label }) => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() + 1 === month && 
               tDate.getFullYear() === year && 
               t.type === viewType &&
               selectedCategories.includes(t.category_id);
      });

      let totalActual = 0;
      let totalExpected = 0;

      activeCategories.forEach(cat => {
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
        monthNum: month,
        year: year,
        actual: totalActual,
        expected: totalExpected,
        difference: totalActual - totalExpected
      };
    });
  }, [monthsArray, transactions, categories, budgets, viewType, selectedCategories, filteredCategories]);

  // Calculate comparison year data
  const compareChartData = useMemo(() => {
    if (!compareYear) return [];
    
    const activeCategories = filteredCategories.filter(cat => selectedCategories.includes(cat.id));
    
    return compareMonthsArray.map(({ date, month, year, label }) => {
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.transaction_date);
        return tDate.getMonth() + 1 === month && 
               tDate.getFullYear() === year && 
               t.type === viewType &&
               selectedCategories.includes(t.category_id);
      });

      let totalActual = 0;
      let totalExpected = 0;

      activeCategories.forEach(cat => {
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
        month: format(date, 'MMM', { locale: id }),
        monthNum: month,
        year: year,
        actual: totalActual,
        expected: totalExpected,
        difference: totalActual - totalExpected
      };
    });
  }, [compareMonthsArray, transactions, categories, budgets, viewType, selectedCategories, filteredCategories, compareYear]);

  // Combined chart data for year comparison
  const yearComparisonChartData = useMemo(() => {
    if (!compareYear) return chartData;

    return chartData.map((item, index) => {
      const compareItem = compareChartData[index];
      return {
        month: format(new Date(2000, item.monthNum - 1, 1), 'MMM', { locale: id }),
        [`actual_${new Date().getFullYear()}`]: item.actual,
        [`expected_${new Date().getFullYear()}`]: item.expected,
        [`actual_${compareYear}`]: compareItem?.actual || 0,
        [`expected_${compareYear}`]: compareItem?.expected || 0,
      };
    });
  }, [chartData, compareChartData, compareYear]);

  // Calculate detailed table data per category
  const detailTableData = useMemo(() => {
    const activeCategories = filteredCategories.filter(cat => selectedCategories.includes(cat.id));
    
    const data = activeCategories.map(cat => {
      let totalActual = 0;
      let totalExpected = 0;

      monthsArray.forEach(({ month, year }) => {
        const monthTransactions = transactions.filter(t => {
          const tDate = new Date(t.transaction_date);
          return tDate.getMonth() + 1 === month && 
                 tDate.getFullYear() === year && 
                 t.type === viewType &&
                 t.category_id === cat.id;
        });

        totalActual += monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        const budget = budgets.find(
          b => b.category_id === cat.id && b.month === month && b.year === year
        );
        totalExpected += budget?.expected_amount || 0;
      });

      const percentage = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
      const difference = totalActual - totalExpected;

      return {
        id: cat.id,
        category: cat.name,
        color: cat.color || '#3B82F6',
        expected: totalExpected,
        actual: totalActual,
        difference,
        percentage
      };
    });

    // Sort data
    return data.sort((a, b) => {
      let aVal: number | string = a[sortField];
      let bVal: number | string = b[sortField];
      
      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      
      return sortDirection === 'asc' ? aVal - (bVal as number) : (bVal as number) - aVal;
    });
  }, [filteredCategories, selectedCategories, monthsArray, transactions, budgets, viewType, sortField, sortDirection]);

  // Monthly detail table data
  const monthlyDetailData = useMemo(() => {
    return monthsArray.map(({ month, year, label }) => {
      const activeCategories = filteredCategories.filter(cat => selectedCategories.includes(cat.id));
      
      let totalActual = 0;
      let totalExpected = 0;

      activeCategories.forEach(cat => {
        const monthTransactions = transactions.filter(t => {
          const tDate = new Date(t.transaction_date);
          return tDate.getMonth() + 1 === month && 
                 tDate.getFullYear() === year && 
                 t.type === viewType &&
                 t.category_id === cat.id;
        });

        totalActual += monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        
        const budget = budgets.find(
          b => b.category_id === cat.id && b.month === month && b.year === year
        );
        totalExpected += budget?.expected_amount || 0;
      });

      const percentage = totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0;
      const difference = totalActual - totalExpected;

      return {
        month: label,
        expected: totalExpected,
        actual: totalActual,
        difference,
        percentage
      };
    });
  }, [monthsArray, filteredCategories, selectedCategories, transactions, budgets, viewType]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      }
      return [...prev, categoryId];
    });
  };

  const selectAllCategories = () => {
    setSelectedCategories(filteredCategories.map(c => c.id));
  };

  const clearAllCategories = () => {
    setSelectedCategories([]);
  };

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

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

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
      const wb = XLSX.utils.book_new();

      // Sheet 1: Monthly Summary
      const monthlySummary = chartData.map(item => ({
        'Bulan': item.month,
        'Yang Diharapkan': item.expected,
        'Yang Sebenarnya': item.actual,
        'Selisih': item.difference,
        'Persentase': item.expected > 0 ? `${Math.round((item.actual / item.expected) * 100)}%` : '0%'
      }));
      const ws1 = XLSX.utils.json_to_sheet(monthlySummary);
      XLSX.utils.book_append_sheet(wb, ws1, 'Ringkasan Bulanan');

      // Sheet 2: Category Breakdown
      if (detailTableData.length > 0) {
        const categoryBreakdown = detailTableData.map(item => ({
          'Kategori': item.category,
          'Yang Diharapkan': item.expected,
          'Yang Sebenarnya': item.actual,
          'Selisih': item.difference,
          'Persentase': `${Math.round(item.percentage)}%`
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

      // Sheet 4: Year Comparison (if enabled)
      if (compareYear && compareChartData.length > 0) {
        const yearComparison = chartData.map((item, index) => {
          const compareItem = compareChartData[index];
          return {
            'Bulan': item.month,
            [`Aktual ${new Date().getFullYear()}`]: item.actual,
            [`Budget ${new Date().getFullYear()}`]: item.expected,
            [`Aktual ${compareYear}`]: compareItem?.actual || 0,
            [`Budget ${compareYear}`]: compareItem?.expected || 0,
          };
        });
        const ws4 = XLSX.utils.json_to_sheet(yearComparison);
        XLSX.utils.book_append_sheet(wb, ws4, 'Perbandingan Tahun');
      }

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

  if (dataLoading.transactions || dataLoading.categories || budgetsLoading) {
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

  const hasData = chartData.some(item => item.actual > 0 || item.expected > 0);
  const currentYear = new Date().getFullYear();

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
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Tipe</label>
              <Select value={viewType} onValueChange={handleViewTypeChange}>
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
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Bandingkan dengan Tahun</label>
              <Select 
                value={compareYear?.toString() || "none"} 
                onValueChange={(value) => setCompareYear(value === "none" ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak ada</SelectItem>
                  {availableYears.filter(y => y !== currentYear).map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Filter */}
          <Collapsible open={isCategoryFilterOpen} onOpenChange={setIsCategoryFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter Kategori ({selectedCategories.length}/{filteredCategories.length} terpilih)
                </span>
                {isCategoryFilterOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="flex gap-2 mb-3">
                <Button variant="outline" size="sm" onClick={selectAllCategories}>
                  Pilih Semua
                </Button>
                <Button variant="outline" size="sm" onClick={clearAllCategories}>
                  Hapus Semua
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredCategories.map(cat => (
                  <div 
                    key={cat.id}
                    className="flex items-center space-x-2 p-2 rounded-lg border border-border hover:bg-accent cursor-pointer"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <Checkbox 
                      checked={selectedCategories.includes(cat.id)}
                      onCheckedChange={() => toggleCategory(cat.id)}
                    />
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: cat.color || '#3B82F6' }}
                    />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
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
          {/* View Toggle */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'charts' | 'table')}>
            <TabsList>
              <TabsTrigger value="charts" className="gap-2">
                <FileBarChart className="h-4 w-4" />
                Grafik
              </TabsTrigger>
              <TabsTrigger value="table" className="gap-2">
                <TableIcon className="h-4 w-4" />
                Tabel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6 mt-6">
              {/* Year Comparison Chart */}
              {compareYear ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Perbandingan Tahun {currentYear} vs {compareYear}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={yearComparisonChartData}>
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
                          dataKey={`actual_${currentYear}`}
                          name={`Aktual ${currentYear}`}
                          fill={viewType === 'expense' ? '#ef4444' : '#22c55e'}
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey={`actual_${compareYear}`}
                          name={`Aktual ${compareYear}`}
                          fill={viewType === 'expense' ? '#fca5a5' : '#86efac'}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              ) : (
                <>
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
                </>
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
            </TabsContent>

            <TabsContent value="table" className="space-y-6 mt-6">
              {/* Category Detail Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detail per Kategori</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:bg-accent"
                            onClick={() => handleSort('category')}
                          >
                            <div className="flex items-center gap-1">
                              Kategori
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-accent"
                            onClick={() => handleSort('expected')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Yang Diharapkan
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-accent"
                            onClick={() => handleSort('actual')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Yang Sebenarnya
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-accent"
                            onClick={() => handleSort('difference')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Selisih
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="text-right cursor-pointer hover:bg-accent"
                            onClick={() => handleSort('percentage')}
                          >
                            <div className="flex items-center justify-end gap-1">
                              Persentase
                              <ArrowUpDown className="h-4 w-4" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailTableData.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="font-medium">{item.category}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.expected)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                            <TableCell className={`text-right font-medium ${
                              item.difference > 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              item.percentage > 100 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {Math.round(item.percentage)}%
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(detailTableData.reduce((sum, item) => sum + item.expected, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(detailTableData.reduce((sum, item) => sum + item.actual, 0))}
                          </TableCell>
                          <TableCell className={`text-right ${
                            detailTableData.reduce((sum, item) => sum + item.difference, 0) > 0 
                              ? 'text-red-500' 
                              : 'text-green-500'
                          }`}>
                            {formatCurrency(detailTableData.reduce((sum, item) => sum + item.difference, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {detailTableData.reduce((sum, item) => sum + item.expected, 0) > 0
                              ? `${Math.round((detailTableData.reduce((sum, item) => sum + item.actual, 0) / 
                                  detailTableData.reduce((sum, item) => sum + item.expected, 0)) * 100)}%`
                              : '0%'
                            }
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Monthly Detail Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Detail per Bulan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bulan</TableHead>
                          <TableHead className="text-right">Yang Diharapkan</TableHead>
                          <TableHead className="text-right">Yang Sebenarnya</TableHead>
                          <TableHead className="text-right">Selisih</TableHead>
                          <TableHead className="text-right">Persentase</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthlyDetailData.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{item.month}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.expected)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.actual)}</TableCell>
                            <TableCell className={`text-right font-medium ${
                              item.difference > 0 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {item.difference > 0 ? '+' : ''}{formatCurrency(item.difference)}
                            </TableCell>
                            <TableCell className={`text-right font-medium ${
                              item.percentage > 100 ? 'text-red-500' : 'text-green-500'
                            }`}>
                              {Math.round(item.percentage)}%
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Total Row */}
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(monthlyDetailData.reduce((sum, item) => sum + item.expected, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(monthlyDetailData.reduce((sum, item) => sum + item.actual, 0))}
                          </TableCell>
                          <TableCell className={`text-right ${
                            monthlyDetailData.reduce((sum, item) => sum + item.difference, 0) > 0 
                              ? 'text-red-500' 
                              : 'text-green-500'
                          }`}>
                            {formatCurrency(monthlyDetailData.reduce((sum, item) => sum + item.difference, 0))}
                          </TableCell>
                          <TableCell className="text-right">
                            {monthlyDetailData.reduce((sum, item) => sum + item.expected, 0) > 0
                              ? `${Math.round((monthlyDetailData.reduce((sum, item) => sum + item.actual, 0) / 
                                  monthlyDetailData.reduce((sum, item) => sum + item.expected, 0)) * 100)}%`
                              : '0%'
                            }
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
