import { useState, useEffect } from "react";
import { Palette, Moon, Sun, Monitor, Save, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ThemeMode = "dark" | "light" | "system";

const STORAGE_KEY = "arxon_theme_preference";

const AppearanceSettings = () => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode;
    if (stored) {
      setTheme(stored);
      applyTheme(stored);
    }
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const root = document.documentElement;
    if (mode === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.toggle("dark", systemPrefersDark);
    } else {
      root.classList.toggle("dark", mode === "dark");
    }
  };

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, theme);
      toast({
        title: "Appearance Updated",
        description: "Your theme preference has been saved",
      });
      setSaving(false);
    }, 500);
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
          <Palette className="h-4 w-4 text-accent" />
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
              className={`w-4 h-4 rounded-full border-2 ${
                theme === option.value
                  ? "bg-accent border-accent"
                  : "border-muted-foreground"
              }`}
            />
          </button>
        ))}
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

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Save className="h-4 w-4 mr-2" />
        )}
        Save Appearance
      </Button>
    </div>
  );
};

export default AppearanceSettings;
