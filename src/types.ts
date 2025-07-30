import type { Context } from "hono";

export type AppContext = Context<{ Bindings: Env }>;
export type HandleArgs = [AppContext];

export interface Env {
	DB: D1Database;
}

// DEX Aggregator Types for HyperEVM

export interface DEXConfig {
	name: string;
	address: string;
	router: string;
	factory: string;
	quoter?: string;
	type: 'uniswap-v2' | 'uniswap-v3' | 'curve' | 'balancer' | 'hyperliquid-native';
	fee?: number; // basis points
	isActive: boolean;
}

export interface Token {
	address: string;
	symbol: string;
	name: string;
	decimals: number;
	chainId: number;
	logoURI?: string;
	tags?: string[];
}

export interface Pool {
	address: string;
	token0: Token;
	token1: Token;
	fee: number;
	dex: string;
	liquidity: string;
	reserve0?: string;
	reserve1?: string;
	sqrtPriceX96?: string; // For V3 pools
}

export interface Quote {
	dex: string;
	poolAddress: string;
	amountIn: string;
	amountOut: string;
	priceImpact: number;
	gasEstimate: string;
	route: string[];
	executionPrice: string;
}

export interface SwapRoute {
	quotes: Quote[];
	totalAmountOut: string;
	priceImpact: number;
	gasEstimate: string;
	executionPrice: string;
	route: {
		dex: string;
		path: string[];
		percentage: number;
	}[];
}

export interface SwapParams {
	tokenIn: string;
	tokenOut: string;
	amountIn: string;
	slippageTolerance: number; // percentage
	deadline?: number;
	recipient?: string;
	maxHops?: number;
	excludeDexs?: string[];
}

export interface PriceData {
	price: string;
	priceUSD: string;
	change24h: number;
	volume24h: string;
	liquidity: string;
	lastUpdated: number;
}

export interface ArbitrageOpportunity {
	tokenA: string;
	tokenB: string;
	dexA: string;
	dexB: string;
	priceA: string;
	priceB: string;
	profitPercentage: number;
	amountIn: string;
	expectedProfit: string;
	gasEstimate: string;
}

export interface LiquidityProvider {
	dex: string;
	pool: string;
	token0: string;
	token1: string;
	liquidity: string;
	share: number;
	apy: number;
	fees24h: string;
}
