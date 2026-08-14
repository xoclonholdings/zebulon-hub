import React from "react";

interface ZebulonLogoProps {
  className?: string;
  size?: number;
}

/**
 * ZAR and Zebulon/ZCOS intentionally share one identity mark.
 * This is the canonical ZAR artwork already approved in the ZedAI source
 * while the remaining migration is completed into zebulon-hub.
 */
const CANONICAL_ZAR_LOGO =
  "https://raw.githubusercontent.com/xoclonholdings/ZedAI/main/attached_assets/ZAR-ai-logo_1753468041342.png";

const ZebulonLogo: React.FC<ZebulonLogoProps> = ({ className = "", size = 24 }) => (
  <img
    src={CANONICAL_ZAR_LOGO}
    width={size}
    height={size}
    alt="ZAR / Zebulon"
    className={className}
    draggable={false}
  />
);

export default ZebulonLogo;
