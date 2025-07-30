'use client'

import { useState } from 'react'

interface TokenSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

const commonTokens = [
  { symbol: 'ETH', name: 'Ethereum', address: '0x0000000000000000000000000000000000000000' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xA0b86a33E6441b8C4C8C0C8C0C8C0C8C0C8C0C8C' },
  { symbol: 'USDT', name: 'Tether', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  { symbol: 'DAI', name: 'Dai', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599' },
]

export function TokenSelector({ value, onChange, placeholder }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedToken = commonTokens.find(token => token.symbol === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg px-3 py-2 min-w-[120px] hover:border-gray-400 dark:hover:border-gray-400 transition-colors"
      >
        {selectedToken ? (
          <>
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{selectedToken.symbol[0]}</span>
            </div>
            <span className="text-gray-900 dark:text-white font-medium">{selectedToken.symbol}</span>
          </>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
        )}
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-lg shadow-lg z-10">
          <div className="p-2">
            <input
              type="text"
              placeholder="Search tokens..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-500 rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {commonTokens.map((token) => (
              <button
                key={token.symbol}
                onClick={() => {
                  onChange(token.symbol)
                  setIsOpen(false)
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{token.symbol[0]}</span>
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{token.symbol}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{token.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}