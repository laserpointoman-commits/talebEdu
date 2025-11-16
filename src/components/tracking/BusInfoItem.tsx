import { ReactNode } from 'react';

interface BusInfoItemProps {
  icon: ReactNode;
  label: string;
  value: string;
}

export default function BusInfoItem({ icon, label, value }: BusInfoItemProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
