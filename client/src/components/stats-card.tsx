import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
}

export default function StatsCard({ title, value, icon: Icon, iconColor, iconBgColor }: StatsCardProps) {
  return (
    <Card className="material-shadow">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-6 h-6 ${iconBgColor} rounded-full flex items-center justify-center`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
          </div>
          <div className="ml-3">
            <p className="text-xs font-medium text-action-text-secondary">{title}</p>
            <p className="text-lg font-bold text-action-text-primary">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
