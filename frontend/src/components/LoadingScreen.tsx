// frontend/src/components/LoadingScreen.tsx
export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-4xl animate-pulse">🖨️</div>
      <div className="text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
        PrintTrack загружается...
      </div>
    </div>
  )
}
