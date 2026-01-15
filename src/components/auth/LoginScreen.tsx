import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import {
  FileSpreadsheet,
  Lock,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { ThemeToggle } from "../ThemeToggle";

export const LoginScreen: React.FC = () => {
  const { signInWithPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signInWithPassword(email, password);
      if (error) {
        throw error;
      }
    } catch (err: any) {
      setError(err.message || "Falha ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center items-center relative overflow-hidden p-6">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear_gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      <div className="absolute w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] -top-20 -left-20 animate-pulse-slow"></div>

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-surface border border-outline-variant/30 rounded-3xl shadow-2xl p-8 z-10 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-4">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-on-surface">
            Bem-vindo ao PLI.ai
          </h1>
          <p className="text-on-surface-variant text-sm mt-2">
            Faça login para continuar
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-error-container/20 border border-error/20 rounded-xl p-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-on-error-container font-medium">
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">
              Email
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant group-focus-within:text-primary transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-10 pr-4 text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                placeholder="nome@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider ml-1">
              Senha
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline-variant group-focus-within:text-primary transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-surface-container-low border border-outline-variant/50 rounded-xl py-3 pl-10 pr-4 text-on-surface placeholder:text-outline-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-on-primary py-3.5 rounded-xl font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Entrar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-outline-variant/20 text-center">
          <p className="text-xs text-on-surface-variant">
            Não tem uma conta?{" "}
            <span className="text-primary font-semibold cursor-not-allowed opacity-70">
              Contate o administrador
            </span>
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 text-[10px] text-on-surface-variant/50 font-mono">
        Secured by Supabase Integration
      </div>
    </div>
  );
};
