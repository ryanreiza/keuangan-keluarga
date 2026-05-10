import { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("Loading chunk") ||
        this.state.error?.message?.includes("Loading CSS chunk");

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="border-dashed border-2 border-destructive/30 bg-gradient-card shadow-none overflow-hidden relative max-w-md w-full">
            <div className="absolute inset-0 bg-grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />
            <CardContent className="relative flex flex-col items-center justify-center text-center py-14 px-6">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
                <div className="relative h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center shadow-md">
                  <AlertTriangle className="h-7 w-7 text-destructive" strokeWidth={1.75} />
                </div>
              </div>
              <h3 className="text-lg font-semibold font-display text-foreground mb-1.5 tracking-tight">
                Gagal Memuat Halaman
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
                {isChunkError
                  ? "Terjadi masalah saat memuat modul halaman. Ini biasanya disebabkan oleh pembaruan aplikasi atau gangguan jaringan sementara."
                  : this.state.error?.message || "Terjadi kesalahan saat memuat halaman."}
              </p>
              <Button
                onClick={this.handleRetry}
                className="bg-gradient-primary shadow-elegant hover:shadow-glow hover:opacity-95 transition-all gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Coba Lagi
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
