import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import { SwapRoute, Quote, DEXConfig } from '../../types';

export class GetBestQuote extends OpenAPIRoute {
  schema = {
    tags: ['Quotes'],
    summary: 'Get best quote for token swap across multiple DEXs',
    description: 'Aggregates quotes from all supported DEXs on HyperEVM to find the optimal swap route',
    request: {
      query: z.object({
        tokenIn: z.string().describe('Address of input token'),
        tokenOut: z.string().describe('Address of output token'),
        amountIn: z.string().describe('Amount of input token (in wei)'),
        slippageTolerance: z.number().optional().default(0.5).describe('Slippage tolerance percentage (0.5 = 0.5%)'),
        maxHops: z.number().optional().default(3).describe('Maximum number of hops in route'),
        excludeDexs: z.string().optional().describe('Comma-separated list of DEX names to exclude'),
        includeGasEstimate: z.boolean().optional().default(true).describe('Include gas estimates in response'),
      }),
    },
    responses: {
      '200': {
        description: 'Best quote found successfully',
        content: {
          'application/json': {
            schema: z.object({
              success: z.boolean(),
              data: z.object({
                bestRoute: z.object({
                  totalAmountOut: z.string(),
                  priceImpact: z.number(),
                  gasEstimate: z.string(),
                  executionPrice: z.string(),
                  route: z.array(z.object({
                    dex: z.string(),
                    path: z.array(z.string()),
                    percentage: z.number(),
                    amountIn: z.string(),
                    amountOut: z.string(),
                  })),
                }),
                allQuotes: z.array(z.object({
                  dex: z.string(),
                  amountOut: z.string(),
                  priceImpact: z.number(),
                  gasEstimate: z.string(),
                  executionPrice: z.string(),
                })),
                metadata: z.object({
                  quotesFound: z.number(),
                  averageGasPrice: z.string(),
                  estimatedExecutionTime: z.number(),
                }),
              }),
            }),
          },
        },
      },
      '400': {
        description: 'Invalid request parameters',
      },
      '404': {
        description: 'No route found for the given token pair',
      },
    },
  };

  async handle(c: Context) {
    try {
      const query = await this.getValidatedData<typeof this.schema>('query', c, this.schema);
      
      const {
        tokenIn,
        tokenOut,
        amountIn,
        slippageTolerance,
        maxHops,
        excludeDexs,
        includeGasEstimate,
      } = query;

      // Parse excluded DEXs
      const excludedDexs = excludeDexs ? excludeDexs.split(',').map(d => d.trim()) : [];

      // Get all active DEX configurations
      const activeDexs = await this.getActiveDexs(c, excludedDexs);

      if (activeDexs.length === 0) {
        return c.json({
          success: false,
          error: 'No active DEXs available',
        }, 404);
      }

      // Get quotes from all DEXs in parallel
      const allQuotes = await Promise.allSettled(
        activeDexs.map(dex => this.getQuoteFromDex(dex, tokenIn, tokenOut, amountIn, maxHops))
      );

      // Filter successful quotes
      const validQuotes: Quote[] = allQuotes
        .filter((result): result is PromiseFulfilledResult<Quote> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      if (validQuotes.length === 0) {
        return c.json({
          success: false,
          error: 'No valid quotes found for this token pair',
        }, 404);
      }

      // Find the best route (highest output amount with acceptable price impact)
      const bestRoute = this.findOptimalRoute(validQuotes, slippageTolerance);

      // Calculate gas estimates if requested
      let gasEstimate = '0';
      if (includeGasEstimate) {
        gasEstimate = await this.estimateGasForRoute(bestRoute, c);
      }

      // Prepare response
      const response = {
        success: true,
        data: {
          bestRoute: {
            totalAmountOut: bestRoute.totalAmountOut,
            priceImpact: bestRoute.priceImpact,
            gasEstimate,
            executionPrice: bestRoute.executionPrice,
            route: bestRoute.route,
          },
          allQuotes: validQuotes.map(quote => ({
            dex: quote.dex,
            amountOut: quote.amountOut,
            priceImpact: quote.priceImpact,
            gasEstimate: quote.gasEstimate,
            executionPrice: quote.executionPrice,
          })),
          metadata: {
            quotesFound: validQuotes.length,
            averageGasPrice: await this.getAverageGasPrice(c),
            estimatedExecutionTime: this.estimateExecutionTime(bestRoute),
          },
        },
      };

      return c.json(response);

    } catch (error) {
      console.error('Error getting best quote:', error);
      return c.json({
        success: false,
        error: 'Internal server error while fetching quotes',
      }, 500);
    }
  }

  private async getActiveDexs(c: Context, excludedDexs: string[]): Promise<DEXConfig[]> {
    // In a real implementation, this would fetch from a database or configuration
    const allDexs: DEXConfig[] = [
      {
        name: 'HyperSwap',
        address: '0x1234567890123456789012345678901234567890',
        router: '0x1234567890123456789012345678901234567891',
        factory: '0x1234567890123456789012345678901234567892',
        type: 'uniswap-v2',
        fee: 30,
        isActive: true,
      },
      {
        name: 'HyperLiquid',
        address: '0x2234567890123456789012345678901234567890',
        router: '0x2234567890123456789012345678901234567891',
        factory: '0x2234567890123456789012345678901234567892',
        quoter: '0x2234567890123456789012345678901234567893',
        type: 'hyperliquid-native',
        fee: 25,
        isActive: true,
      },
      {
        name: 'HyperCurve',
        address: '0x3234567890123456789012345678901234567890',
        router: '0x3234567890123456789012345678901234567891',
        factory: '0x3234567890123456789012345678901234567892',
        type: 'curve',
        fee: 4,
        isActive: true,
      },
    ];

    return allDexs.filter(dex => 
      dex.isActive && !excludedDexs.includes(dex.name)
    );
  }

  private async getQuoteFromDex(
    dex: DEXConfig,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    maxHops: number
  ): Promise<Quote | null> {
    try {
      // This would make actual calls to DEX contracts or APIs
      // For now, we'll simulate different quotes
      const baseAmount = BigInt(amountIn);
      let amountOut: bigint;
      let priceImpact: number;

      switch (dex.type) {
        case 'uniswap-v2':
          amountOut = baseAmount * 98n / 100n; // 2% spread
          priceImpact = 0.2;
          break;
        case 'hyperliquid-native':
          amountOut = baseAmount * 995n / 1000n; // 0.5% spread (best)
          priceImpact = 0.05;
          break;
        case 'curve':
          amountOut = baseAmount * 996n / 1000n; // 0.4% spread
          priceImpact = 0.1;
          break;
        default:
          amountOut = baseAmount * 97n / 100n; // 3% spread
          priceImpact = 0.3;
      }

      const gasEstimate = this.estimateGasForDex(dex.type);
      const executionPrice = (Number(amountOut) / Number(baseAmount)).toFixed(6);

      return {
        dex: dex.name,
        poolAddress: dex.address,
        amountIn,
        amountOut: amountOut.toString(),
        priceImpact,
        gasEstimate,
        route: [tokenIn, tokenOut],
        executionPrice,
      };
    } catch (error) {
      console.error(`Error getting quote from ${dex.name}:`, error);
      return null;
    }
  }

  private findOptimalRoute(quotes: Quote[], maxSlippage: number): SwapRoute {
    // Sort by amount out (descending) and filter by price impact
    const validQuotes = quotes.filter(quote => quote.priceImpact <= maxSlippage);
    
    if (validQuotes.length === 0) {
      // If no quotes meet slippage requirements, use the best available
      validQuotes.push(quotes.sort((a, b) => Number(b.amountOut) - Number(a.amountOut))[0]);
    }

    const bestQuote = validQuotes.sort((a, b) => Number(b.amountOut) - Number(a.amountOut))[0];

    return {
      quotes: [bestQuote],
      totalAmountOut: bestQuote.amountOut,
      priceImpact: bestQuote.priceImpact,
      gasEstimate: bestQuote.gasEstimate,
      executionPrice: bestQuote.executionPrice,
      route: [{
        dex: bestQuote.dex,
        path: bestQuote.route,
        percentage: 100,
      }],
    };
  }

  private estimateGasForDex(dexType: string): string {
    const baseGas = {
      'uniswap-v2': 150000,
      'uniswap-v3': 180000,
      'hyperliquid-native': 120000,
      'curve': 200000,
      'balancer': 250000,
    };

    return (baseGas[dexType] || 150000).toString();
  }

  private async estimateGasForRoute(route: SwapRoute, c: Context): Promise<string> {
    // Sum up gas estimates for all steps in the route
    const totalGas = route.quotes.reduce((sum, quote) => 
      sum + Number(quote.gasEstimate), 0
    );

    return totalGas.toString();
  }

  private async getAverageGasPrice(c: Context): Promise<string> {
    // In a real implementation, this would fetch current gas prices
    return '20000000000'; // 20 gwei
  }

  private estimateExecutionTime(route: SwapRoute): number {
    // Estimate execution time based on route complexity
    return route.quotes.length * 15; // 15 seconds per hop
  }
}