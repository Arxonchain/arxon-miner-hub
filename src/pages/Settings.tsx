import { User, Bell, Shield, Palette } from "lucide-react";

const settingsSections = [
  {
    icon: User,
    title: "Profile",
    description: "Manage your account information",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure notification preferences",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Update password and security settings",
  },
  {
    icon: Palette,
    title: "Appearance",
    description: "Customize the look and feel",
  },
];

const Settings = () => {
  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Settings</h1>

      <div className="grid gap-2 sm:gap-3 lg:gap-4">
        {settingsSections.map((section) => (
          <div
            key={section.title}
            className="glass-card p-3 sm:p-4 md:p-5 lg:p-6 flex items-center gap-3 sm:gap-4 hover:bg-secondary/50 transition-colors cursor-pointer group"
          >
            <div className="p-2 sm:p-2.5 lg:p-3 rounded-lg bg-accent/20 text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors shrink-0">
              <section.icon className="h-5 w-5 lg:h-6 lg:w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-foreground">{section.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">{section.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
