import { Moon, Sun } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-lg transition-all duration-300
        ${
          theme === "dark"
            ? "bg-slate-800 text-yellow-400 hover:bg-slate-700 hover:shadow-glow-yellow"
            : "bg-slate-100 text-slate-500 hover:text-orange-500 hover:bg-orange-50"
        }
      `}
      title={
        theme === "dark" ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"
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
