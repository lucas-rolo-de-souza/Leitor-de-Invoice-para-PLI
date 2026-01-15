import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../hooks/useTranslation";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-m3-full text-on-surface hover:bg-on-surface/10 transition-colors duration-200 group"
      title={
        theme === "dark"
          ? t.app.actions.toggleTheme.light
          : t.app.actions.toggleTheme.dark
      }
      aria-label={
        theme === "dark"
          ? t.app.actions.toggleTheme.light
          : t.app.actions.toggleTheme.dark
      }
    >
      {theme === "dark" ? (
        <Moon className="w-5 h-5 text-primary group-hover:rotate-12 transition-transform duration-300" />
      ) : (
        <Sun className="w-5 h-5 text-amber-500 group-hover:rotate-90 transition-transform duration-500" />
      )}
    </button>
  );
}
