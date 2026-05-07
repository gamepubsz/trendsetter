import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  iconColor?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  iconColor = "text-red-500",
}: StatCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {trendValue && (
            <p
              className={clsx(
                "text-xs mt-2 font-medium",
                trend === "up" && "text-green-400",
                trend === "down" && "text-red-400",
                trend === "neutral" && "text-gray-400"
              )}
            >
              {trend === "up" && "↑ "}
              {trend === "down" && "↓ "}
              {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className={clsx("p-2 rounded-lg bg-gray-800", iconColor)}>
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
}
