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
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-action-text-secondary">{title}</p>
            <p className="text-2xl font-bold text-action-text-primary">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
