'use client'

import { useState } from 'react'
import { WalletConnect } from '@/components/WalletConnect'
import { SwapInterface } from '@/components/SwapInterface'
import { Header } from '@/components/Header'

export default function Home() {
  const [isConnected, setIsConnected] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Header />
        
        <div className="mt-8 max-w-2xl mx-auto">
          {!isConnected ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-8">
                Connect your wallet to start swapping tokens across multiple DEXs
              </p>
              <WalletConnect onConnect={() => setIsConnected(true)} />
            </div>
          ) : (
            <SwapInterface />
          )}
        </div>
      </div>
    </main>
  )
}