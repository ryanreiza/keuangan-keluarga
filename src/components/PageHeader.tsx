import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {Icon && (
          <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant">
            <Icon className="h-5 w-5 text-primary-foreground" strokeWidth={2.25} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-eyebrow mb-1">{eyebrow}</p>}
          <h1 className="text-display-2 text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm md:text-base text-muted-foreground mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 md:gap-3 shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}
