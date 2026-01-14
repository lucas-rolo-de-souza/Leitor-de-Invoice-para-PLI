import React, { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  icon: ReactNode;
  className?: string; // Allow additional styling if needed, though mostly standard
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-2 mb-6 border-b border-dashed border-outline-variant/30 pb-2 ${className}`}
    >
      <div className="p-1.5 rounded-full bg-primary-container/30 text-primary">
        {icon}
      </div>
      <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest">
        {title}
      </h4>
    </div>
  );
};
