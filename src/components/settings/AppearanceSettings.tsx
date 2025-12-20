import { Moon, Sun, Monitor, Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/use-toast";

type ThemeMode = "dark" | "light" | "system";

const AppearanceSettings = () => {
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme === "system" ? "system" : newTheme} mode`,
    });
  };

  const themeOptions = [
    {
      value: "dark" as const,
      icon: Moon,
      title: "Dark Mode",
      description: "Optimal for low-light environments",
    },
    {
      value: "light" as const,
      icon: Sun,
      title: "Light Mode",
      description: "Classic bright interface",
    },
    {
      value: "system" as const,
      icon: Monitor,
      title: "System",
      description: "Follows your device settings",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          Theme
        </h3>
        <p className="text-xs text-muted-foreground">
          Choose how ARXON appears on your device
        </p>
      </div>

      <div className="grid gap-3">
        {themeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleThemeChange(option.value)}
            className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border transition-all text-left ${
              theme === option.value
                ? "bg-accent/20 border-accent"
                : "bg-secondary/30 border-border/30 hover:bg-secondary/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  theme === option.value
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <option.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{option.title}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
            </div>
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                theme === option.value
                  ? "bg-accent border-accent"
                  : "border-muted-foreground"
              }`}
            >
              {theme === option.value && <Check className="h-3 w-3 text-accent-foreground" />}
            </div>
          </button>
        ))}
      </div>

      {/* Current Theme Info */}
      <div className="p-3 sm:p-4 rounded-lg bg-secondary/30 border border-border/30">
        <p className="text-xs text-muted-foreground mb-2">Currently using</p>
        <div className="flex items-center gap-2">
          {resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4 text-accent" />
          ) : (
            <Sun className="h-4 w-4 text-accent" />
          )}
          <span className="text-sm font-medium text-foreground capitalize">
            {resolvedTheme} Theme
          </span>
          {theme === "system" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent">
              Auto
            </span>
          )}
        </div>
      </div>

      {/* Mining Interface Preview */}
      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground">Interface Preview</Label>
        <div className="p-4 rounded-lg bg-card border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-sm font-bold">A</span>
              </div>
              <div>
                <p className="text-xs font-medium text-foreground">Mining Active</p>
                <p className="text-[10px] text-muted-foreground">0.0024 ARX/sec</p>
              </div>
            </div>
            <div className="px-2 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-medium">
              Online
            </div>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-accent to-primary rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;
