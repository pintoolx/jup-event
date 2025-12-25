export function BackgroundEffects() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[1200px] h-[700px] bg-blue-600/[0.05] rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-400/[0.03] rounded-full blur-[120px]" />
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.02]" />
    </div>
  )
}


