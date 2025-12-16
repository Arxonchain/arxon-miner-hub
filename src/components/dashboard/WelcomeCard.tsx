interface WelcomeCardProps {
  title: string;
  description: string;
  isActive?: boolean;
}

const WelcomeCard = ({ title, description, isActive = false }: WelcomeCardProps) => {
  return (
    <div className="bg-card/40 border border-accent/40 rounded-2xl p-6 relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div className="max-w-2xl pr-8">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Welcome to <span className="text-foreground font-semibold">ARXON Q1</span>, Marketing Ongoing! On the dashboard you will see your earnings for this Arxon. To view your total number of points, simply navigate to the Rewards tab on the left.
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {/* 3D Ring graphic */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-accent/30 transform rotate-12" />
            <div className="absolute inset-2 rounded-full border-4 border-accent/50 transform -rotate-12" />
            <div className="absolute top-1 right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-background" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;