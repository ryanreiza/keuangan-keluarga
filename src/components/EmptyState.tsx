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
    <Card className={cn("border-dashed border-2 bg-gradient-card shadow-none", className)}>
      <CardContent className="flex flex-col items-center justify-center text-center py-12 px-6">
        <div className="p-4 rounded-2xl bg-gradient-primary-soft mb-4">
          <Icon className="h-8 w-8 text-primary" strokeWidth={1.75} />
        </div>
        <h3 className="text-lg font-semibold font-display text-foreground mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
        {action && (
          <Button onClick={action.onClick} className="bg-gradient-primary shadow-elegant hover:opacity-90">
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
