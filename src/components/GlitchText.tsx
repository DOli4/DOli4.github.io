import type { ElementType, ReactNode } from "react";

/** Text with an RGB-split glitch overlay (cyan/red), driven by CSS ::before/::after. */
export default function GlitchText({
  children,
  as: Tag = "span",
  className = "",
}: {
  children: string;
  as?: ElementType;
  className?: string;
}): ReactNode {
  return (
    <Tag className={className}>
      <span className="glitch" data-text={children}>
        {children}
      </span>
    </Tag>
  );
}
