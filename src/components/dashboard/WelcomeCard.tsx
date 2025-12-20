import arxonLogo from "@/assets/arxon-logo.jpg";

interface WelcomeCardProps {
  title: string;
  description: string;
  isActive?: boolean;
}

const WelcomeCard = ({ title, description, isActive = false }: WelcomeCardProps) => {
  return (
    <div className="glass-card p-4 md:p-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-sm md:text-base text-muted-foreground">{description}</p>
        </div>
        <div className="relative flex items-center justify-center self-end sm:self-start">
          <img src={arxonLogo} alt="Arxon" className="h-16 w-16 md:h-24 md:w-24 object-contain opacity-30 mix-blend-lighten" />
          <span className={`absolute -bottom-2 whitespace-nowrap ${isActive ? "status-connected" : "status-not-active"} text-xs md:text-sm px-3 py-1 md:px-4 md:py-1.5`}>
            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isActive ? "bg-foreground" : "bg-destructive"}`} />
            {isActive ? "Active" : "Not Active"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
