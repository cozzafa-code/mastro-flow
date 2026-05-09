export default function LoadingView({ short }: { short: string }) {
  return (
    <div className="min-h-screen bg-[#0D1F1F] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-[#28A0A0] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#EEF8F8] text-lg font-mono">{short}</p>
        <p className="text-[#EEF8F8]/60 text-sm mt-2">Caricamento contesto...</p>
      </div>
    </div>
  );
}
