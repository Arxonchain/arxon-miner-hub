import { ReactNode, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AnimatedBackground from "./AnimatedBackground";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const handleConnectWallet = () => {
    setIsWalletConnected(!isWalletConnected);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      <Header onConnectWallet={handleConnectWallet} isWalletConnected={isWalletConnected} />
      <div className="flex relative z-10">
        <Sidebar />
        <main className="flex-1 p-8 relative overflow-hidden">
          {/* Background Glow Effects */}
          <div className="glow-orb glow-orb-blue w-96 h-96 -top-20 right-1/4 animate-pulse-glow" />
          <div className="glow-orb glow-orb-white w-64 h-64 top-1/3 right-10 animate-pulse-glow" style={{ animationDelay: "1s" }} />
          <div className="glow-orb glow-orb-blue w-80 h-80 bottom-20 left-1/4 animate-pulse-glow" style={{ animationDelay: "2s" }} />
          
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
