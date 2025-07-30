// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC20.sol";
import "./interfaces/IUniswapV2Router.sol";
import "./interfaces/IUniswapV3Router.sol";

contract MultiHopAggregator {
    address public owner;
    address public feeCollector;

    IUniswapV2Router public hyperSwapV2;
    IUniswapV3Router public hyperSwapV3;
    IUniswapV2Router public kittenSwap;
    IUniswapV2Router public liquidSwap;
    IUniswapV2Router public glueX;
    IUniswapV2Router public projectXV1;
    IUniswapV2Router public projectXV2;

    constructor(
        address _feeCollector,
        address _v2,
        address _v3,
        address _kitten,
        address _liquid,
        address _gluex,
        address _pxv1,
        address _pxv2
    ) {
        owner = msg.sender;
        feeCollector = _feeCollector;
        hyperSwapV2 = IUniswapV2Router(_v2);
        hyperSwapV3 = IUniswapV3Router(_v3);
        kittenSwap = IUniswapV2Router(_kitten);
        liquidSwap = IUniswapV2Router(_liquid);
        glueX = IUniswapV2Router(_gluex);
        projectXV1 = IUniswapV2Router(_pxv1);
        projectXV2 = IUniswapV2Router(_pxv2);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized");
        _;
    }

    function setFeeCollector(address _collector) external onlyOwner {
        feeCollector = _collector;
    }

    function getBestQuote(address tokenIn, address tokenOut, uint amountIn) 
        external 
        view 
        returns (uint bestAmountOut, address bestRouter) 
    {
        address[7] memory routers = [
            address(hyperSwapV2),
            address(hyperSwapV3),
            address(kittenSwap),
            address(liquidSwap),
            address(glueX),
            address(projectXV1),
            address(projectXV2)
        ];

        for (uint i = 0; i < routers.length; i++) {
            if (routers[i] == address(0)) continue;
            try IUniswapV2Router(routers[i]).getAmountsOut(amountIn, _asPath(tokenIn, tokenOut)) returns (uint[] memory amounts) {
                if (amounts[amounts.length - 1] > bestAmountOut) {
                    bestAmountOut = amounts[amounts.length - 1];
                    bestRouter = routers[i];
                }
            } catch {}
        }
    }

    function swap(address tokenIn, address tokenOut, uint amountIn, uint amountOutMin, address to) 
        external 
        returns (uint amountOut) 
    {
        (uint bestOut, address bestRouter) = this.getBestQuote(tokenIn, tokenOut, amountIn);
        require(bestRouter != address(0), "No liquidity");

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);
        IERC20(tokenIn).approve(bestRouter, amountIn);

        uint fee = (amountIn * 10) / 100; // 10% fee (adjustable)
        if (fee > 0) {
            IERC20(tokenIn).transfer(feeCollector, fee);
            amountIn -= fee;
        }

        uint[] memory amounts = IUniswapV2Router(bestRouter).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            _asPath(tokenIn, tokenOut),
            to,
            block.timestamp + 300
        );

        amountOut = amounts[amounts.length - 1];
    }

    function _asPath(address tokenIn, address tokenOut) internal pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;
    }
}