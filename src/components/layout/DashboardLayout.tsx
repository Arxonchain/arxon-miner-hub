import { ReactNode, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const handleConnectWallet = () => {
    setIsWalletConnected(!isWalletConnected);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header onConnectWallet={handleConnectWallet} isWalletConnected={isWalletConnected} />
          <main className="flex-1 p-6 relative overflow-hidden">
            {/* Background Glow Effects */}
            <div className="glow-orb glow-orb-blue w-96 h-96 -top-20 right-1/4 animate-pulse-glow" />
            <div className="glow-orb glow-orb-white w-64 h-64 top-1/3 right-10 animate-pulse-glow" style={{ animationDelay: "1s" }} />
            
            <div className="relative z-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;