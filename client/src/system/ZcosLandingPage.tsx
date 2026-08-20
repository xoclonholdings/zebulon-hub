import { useEffect } from "react";
import { useLocation } from "wouter";

import ZebulonConstellationPage from "./ZebulonConstellationPage";
import { CommanderDock } from "./CommanderDock";

export default function ZcosLandingPage() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const hideLegacyReset = () => {
      document.querySelectorAll<HTMLButtonElement>(".zcos-landing button").forEach((button) => {
        if (button.textContent?.trim().toLowerCase() === "reset chart") button.style.display = "none";
      });
    };
    hideLegacyReset();
    const observer = new MutationObserver(hideLegacyReset);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="zcos-landing relative h-[100dvh] w-full overflow-hidden bg-black">
      <style>{`
        .zcos-landing [data-testid="galaxy-map-dock"],
        .zcos-landing [data-testid="nexys-online-pill"],
        .zcos-landing .zebulon-vessel-panel {
          display: none !important;
        }
        .zcos-landing header > div:last-child {
          display: none !important;
        }
      `}</style>
      <ZebulonConstellationPage />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[80] flex justify-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto w-full max-w-[760px]">
          <CommanderDock navigate={navigate} />
        </div>
      </div>
    </div>
  );
}
