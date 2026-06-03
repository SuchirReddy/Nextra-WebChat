"use client";

export const AppShell = ({ children, unreadCount = 0 }: { children: React.ReactNode; unreadCount?: number }) => {
  return (
    <div className="h-screen w-full overflow-hidden bg-[var(--clay-bg-app)]">
      {/* WhatsApp web usually has a green background strip at the top, but for full screen we just render the dual pane */}
      <div className="h-full w-full mx-auto md:max-w-[1600px] md:h-[calc(100vh-38px)] md:mt-[19px] shadow-clay-lg dark:shadow-clay-dark-lg overflow-hidden md:rounded-[2.5rem] bg-[var(--clay-bg-panel)] border-8 border-[var(--clay-bg-app)]">
        {children}
      </div>
    </div>
  );
};
