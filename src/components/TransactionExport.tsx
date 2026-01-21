import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  type: string;
  transaction_date: string;
  categories?: { name: string };
  accounts?: { name: string };
}

interface TransactionExportProps {
  transactions: Transaction[];
  selectedMonth: string;
}

export function TransactionExport({ transactions, selectedMonth }: TransactionExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "income":
        return "Pemasukan";
      case "expense":
        return "Pengeluaran";
      case "transfer":
        return "Transfer";
      case "debt_payment":
        return "Bayar Utang";
      default:
        return type;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getMonthLabel = () => {
    const [year, month] = selectedMonth.split("-");
    return format(new Date(parseInt(year), parseInt(month) - 1), "MMMM yyyy", { locale: id });
  };

  const exportToExcel = () => {
    if (transactions.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada transaksi untuk di-export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: "Memproses...",
      description: "Sedang membuat file Excel",
    });

    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Transaction List
      const transactionData = transactions.map((t, index) => ({
        "No": index + 1,
        "Tanggal": format(new Date(t.transaction_date), "dd MMMM yyyy", { locale: id }),
        "Deskripsi": t.description || "-",
        "Tipe": getTypeLabel(t.type),
        "Kategori": t.categories?.name || "-",
        "Rekening": t.accounts?.name || "-",
        "Jumlah": t.amount,
      }));
      const ws1 = XLSX.utils.json_to_sheet(transactionData);
      
      // Set column widths
      ws1["!cols"] = [
        { wch: 5 },   // No
        { wch: 18 },  // Tanggal
        { wch: 30 },  // Deskripsi
        { wch: 15 },  // Tipe
        { wch: 20 },  // Kategori
        { wch: 20 },  // Rekening
        { wch: 18 },  // Jumlah
      ];
      
      XLSX.utils.book_append_sheet(wb, ws1, "Daftar Transaksi");

      // Sheet 2: Summary
      const incomeTotal = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenseTotal = transactions
        .filter((t) => t.type === "expense" || t.type === "debt_payment")
        .reduce((sum, t) => sum + t.amount, 0);
      const transferTotal = transactions
        .filter((t) => t.type === "transfer")
        .reduce((sum, t) => sum + t.amount, 0);

      const summaryData = [
        { "Keterangan": "Total Pemasukan", "Jumlah": incomeTotal },
        { "Keterangan": "Total Pengeluaran", "Jumlah": expenseTotal },
        { "Keterangan": "Total Transfer", "Jumlah": transferTotal },
        { "Keterangan": "Saldo Bersih", "Jumlah": incomeTotal - expenseTotal },
        { "Keterangan": "Jumlah Transaksi", "Jumlah": transactions.length },
      ];
      const ws2 = XLSX.utils.json_to_sheet(summaryData);
      ws2["!cols"] = [{ wch: 20 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws2, "Ringkasan");

      // Sheet 3: By Category
      const categoryMap = new Map<string, { income: number; expense: number; count: number }>();
      transactions.forEach((t) => {
        const catName = t.categories?.name || "Lainnya";
        const current = categoryMap.get(catName) || { income: 0, expense: 0, count: 0 };
        if (t.type === "income") {
          current.income += t.amount;
        } else if (t.type === "expense" || t.type === "debt_payment") {
          current.expense += t.amount;
        }
        current.count++;
        categoryMap.set(catName, current);
      });

      const categoryData = Array.from(categoryMap.entries()).map(([name, data]) => ({
        "Kategori": name,
        "Pemasukan": data.income,
        "Pengeluaran": data.expense,
        "Jumlah Transaksi": data.count,
      }));
      const ws3 = XLSX.utils.json_to_sheet(categoryData);
      ws3["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, ws3, "Per Kategori");

      const fileName = `Transaksi_${getMonthLabel().replace(" ", "_")}_${format(new Date(), "yyyyMMdd")}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Berhasil!",
        description: "File Excel telah diunduh",
      });
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast({
        title: "Gagal",
        description: "Tidak dapat membuat file Excel",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    if (transactions.length === 0) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada transaksi untuk di-export",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    toast({
      title: "Memproses...",
      description: "Sedang membuat file PDF",
    });

    try {
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 15;
      let yPos = 20;

      // Title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Laporan Transaksi`, margin, yPos);
      yPos += 8;

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Periode: ${getMonthLabel()}`, margin, yPos);
      yPos += 5;
      pdf.text(`Tanggal Export: ${format(new Date(), "dd MMMM yyyy", { locale: id })}`, margin, yPos);
      yPos += 12;

      // Summary Section
      const incomeTotal = transactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenseTotal = transactions
        .filter((t) => t.type === "expense" || t.type === "debt_payment")
        .reduce((sum, t) => sum + t.amount, 0);

      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin, yPos, pageWidth - margin * 2, 25, "F");
      yPos += 7;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Ringkasan:", margin + 3, yPos);
      yPos += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(34, 197, 94); // Green
      pdf.text(`Pemasukan: ${formatCurrency(incomeTotal)}`, margin + 3, yPos);
      
      pdf.setTextColor(239, 68, 68); // Red
      pdf.text(`Pengeluaran: ${formatCurrency(expenseTotal)}`, margin + 60, yPos);
      
      pdf.setTextColor(0, 0, 0); // Black
      pdf.text(`Saldo: ${formatCurrency(incomeTotal - expenseTotal)}`, margin + 120, yPos);
      yPos += 15;

      // Table Header
      const colWidths = [12, 25, 50, 30, 35, 30];
      const headers = ["No", "Tanggal", "Deskripsi", "Tipe", "Kategori", "Jumlah"];

      pdf.setFillColor(59, 130, 246); // Primary blue
      pdf.rect(margin, yPos, pageWidth - margin * 2, 8, "F");
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");

      let xPos = margin + 2;
      headers.forEach((header, i) => {
        pdf.text(header, xPos, yPos + 5.5);
        xPos += colWidths[i];
      });
      yPos += 10;

      // Table Rows
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8);

      transactions.forEach((t, index) => {
        // Check if need new page
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
          
          // Repeat header on new page
          pdf.setFillColor(59, 130, 246);
          pdf.rect(margin, yPos, pageWidth - margin * 2, 8, "F");
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(9);
          pdf.setFont("helvetica", "bold");
          
          xPos = margin + 2;
          headers.forEach((header, i) => {
            pdf.text(header, xPos, yPos + 5.5);
            xPos += colWidths[i];
          });
          yPos += 10;
          
          pdf.setTextColor(0, 0, 0);
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(8);
        }

        // Alternate row background
        if (index % 2 === 0) {
          pdf.setFillColor(249, 250, 251);
          pdf.rect(margin, yPos - 1, pageWidth - margin * 2, 7, "F");
        }

        xPos = margin + 2;
        const rowData = [
          (index + 1).toString(),
          format(new Date(t.transaction_date), "dd/MM/yyyy"),
          (t.description || "-").substring(0, 25),
          getTypeLabel(t.type),
          (t.categories?.name || "-").substring(0, 15),
          formatCurrency(t.amount).replace("Rp", "").trim(),
        ];

        rowData.forEach((cell, i) => {
          // Set color based on type for amount column
          if (i === 5) {
            if (t.type === "income") {
              pdf.setTextColor(34, 197, 94);
            } else if (t.type === "expense" || t.type === "debt_payment") {
              pdf.setTextColor(239, 68, 68);
            } else {
              pdf.setTextColor(59, 130, 246);
            }
          }
          pdf.text(cell, xPos, yPos + 4);
          if (i === 5) {
            pdf.setTextColor(0, 0, 0);
          }
          xPos += colWidths[i];
        });

        yPos += 7;
      });

      // Footer
      yPos += 10;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Total ${transactions.length} transaksi`, margin, yPos);

      const fileName = `Transaksi_${getMonthLabel().replace(" ", "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Berhasil!",
        description: "File PDF telah diunduh",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Gagal",
        description: "Tidak dapat membuat file PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export ke Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2" />
          Export ke PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
