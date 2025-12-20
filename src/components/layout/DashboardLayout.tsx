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
        <main className="flex-1 p-4 md:p-8 relative overflow-hidden">
          {/* Background Glow Effects - smaller on mobile */}
          <div className="glow-orb glow-orb-blue w-48 md:w-96 h-48 md:h-96 -top-10 md:-top-20 right-1/4 animate-pulse-glow" />
          <div className="glow-orb glow-orb-white w-32 md:w-64 h-32 md:h-64 top-1/3 right-5 md:right-10 animate-pulse-glow" style={{ animationDelay: "1s" }} />
          <div className="glow-orb glow-orb-blue w-40 md:w-80 h-40 md:h-80 bottom-10 md:bottom-20 left-1/4 animate-pulse-glow" style={{ animationDelay: "2s" }} />
          
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
