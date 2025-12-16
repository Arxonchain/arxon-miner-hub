const EarningStatistics = () => {
  return (
    <div className="bg-card/40 border border-accent/40 rounded-2xl p-6">
      <h3 className="text-base font-semibold text-foreground mb-1">Earning statistics</h3>
      <p className="text-xs text-muted-foreground mb-6">
        Your revenue graph generated based on your GPU hostings
      </p>
      
      {/* Graph placeholder area */}
      <div className="h-40 bg-card/30 rounded-xl border border-border/30" />
    </div>
  );
};

export default EarningStatistics;