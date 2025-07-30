'use client'

import { useState } from 'react'
import { TokenSelector } from './TokenSelector'
import { SwapButton } from './SwapButton'

export function SwapInterface() {
  const [tokenIn, setTokenIn] = useState('')
  const [tokenOut, setTokenOut] = useState('')
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [slippage, setSlippage] = useState('0.5')
  const [isLoading, setIsLoading] = useState(false)

  const handleSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn) {
      alert('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement actual swap logic with contract
      console.log('Swapping:', { tokenIn, tokenOut, amountIn, amountOut, slippage })
      
      // Simulate swap delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Swap completed successfully!')
    } catch (error) {
      console.error('Swap failed:', error)
      alert('Swap failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAmountChange = (value: string) => {
    setAmountIn(value)
    // TODO: Calculate amountOut based on best quote from aggregator
    setAmountOut((parseFloat(value) * 1.5).toString()) // Placeholder calculation
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Swap Tokens
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Get the best rates across all DEXs
        </p>
      </div>

      {/* Token Input */}
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              You Pay
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Balance: 0.0
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <TokenSelector
              value={tokenIn}
              onChange={setTokenIn}
              placeholder="Select token"
            />
            <input
              type="number"
              value={amountIn}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-semibold text-gray-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center">
          <button className="w-10 h-10 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors">
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Token Output */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              You Receive
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Balance: 0.0
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <TokenSelector
              value={tokenOut}
              onChange={setTokenOut}
              placeholder="Select token"
            />
            <input
              type="number"
              value={amountOut}
              onChange={(e) => setAmountOut(e.target.value)}
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-semibold text-gray-900 dark:text-white outline-none"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* Swap Details */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Best Route</span>
          <span className="text-gray-900 dark:text-white font-medium">HyperSwap V2</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Price Impact</span>
          <span className="text-green-600 font-medium">0.12%</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Slippage</span>
          <select
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            className="bg-transparent text-gray-900 dark:text-white font-medium outline-none"
          >
            <option value="0.1">0.1%</option>
            <option value="0.5">0.5%</option>
            <option value="1.0">1.0%</option>
            <option value="2.0">2.0%</option>
          </select>
        </div>
      </div>

      {/* Swap Button */}
      <SwapButton
        onClick={handleSwap}
        isLoading={isLoading}
        disabled={!tokenIn || !tokenOut || !amountIn}
      />
    </div>
  )
}