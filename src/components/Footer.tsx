export function Footer() {
  return (
    <footer className="relative z-10 py-8 px-8 mt-12 border-t border-gray-800/50">
      <div className="max-w-7xl mx-auto">
        {/* Disclaimer */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 mb-6">
          <p className="text-blue-400/80 text-xs leading-relaxed text-center">
            <strong>Disclaimer:</strong> This tool is provided for informational and convenience purposes only. 
            It does not constitute financial advice. Using this tool involves risks including but not limited to 
            smart contract risks, liquidation risks, and market volatility. Users are solely responsible for 
            their own investment decisions. Please do your own research (DYOR) before participating.
          </p>
        </div>

        {/* Branding */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <img src="/favicon.ico" alt="PinTool" className="w-4 h-4" />
            <span>Built by PinTool</span>
          </div>
          <div className="flex items-center">
            <a
              href="https://t.me/pintoolfam"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-colors"
              title="Join PinTool Community"
            >
              <svg className="w-8 h-8" viewBox="0 0 1000 1000" fill="currentColor">
                <path d="M226.328419,494.722069 C372.088573,431.216685 469.284839,389.350049 517.917216,369.122161 C656.772535,311.36743 685.625481,301.334815 704.431427,301.003532 C708.567621,300.93067 717.815839,301.955743 723.806446,306.816707 C728.864797,310.92121 730.256552,316.46581 730.922551,320.357329 C731.588551,324.248848 732.417879,333.113828 731.758626,340.040666 C724.234007,419.102486 691.675104,610.964674 675.110982,699.515267 C668.10208,736.984342 654.301336,749.547532 640.940618,750.777006 C611.904684,753.448938 589.856115,731.588035 561.733393,713.153237 C517.726886,684.306416 492.866009,666.349181 450.150074,638.200013 C400.78442,605.66878 432.786119,587.789048 460.919462,558.568563 C468.282091,550.921423 596.21508,434.556479 598.691227,424.000355 C599.00091,422.680135 599.288312,417.758981 596.36474,415.160431 C593.441168,412.561881 589.126229,413.450484 586.012448,414.157198 C581.598758,415.158943 511.297793,461.625274 375.109553,553.556189 C355.154858,567.258623 337.080515,573.934908 320.886524,573.585046 C303.033948,573.199351 268.692754,563.490928 243.163606,555.192408 C211.851067,545.013936 186.964484,539.632504 189.131547,522.346309 C190.260287,513.342589 202.659244,504.134509 226.328419,494.722069 Z" />
              </svg>
            </a>
          <p className="text-gray-500 text-xs">
            Not Financial Advice • Use at Your Own Risk
          </p>
        </div>
        </div>
      </div>
    </footer>
  )
}

