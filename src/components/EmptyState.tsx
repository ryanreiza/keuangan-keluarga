import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed border-2 border-border/70 bg-gradient-card shadow-none overflow-hidden relative", className)}>
      {/* Decorative grid */}
      <div className="absolute inset-0 bg-grid-pattern opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)] pointer-events-none" />
      <CardContent className="relative flex flex-col items-center justify-center text-center py-14 px-6">
        <div className="relative mb-5">
          <div className="absolute inset-0 bg-gradient-primary blur-2xl opacity-25 rounded-full" />
          <div className="relative h-16 w-16 rounded-2xl bg-gradient-primary-soft border border-primary/20 flex items-center justify-center shadow-md">
            <Icon className="h-7 w-7 text-primary" strokeWidth={1.75} />
          </div>
        </div>
        <h3 className="text-lg font-semibold font-display text-foreground mb-1.5 tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-gradient-primary shadow-elegant hover:shadow-glow hover:opacity-95 transition-all">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
