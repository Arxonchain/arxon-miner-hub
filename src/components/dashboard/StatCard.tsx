interface StatCardProps {
  label: string;
  value: string;
  suffix?: string;
}

const StatCard = ({ label, value, suffix }: StatCardProps) => {
  return (
    <div className="bg-card/40 border border-accent/40 rounded-2xl p-5">
      <p className="text-muted-foreground text-xs mb-3">{label}</p>
      <p className="text-2xl font-semibold text-foreground">
        {value}
        {suffix && <span className="text-lg font-normal text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
};

export default StatCard;