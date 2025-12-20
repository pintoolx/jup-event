export function BackgroundEffects() {
  return (
    <>
      {/* Grid Background */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      
      {/* Gradient Orbs */}
      <div className="fixed top-20 left-20 w-96 h-96 bg-jup-green rounded-full blur-[150px] opacity-[0.03]" />
      <div className="fixed bottom-20 right-20 w-80 h-80 bg-jup-green-dark rounded-full blur-[120px] opacity-[0.05]" />
      
    </>
  )
}


