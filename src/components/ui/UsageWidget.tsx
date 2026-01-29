import React, { useState, useEffect } from "react";
import { usageService, SessionStats } from "../../services/usageService";
import { Activity } from "lucide-react";
import { useTranslation } from "../../hooks/useTranslation";

type UsageWidgetProps = {
  refreshTrigger: number;
  onClick?: () => void;
};

/**
 * UsageWidget Component (Footer Trigger Only)
 *
 * Displays mini-stats in the footer.
 * Clicking it triggers the full UsageDashboard in the Developer Menu.
 */
export const UsageWidget: React.FC<UsageWidgetProps> = ({
  refreshTrigger,
  onClick,
}) => {
  const t = useTranslation();
  const [stats, setStats] = useState<SessionStats>(
    usageService.getCurrentSessionStats(),
  );

  useEffect(() => {
    setStats(usageService.getCurrentSessionStats());
  }, [refreshTrigger]);

  if (!stats) return null;

  const currentCost = stats.totalCost;
  const currentBrl = stats.totalCostInBrl;
  const formattedCurrentBrl = currentBrl.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 text-[10px] font-medium text-on-surface-variant hover:text-primary transition-colors px-3 py-1 rounded-full hover:bg-primary-container group border border-transparent hover:border-primary/20"
      title={`${t.app.usage.currentSession}: ${stats.sessionId}\n${t.app.usage.stats.estimated}: ${formattedCurrentBrl}`}
    >
      <div className="bg-surface-container group-hover:bg-surface p-1 rounded-full transition-colors">
        <Activity className="w-3 h-3" />
      </div>
      <span className="font-mono">${currentCost.toFixed(4)}</span>
      <span className="opacity-30 mx-3">|</span>
      <span className="ml-0.5">
        {(stats.totalInputTokens + stats.totalOutputTokens).toLocaleString()}{" "}
        {t.app.usage.tokensSuffix}
      </span>
    </button>
  );
};
