import type { ReactNode } from "react";

import type { VesselIdentity } from "@/system/vesselIdentity";
import type { ConsoleIdentity } from "./consoleIdentity";

export function ConsoleShell({
  headerLeft,
  headerRightExtra,
  bottomBar,
  children,
}: {
  readonly identity: ConsoleIdentity | VesselIdentity;
  readonly headerLeft: ReactNode;
  readonly headerRightExtra?: ReactNode;
  readonly bottomBar?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[radial-gradient(ellipse_90%_70%_at_50%_35%,#0b0620_0%,#050211_55%,#010005_100%)] text-white">
      {children}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 sm:pt-5">
        <div className="pointer-events-auto min-w-0">{headerLeft}</div>
        <div className="pointer-events-auto flex shrink-0 flex-col items-end gap-2">{headerRightExtra}</div>
      </header>
      <div className="absolute inset-x-0 bottom-0 z-30 flex justify-center px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[760px]">{bottomBar}</div>
      </div>
    </div>
  );
}
