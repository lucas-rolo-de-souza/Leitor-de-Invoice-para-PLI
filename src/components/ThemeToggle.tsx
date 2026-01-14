import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useTranslation } from "../hooks/useTranslation";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2.5 rounded-pill transition-all duration-300 border
        ${
          theme === "dark"
            ? "bg-surface-highlight border-border text-yellow-400 hover:text-yellow-300 hover:bg-surface hover:shadow-glow-yellow"
            : "bg-surface border-border text-text-tertiary hover:text-primary hover:bg-surface-container hover:border-primary/30"
        }
      `}
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
        <Moon className="w-5 h-5 fill-current" />
      ) : (
        <Sun className="w-5 h-5 fill-current" />
      )}
    </button>
  );
}
