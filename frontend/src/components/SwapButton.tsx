interface SwapButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled: boolean
}

export function SwapButton({ onClick, isLoading, disabled }: SwapButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
    >
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Swapping...</span>
        </div>
      ) : (
        <span>Swap Tokens</span>
      )}
    </button>
  )
}