export function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">DEX</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              DEX Aggregator
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Best rates across all DEXs
            </p>
          </div>
        </div>
        
        <nav className="hidden md:flex space-x-6">
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Swap
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Portfolio
          </a>
          <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Analytics
          </a>
        </nav>
      </div>
    </header>
  )
}