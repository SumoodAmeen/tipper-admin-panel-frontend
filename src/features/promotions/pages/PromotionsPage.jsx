const PromotionsPage = () => {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#FDC63A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
            </div>
            <h2 className="text-[30px] font-bold text-[#0F172A]">This feature is currently unavailable</h2>
            <p className="text-[16px] text-[#94A3B8]">The Promotions section is under development. Please check back later.</p>
        </div>
    );
};

export default PromotionsPage;
