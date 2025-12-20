interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
}

const StatCard = ({ label, value, suffix }: StatCardProps) => {
  return (
    <div className="stat-card p-4 md:p-6">
      <p className="text-muted-foreground text-xs md:text-sm mb-1 md:mb-2">{label}</p>
      <p className="text-2xl md:text-3xl font-bold text-foreground">
        {value}
        {suffix && <span className="text-sm md:text-lg font-normal text-muted-foreground ml-1">{suffix}</span>}
      </p>
    </div>
  );
};

export default StatCard;
