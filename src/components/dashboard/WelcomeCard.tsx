import arxonLogo from "@/assets/arxon-logo.jpg";

interface WelcomeCardProps {
  title: string;
  description: string;
  isActive?: boolean;
}

const WelcomeCard = ({ title, description, isActive = false }: WelcomeCardProps) => {
  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="max-w-xl">
          <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground">{description}</p>
        </div>
        <div className="relative flex items-center justify-center">
          <img src={arxonLogo} alt="Arxon" className="h-24 w-24 object-contain opacity-30 mix-blend-lighten" />
          <span className={`absolute bottom-0 ${isActive ? "status-connected" : "status-not-active"}`}>
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-foreground" : "bg-destructive"}`} />
            {isActive ? "Active" : "Not Active"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
