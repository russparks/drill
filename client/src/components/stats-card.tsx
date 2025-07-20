import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  onClick?: () => void;
  isActive?: boolean;
}

export default function StatsCard({ title, value, icon: Icon, iconColor, iconBgColor, onClick, isActive }: StatsCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isActive ? 'ring-2 ring-primary bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="text-center">
          <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center mx-auto mb-2`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <p className="text-xl font-bold text-action-text-primary mb-1">{value}</p>
          {title && <p className="text-xs font-medium text-action-text-secondary leading-tight">{title}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
