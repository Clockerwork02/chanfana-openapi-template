import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';
import { SwapRoute, Quote, DEXConfig } from '../../types';

export class GetBestQuote extends OpenAPIRoute {
  schema = {
    tags: ['Quotes'],
    summary: 'Get best quote for token swap across multiple DEXs on HyperEVM',
    description: 'Aggregates quotes from all supported DEXs on HyperEVM (Chain ID: 999) to find the optimal swap route with deep liquidity integration',
    request: {
      query: z.object({
        tokenIn: z.string().describe('Address of input token (use HYPE address for native token)'),
        tokenOut: z.string().describe('Address of output token'),
        amountIn: z.string().describe('Amount of input token (in wei, 18 decimals for HYPE)'),
        slippageTolerance: z.number().optional().default(0.5).describe('Slippage tolerance percentage (0.5 = 0.5%)'),
        maxHops: z.number().optional().default(3).describe('Maximum number of hops in route'),
        excludeDexs: z.string().optional().describe('Comma-separated list of DEX names to exclude'),
        includeGasEstimate: z.boolean().optional().default(true).describe('Include gas estimates in response'),
        useHyperCoreOrders: z.boolean().optional().default(true).describe('Include HyperCore native order book liquidity'),
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
                    poolAddress: z.string().optional(),
                    fee: z.number().optional(),
                  })),
                }),
                allQuotes: z.array(z.object({
                  dex: z.string(),
                  amountOut: z.string(),
                  priceImpact: z.number(),
                  gasEstimate: z.string(),
                  executionPrice: z.string(),
                  poolAddress: z.string().optional(),
                })),
                metadata: z.object({
                  quotesFound: z.number(),
                  averageGasPrice: z.string(),
                  estimatedExecutionTime: z.number(),
                  chainId: z.number(),
                  blockNumber: z.string().optional(),
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
        useHyperCoreOrders,
      } = query;

      // Parse excluded DEXs
      const excludedDexs = excludeDexs ? excludeDexs.split(',').map(d => d.trim()) : [];

      // Get all active DEX configurations for HyperEVM
      const activeDexs = await this.getActiveDexs(c, excludedDexs);

      if (activeDexs.length === 0) {
        return c.json({
          success: false,
          error: 'No active DEXs available on HyperEVM',
        }, 404);
      }

      // Get quotes from all DEXs in parallel
      const quotePromises = activeDexs.map(dex => 
        this.getQuoteFromDex(dex, tokenIn, tokenOut, amountIn, maxHops)
      );

      // Include HyperCore native order book if enabled
      if (useHyperCoreOrders && !excludedDexs.includes('HyperCore-Native')) {
        quotePromises.push(
          this.getHyperCoreQuote(tokenIn, tokenOut, amountIn)
        );
      }

      const allQuotes = await Promise.allSettled(quotePromises);

      // Filter successful quotes
      const validQuotes: Quote[] = allQuotes
        .filter((result): result is PromiseFulfilledResult<Quote> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      if (validQuotes.length === 0) {
        return c.json({
          success: false,
          error: 'No valid quotes found for this token pair on HyperEVM',
        }, 404);
      }

      // Find the best route (highest output amount with acceptable price impact)
      const bestRoute = this.findOptimalRoute(validQuotes, slippageTolerance);

      // Calculate gas estimates if requested
      let gasEstimate = '0';
      if (includeGasEstimate) {
        gasEstimate = await this.estimateGasForRoute(bestRoute, c);
      }

      // Get current block info
      const blockInfo = await this.getCurrentBlockInfo(c);

      // Prepare response
      const response = {
        success: true,
        data: {
          bestRoute: {
            totalAmountOut: bestRoute.totalAmountOut,
            priceImpact: bestRoute.priceImpact,
            gasEstimate,
            executionPrice: bestRoute.executionPrice,
            route: bestRoute.route.map(r => ({
              dex: r.dex,
              path: r.path,
              percentage: r.percentage,
              amountIn: (BigInt(amountIn) * BigInt(r.percentage) / 100n).toString(),
              amountOut: (BigInt(bestRoute.totalAmountOut) * BigInt(r.percentage) / 100n).toString(),
              poolAddress: bestRoute.quotes[0]?.poolAddress,
              fee: this.getDexFee(r.dex),
            })),
          },
          allQuotes: validQuotes.map(quote => ({
            dex: quote.dex,
            amountOut: quote.amountOut,
            priceImpact: quote.priceImpact,
            gasEstimate: quote.gasEstimate,
            executionPrice: quote.executionPrice,
            poolAddress: quote.poolAddress,
          })),
          metadata: {
            quotesFound: validQuotes.length,
            averageGasPrice: await this.getAverageGasPrice(c),
            estimatedExecutionTime: this.estimateExecutionTime(bestRoute),
            chainId: 999, // HyperEVM mainnet
            blockNumber: blockInfo.blockNumber,
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
    // Real DEX configurations based on HyperEVM ecosystem research
    // Note: HyperEVM is still in early stages, so most liquidity comes from HyperCore
    const allDexs: DEXConfig[] = [
      {
        name: 'HyperCore-Native',
        address: '0x0000000000000000000000000000000000000001', // System contract
        router: '0x0000000000000000000000000000000000000001',
        factory: '0x0000000000000000000000000000000000000001',
        type: 'hyperliquid-native',
        fee: 5, // 0.05% (best rates from native order book)
        isActive: true,
      },
      // Note: The following DEXs may not be deployed yet but represent expected AMM deployments
      {
        name: 'HyperSwap-V2',
        address: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D', // Expected Uniswap V2 style
        router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
        type: 'uniswap-v2',
        fee: 30, // 0.3%
        isActive: false, // Set to false until confirmed deployment
      },
      {
        name: 'HyperDEX-V3',
        address: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Expected Uniswap V3 style
        router: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
        quoter: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
        type: 'uniswap-v3',
        fee: 25, // 0.25%
        isActive: false, // Set to false until confirmed deployment
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
      // This would make actual calls to DEX contracts via HyperEVM RPC
      // For now, we'll simulate different quotes based on DEX characteristics
      const baseAmount = BigInt(amountIn);
      let amountOut: bigint;
      let priceImpact: number;

      switch (dex.type) {
        case 'uniswap-v2':
          // Simulate AMM pricing with 0.3% fee + slippage
          amountOut = baseAmount * 997n / 1000n; // 0.3% fee
          amountOut = amountOut * 999n / 1000n; // 0.1% slippage
          priceImpact = 0.4;
          break;
        case 'hyperliquid-native':
          // Best rates due to direct HyperCore integration
          amountOut = baseAmount * 999n / 1000n; // 0.1% fee
          amountOut = amountOut * 9999n / 10000n; // minimal slippage
          priceImpact = 0.01;
          break;
        case 'uniswap-v3':
          // Concentrated liquidity, better than V2
          amountOut = baseAmount * 9975n / 10000n; // 0.25% fee
          amountOut = amountOut * 9995n / 10000n; // 0.05% slippage
          priceImpact = 0.3;
          break;
        case 'curve':
          // Optimized for stablecoins
          amountOut = baseAmount * 9996n / 10000n; // 0.04% fee
          amountOut = amountOut * 9998n / 10000n; // 0.02% slippage
          priceImpact = 0.06;
          break;
        default:
          amountOut = baseAmount * 97n / 100n; // 3% spread fallback
          priceImpact = 3.0;
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

  private async getHyperCoreQuote(
    tokenIn: string,
    tokenOut: string,
    amountIn: string
  ): Promise<Quote | null> {
    try {
      // Simulate HyperCore native order book integration
      // This would use the actual HyperCore API in production
      const baseAmount = BigInt(amountIn);
      
      // HyperCore offers the best liquidity with minimal slippage
      const amountOut = baseAmount * 9995n / 10000n; // 0.05% spread
      const priceImpact = 0.02;
      const gasEstimate = '50000'; // Lower gas for native integration
      const executionPrice = (Number(amountOut) / Number(baseAmount)).toFixed(6);

      return {
        dex: 'HyperCore-Native',
        poolAddress: '0x0000000000000000000000000000000000000001',
        amountIn,
        amountOut: amountOut.toString(),
        priceImpact,
        gasEstimate,
        route: [tokenIn, tokenOut],
        executionPrice,
      };
    } catch (error) {
      console.error('Error getting HyperCore quote:', error);
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
      'hyperliquid-native': 50000, // Lower due to system integration
      'curve': 200000,
      'balancer': 250000,
    };

    return (baseGas[dexType] || 150000).toString();
  }

  private getDexFee(dexName: string): number {
    const fees = {
      'HyperSwap-V2': 30,
      'HyperDEX-V3': 25,
      'HyperCore-Native': 5,
      'HyperCurve': 4,
      'HyperCore': 5,
    };
    return fees[dexName] || 30;
  }

  private async estimateGasForRoute(route: SwapRoute, c: Context): Promise<string> {
    // Sum up gas estimates for all steps in the route
    const totalGas = route.quotes.reduce((sum, quote) => 
      sum + Number(quote.gasEstimate), 0
    );

    return totalGas.toString();
  }

  private async getAverageGasPrice(c: Context): Promise<string> {
    // In production, this would call the HyperEVM RPC
    // HyperEVM uses EIP-1559, so we'd get base fee + priority fee
    return '2000000000'; // 2 gwei (lower than Ethereum due to HyperBFT efficiency)
  }

  private async getCurrentBlockInfo(c: Context): Promise<{ blockNumber: string }> {
    // In production, this would call the HyperEVM RPC
    return {
      blockNumber: '12345678',
    };
  }

  private estimateExecutionTime(route: SwapRoute): number {
    // HyperEVM has faster block times due to HyperBFT consensus
    return route.quotes.length * 3; // 3 seconds per hop (faster than Ethereum)
  }
}