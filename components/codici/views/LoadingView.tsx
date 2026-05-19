const C = { bg: '#0D1F1F', teal: '#28A0A0', light: '#EEF8F8' };

export default function LoadingView({ short }: { short: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: C.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, sans-serif', padding: 24,
    }}>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 56, height: 56, border: `4px solid ${C.teal}`,
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 16px',
        }} />
        <p style={{
          color: C.light, fontSize: 16, fontFamily: '"JetBrains Mono", monospace',
          margin: 0,
        }}>{short}</p>
        <p style={{ color: `${C.light}80`, fontSize: 13, marginTop: 8 }}>
          Caricamento contesto...
        </p>
      </div>
    </div>
  );
}