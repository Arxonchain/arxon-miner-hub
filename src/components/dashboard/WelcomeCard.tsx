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
        <div className="flex items-center gap-4">
          <img src={arxonLogo} alt="Arxon" className="h-16 w-16 object-contain opacity-50" />
          <span className={isActive ? "status-connected" : "status-not-active"}>
            <span className={`w-2 h-2 rounded-full ${isActive ? "bg-foreground" : "bg-destructive"}`} />
            {isActive ? "Active" : "Not Active"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
