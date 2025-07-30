import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import { GetBestQuote } from './getBestQuote';
import { ExecuteSwap } from './executeSwap';
import { GetSupportedTokens } from './getSupportedTokens';
import { GetPools } from './getPools';
import { GetArbitrageOpportunities } from './getArbitrageOpportunities';
import { GetPriceHistory } from './getPriceHistory';
import { GetLiquidityAnalytics } from './getLiquidityAnalytics';

// Create a new Hono instance for DEX aggregator routes
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry for the router
export const dexAggregatorRouter = fromHono(app, {
  schema: {
    info: {
      title: 'HyperEVM DEX Aggregator API',
      version: '1.0.0',
      description: 'Multi-DEX aggregator for optimal token swaps on HyperEVM chain',
    },
    tags: [
      {
        name: 'Quotes',
        description: 'Get optimal swap quotes from multiple DEXs',
      },
      {
        name: 'Swaps',
        description: 'Execute optimal swaps across multiple DEXs',
      },
      {
        name: 'Tokens',
        description: 'Token information and supported assets',
      },
      {
        name: 'Pools',
        description: 'Liquidity pool information and analytics',
      },
      {
        name: 'Arbitrage',
        description: 'Arbitrage opportunities across DEXs',
      },
      {
        name: 'Analytics',
        description: 'Price history and liquidity analytics',
      },
    ],
  },
});

// Quote endpoints
dexAggregatorRouter.get('/quote', GetBestQuote);

// Swap endpoints
dexAggregatorRouter.post('/swap', ExecuteSwap);

// Token endpoints
dexAggregatorRouter.get('/tokens', GetSupportedTokens);

// Pool endpoints
dexAggregatorRouter.get('/pools', GetPools);

// Arbitrage endpoints
dexAggregatorRouter.get('/arbitrage', GetArbitrageOpportunities);

// Analytics endpoints
dexAggregatorRouter.get('/price-history/:tokenAddress', GetPriceHistory);
dexAggregatorRouter.get('/liquidity-analytics', GetLiquidityAnalytics);