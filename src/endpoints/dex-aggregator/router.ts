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
      title: 'HyperEVM Multi-DEX Aggregator API',
      version: '1.0.0',
      description: 'Comprehensive multi-DEX aggregator for optimal token swaps on HyperEVM chain (Chain ID: 999)',
    },
    tags: [
      {
        name: 'Quotes',
        description: 'Get best quotes across multiple DEXs',
      },
      {
        name: 'Swap',
        description: 'Execute swaps with withdrawal protection',
      },
      {
        name: 'Tokens',
        description: 'Token and pool information',
      },
      {
        name: 'Analytics',
        description: 'Market analytics and arbitrage opportunities',
      },
    ],
  },
});

// Register all endpoints
dexAggregatorRouter.get('/quote', GetBestQuote);
dexAggregatorRouter.post('/swap', ExecuteSwap);
dexAggregatorRouter.get('/tokens', GetSupportedTokens);
dexAggregatorRouter.get('/pools', GetPools);
dexAggregatorRouter.get('/arbitrage', GetArbitrageOpportunities);
dexAggregatorRouter.get('/price-history', GetPriceHistory);
dexAggregatorRouter.get('/analytics', GetLiquidityAnalytics);

// Health check endpoint
dexAggregatorRouter.get('/health', (c) => {
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      chainId: 999, // HyperEVM mainnet
      supportedDexs: 7,
      activeDexs: [
        'HyperCore-Native',
        'HyperSwap-V2', 
        'HyperSwap-V3',
        'PURR-DEX',
        'KittenSwap',
        'LiquidSwap',
        'GlueX'
      ],
      features: [
        'Multi-DEX aggregation',
        'Multi-hop routing',
        'Price impact optimization',
        'Gas estimation',
        'Slippage protection',
        'Emergency withdrawal',
        'Arbitrage detection'
      ],
    },
  });
});

export default dexAggregatorRouter;