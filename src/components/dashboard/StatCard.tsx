interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
}

const StatCard = ({ label, value, suffix }: StatCardProps) => {
  return (
    <div className="stat-card p-3 sm:p-4 md:p-5 lg:p-6">
      <p className="text-muted-foreground text-[10px] sm:text-xs lg:text-sm mb-0.5 sm:mb-1 lg:mb-2">{label}</p>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
        {value}
        {suffix && <span className="text-xs sm:text-sm lg:text-lg font-normal text-muted-foreground ml-0.5 sm:ml-1">{suffix}</span>}
      </p>
    </div>
  );
};

export default StatCard;
