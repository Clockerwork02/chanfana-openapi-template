'use client'

import { useState } from 'react'

interface WalletConnectProps {
  onConnect: () => void
}

export function WalletConnect({ onConnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState('')

  const connectWallet = async () => {
    setIsConnecting(true)
    setError('')

    try {
      // Check if MetaMask is installed
      if (typeof window.ethereum === 'undefined') {
        setError('MetaMask is not installed. Please install MetaMask to continue.')
        setIsConnecting(false)
        return
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      if (accounts.length > 0) {
        console.log('Connected account:', accounts[0])
        onConnect()
      } else {
        setError('No accounts found. Please connect your wallet.')
      }
    } catch (err) {
      console.error('Error connecting wallet:', err)
      setError('Failed to connect wallet. Please try again.')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="space-y-4">
      <button
        onClick={connectWallet}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
      >
        {isConnecting ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Connecting...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            <span>Connect Wallet</span>
          </div>
        )}
      </button>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          By connecting your wallet, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}