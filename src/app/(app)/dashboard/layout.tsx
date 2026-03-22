export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
