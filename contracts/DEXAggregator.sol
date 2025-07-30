// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title HyperEVM DEX Aggregator
 * @dev Multi-DEX aggregator for optimal token swaps on HyperEVM with emergency withdrawal functionality
 */
contract DEXAggregator is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    struct DEXConfig {
        string name;
        address router;
        address factory;
        uint16 fee; // in basis points
        bool isActive;
    }

    struct SwapParams {
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        address[] dexRouters; // Routers to aggregate across
        uint256[] percentages; // Percentage split across routers (must sum to 100)
        address recipient;
        uint256 deadline;
    }

    struct Quote {
        address dex;
        uint256 amountOut;
        uint256 gasEstimate;
        bytes swapData;
    }

    // Events
    event DEXAdded(string name, address router, address factory, uint16 fee);
    event DEXRemoved(string name, address router);
    event DEXUpdated(string name, address router, bool isActive);
    event SwapExecuted(
        address indexed user,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 feeCollected
    );
    event EmergencyWithdrawal(address indexed token, uint256 amount, address to);
    event FeeUpdated(uint256 newFee);

    // State variables
    mapping(address => DEXConfig) public dexConfigs;
    address[] public activeDEXs;
    
    uint256 public platformFee = 50; // 0.5% in basis points
    uint256 public constant MAX_FEE = 300; // 3% maximum fee
    address public feeRecipient;
    
    // Emergency controls
    bool public emergencyMode = false;
    
    // Supported DEX interfaces
    mapping(address => bool) public supportedDEXs;

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
    }

    // Modifiers
    modifier onlyWhenNotEmergency() {
        require(!emergencyMode, "Emergency mode activated");
        _;
    }

    modifier validDEX(address _router) {
        require(supportedDEXs[_router], "DEX not supported");
        _;
    }

    /**
     * @dev Add a new DEX to the aggregator
     */
    function addDEX(
        string memory _name,
        address _router,
        address _factory,
        uint16 _fee
    ) external onlyOwner {
        require(_router != address(0), "Invalid router address");
        require(_factory != address(0), "Invalid factory address");
        require(_fee <= 10000, "Fee too high"); // Max 100%
        
        dexConfigs[_router] = DEXConfig({
            name: _name,
            router: _router,
            factory: _factory,
            fee: _fee,
            isActive: true
        });
        
        supportedDEXs[_router] = true;
        activeDEXs.push(_router);
        
        emit DEXAdded(_name, _router, _factory, _fee);
    }

    /**
     * @dev Remove a DEX from the aggregator
     */
    function removeDEX(address _router) external onlyOwner {
        require(supportedDEXs[_router], "DEX not found");
        
        string memory name = dexConfigs[_router].name;
        delete dexConfigs[_router];
        supportedDEXs[_router] = false;
        
        // Remove from active DEXs array
        for (uint i = 0; i < activeDEXs.length; i++) {
            if (activeDEXs[i] == _router) {
                activeDEXs[i] = activeDEXs[activeDEXs.length - 1];
                activeDEXs.pop();
                break;
            }
        }
        
        emit DEXRemoved(name, _router);
    }

    /**
     * @dev Update DEX status
     */
    function updateDEXStatus(address _router, bool _isActive) external onlyOwner validDEX(_router) {
        dexConfigs[_router].isActive = _isActive;
        emit DEXUpdated(dexConfigs[_router].name, _router, _isActive);
    }

    /**
     * @dev Execute aggregated swap across multiple DEXs
     */
    function executeAggregatedSwap(
        SwapParams calldata params
    ) external payable nonReentrant whenNotPaused onlyWhenNotEmergency returns (uint256 totalAmountOut) {
        require(params.deadline >= block.timestamp, "Swap expired");
        require(params.dexRouters.length == params.percentages.length, "Mismatched arrays");
        require(params.amountIn > 0, "Invalid amount");
        
        // Validate percentages sum to 100
        uint256 totalPercentage = 0;
        for (uint i = 0; i < params.percentages.length; i++) {
            totalPercentage += params.percentages[i];
            require(supportedDEXs[params.dexRouters[i]], "Unsupported DEX");
            require(dexConfigs[params.dexRouters[i]].isActive, "DEX inactive");
        }
        require(totalPercentage == 100, "Percentages must sum to 100");

        // Transfer tokens from user
        if (params.tokenIn != address(0)) {
            IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
        } else {
            require(msg.value == params.amountIn, "Incorrect ETH amount");
        }

        // Calculate platform fee
        uint256 feeAmount = (params.amountIn * platformFee) / 10000;
        uint256 amountAfterFee = params.amountIn - feeAmount;

        // Execute swaps across multiple DEXs
        for (uint i = 0; i < params.dexRouters.length; i++) {
            uint256 swapAmount = (amountAfterFee * params.percentages[i]) / 100;
            if (swapAmount > 0) {
                uint256 amountOut = _executeSwapOnDEX(
                    params.dexRouters[i],
                    params.tokenIn,
                    params.tokenOut,
                    swapAmount,
                    address(this)
                );
                totalAmountOut += amountOut;
            }
        }

        require(totalAmountOut >= params.amountOutMin, "Insufficient output amount");

        // Transfer output tokens to recipient
        if (params.tokenOut != address(0)) {
            IERC20(params.tokenOut).safeTransfer(params.recipient, totalAmountOut);
        } else {
            payable(params.recipient).transfer(totalAmountOut);
        }

        // Transfer fee to fee recipient
        if (feeAmount > 0) {
            if (params.tokenIn != address(0)) {
                IERC20(params.tokenIn).safeTransfer(feeRecipient, feeAmount);
            } else {
                payable(feeRecipient).transfer(feeAmount);
            }
        }

        emit SwapExecuted(
            msg.sender,
            params.tokenIn,
            params.tokenOut,
            params.amountIn,
            totalAmountOut,
            feeAmount
        );
    }

    /**
     * @dev Get quote from multiple DEXs
     */
    function getMultiDEXQuote(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address[] calldata routers
    ) external view returns (Quote[] memory quotes) {
        quotes = new Quote[](routers.length);
        
        for (uint i = 0; i < routers.length; i++) {
            if (supportedDEXs[routers[i]] && dexConfigs[routers[i]].isActive) {
                // This would call the specific DEX's quote function
                // Implementation depends on each DEX's interface
                quotes[i] = Quote({
                    dex: routers[i],
                    amountOut: _getQuoteFromDEX(routers[i], tokenIn, tokenOut, amountIn),
                    gasEstimate: _estimateGas(routers[i]),
                    swapData: ""
                });
            }
        }
    }

    /**
     * @dev Emergency withdrawal function - only owner can call
     */
    function emergencyWithdraw(
        address token,
        uint256 amount,
        address to
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        
        if (token == address(0)) {
            // Withdraw ETH
            require(address(this).balance >= amount, "Insufficient ETH balance");
            payable(to).transfer(amount);
        } else {
            // Withdraw ERC20 token
            IERC20 tokenContract = IERC20(token);
            require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient token balance");
            tokenContract.safeTransfer(to, amount);
        }
        
        emit EmergencyWithdrawal(token, amount, to);
    }

    /**
     * @dev Emergency withdrawal of all funds
     */
    function emergencyWithdrawAll(address to) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        
        // Withdraw all ETH
        uint256 ethBalance = address(this).balance;
        if (ethBalance > 0) {
            payable(to).transfer(ethBalance);
            emit EmergencyWithdrawal(address(0), ethBalance, to);
        }
    }

    /**
     * @dev Activate emergency mode - stops all swaps
     */
    function activateEmergencyMode() external onlyOwner {
        emergencyMode = true;
        _pause();
    }

    /**
     * @dev Deactivate emergency mode
     */
    function deactivateEmergencyMode() external onlyOwner {
        emergencyMode = false;
        _unpause();
    }

    /**
     * @dev Update platform fee
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_FEE, "Fee too high");
        platformFee = _newFee;
        emit FeeUpdated(_newFee);
    }

    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        feeRecipient = _newRecipient;
    }

    // Internal functions
    function _executeSwapOnDEX(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        address to
    ) internal returns (uint256 amountOut) {
        // This would implement the actual swap logic for each DEX type
        // Implementation depends on the specific DEX interface (Uniswap V2/V3, etc.)
        // For now, this is a placeholder that would be implemented based on real DEX contracts
        
        // Example for Uniswap V2 style:
        if (tokenIn != address(0)) {
            IERC20(tokenIn).safeApprove(router, amountIn);
        }
        
        // Call the appropriate swap function based on DEX type
        // This would be implemented based on actual DEX contracts deployed on HyperEVM
        
        return amountIn; // Placeholder return
    }

    function _getQuoteFromDEX(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        // Implementation for getting quotes from specific DEX
        // Would call the DEX's getAmountsOut or similar function
        return amountIn; // Placeholder
    }

    function _estimateGas(address router) internal pure returns (uint256) {
        // Gas estimation logic
        return 150000; // Placeholder
    }

    // View functions
    function getActiveDEXs() external view returns (address[] memory) {
        return activeDEXs;
    }

    function getDEXConfig(address router) external view returns (DEXConfig memory) {
        return dexConfigs[router];
    }

    function getPlatformFee() external view returns (uint256) {
        return platformFee;
    }

    // Fallback to receive ETH
    receive() external payable {}
}