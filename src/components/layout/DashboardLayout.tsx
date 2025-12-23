import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import AnimatedBackground from "./AnimatedBackground";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Animated Background */}
      <AnimatedBackground />
      
      <Header />
      <div className="flex relative z-10">
        <Sidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 relative overflow-hidden">
          {/* Background Glow Effects - responsive sizing */}
          <div className="glow-orb glow-orb-blue w-32 sm:w-48 md:w-64 lg:w-96 h-32 sm:h-48 md:h-64 lg:h-96 -top-10 lg:-top-20 right-1/4 animate-pulse-glow" />
          <div className="glow-orb glow-orb-white w-24 sm:w-32 md:w-48 lg:w-64 h-24 sm:h-32 md:h-48 lg:h-64 top-1/3 right-5 lg:right-10 animate-pulse-glow" style={{ animationDelay: "1s" }} />
          <div className="glow-orb glow-orb-blue w-28 sm:w-40 md:w-56 lg:w-80 h-28 sm:h-40 md:h-56 lg:h-80 bottom-10 lg:bottom-20 left-1/4 animate-pulse-glow" style={{ animationDelay: "2s" }} />
          
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
