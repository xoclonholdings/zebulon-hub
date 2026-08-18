import React from "react";

interface ZebulonLogoProps {
  className?: string;
  size?: number;
}

/** ZAR and Zebulon/ZCOS intentionally share the approved identity mark. */
const ZebulonLogo: React.FC<ZebulonLogoProps> = ({ className = "", size = 24 }) => (
  <img
    src="/zcos-logo.png"
    width={size}
    height={size}
    alt="ZAR / Zebulon"
    className={className}
    draggable={false}
  />
);

export default ZebulonLogo;
