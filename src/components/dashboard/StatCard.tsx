interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
}

const StatCard = ({ label, value, suffix }: StatCardProps) => {
  return (
    <div className="stat-card">
      <p className="text-muted-foreground text-sm mb-2">{label}</p>
      <p className="text-3xl font-bold text-foreground">
        {value}
        {suffix && <span className="text-lg font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );
};

export default StatCard;
