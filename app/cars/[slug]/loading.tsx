// Shown by the App Router while the model page fetches its data.
// A static, neutral placeholder in the page's own shape — no animation, no fake progress.
export default function ModelLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      style={{ minHeight: '60vh', background: '#0a0a0a', maxWidth: 1400, margin: '0 auto', padding: '32px 16px' }}
    >
      <div style={{ height: 28, width: 260, maxWidth: '60%', background: '#141414', marginBottom: 24 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ aspectRatio: '2 / 3', background: '#121212' }} />
        <div style={{ aspectRatio: '2 / 3', background: '#121212' }} />
        <div style={{ aspectRatio: '2 / 3', background: '#121212' }} />
      </div>
    </div>
  )
}
