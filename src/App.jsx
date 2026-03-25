import AppRouter from './router/AppRouter';

function MobileBlocker() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md text-center">
        <div className="w-16 h-16 bg-[#FDC63A]/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FDC63A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
            <line x1="12" y1="18" x2="12.01" y2="18" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-[#1E293B] mb-3">Desktop Only</h1>
        <p className="text-[#64748B] text-[15px] leading-relaxed">
          This website is not available for mobile devices. Please open it on a desktop or laptop browser.
        </p>
      </div>
    </div>
  );
}

function App() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  if (isMobile) return <MobileBlocker />;

  return <AppRouter />;
}

export default App;
