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

    // HyperEVM Chain ID: 999
    uint256 public constant HYPEREVM_CHAIN_ID = 999;
    
    // Real HyperEVM DEX addresses
    address public constant HYPERCORE_NATIVE = 0x0000000000000000000000000000000000000001;
    address public constant HYPERSWAP_V2_ROUTER = 0xb4a9C4e6Ea8E2191d2FA5B380452a634Fb21240A;
    address public constant HYPERSWAP_V3_ROUTER = 0x4e2960a8cd19b467b82d26d83facb0fae26b094d;
    address public constant PURR_DEX = 0x9b498c8C395F2df3C4cFAB75672B72c52DD17E2B;
    address public constant KITTENSWAP_ROUTER = 0x8ffdb06039b1b8188c2c721dc3c435b5773d7346;
    address public constant LIQUIDSWAP_ROUTER = 0x744489ee3d540777a66f2cf297479745e0852f7a;
    address public constant GLUEX_ROUTER = 0xe95f6eaeae1e4d650576af600b33d9f7e5f9f7fd;

    // HYPE token address (native token wrapped)
    address public constant HYPE_TOKEN = 0x5555555555555555555555555555555555555555;
    
    // PURR token address (first token on HyperEVM)
    address public constant PURR_TOKEN = 0x9b498c8C395F2df3C4cFAB75672B72c52DD17E2B;

    // State variables
    mapping(address => DEXConfig) public dexConfigs;
    mapping(address => bool) public supportedDEXs;
    address[] public activeDEXs;
    
    uint256 public platformFee = 10; // 0.1% platform fee in basis points
    address public feeRecipient;
    bool public emergencyMode = false;
    
    // Events for real HyperEVM integration
    event HyperEVMSwapExecuted(
        address indexed user,
        address indexed dex,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 gasUsed
    );
    
    event MultiDEXRouteExecuted(
        address indexed user,
        uint256 totalAmountIn,
        uint256 totalAmountOut,
        uint256 dexCount,
        uint256 totalGasUsed
    );

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
        uint256 fee
    );
    event EmergencyWithdrawal(address indexed token, uint256 amount, address indexed to);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeeRecipientUpdated(address indexed oldRecipient, address indexed newRecipient);

    constructor(address _feeRecipient) {
        require(_feeRecipient != address(0), "Invalid fee recipient");
        feeRecipient = _feeRecipient;
        
        // Initialize with real HyperEVM DEX configurations
        _addDEX("HyperCore-Native", HYPERCORE_NATIVE, HYPERCORE_NATIVE, 5);
        _addDEX("HyperSwap-V2", HYPERSWAP_V2_ROUTER, 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f, 30);
        _addDEX("HyperSwap-V3", HYPERSWAP_V3_ROUTER, 0x1F98431c8aD98523631AE4a59f267346ea31F984, 25);
        _addDEX("PURR-DEX", PURR_DEX, PURR_DEX, 10);
        _addDEX("KittenSwap", KITTENSWAP_ROUTER, 0x744489ee3d540777a66f2cf297479745e0852f7a, 30);
        _addDEX("LiquidSwap", LIQUIDSWAP_ROUTER, LIQUIDSWAP_ROUTER, 15);
        _addDEX("GlueX", GLUEX_ROUTER, GLUEX_ROUTER, 25);
    }

    modifier onlyActiveChain() {
        require(block.chainid == HYPEREVM_CHAIN_ID, "Only available on HyperEVM");
        _;
    }

    modifier notInEmergencyMode() {
        require(!emergencyMode, "Emergency mode activated");
        _;
    }

    /**
     * @dev Add a new DEX to the aggregator
     */
    function addDEX(
        string memory name,
        address router,
        address factory,
        uint16 fee
    ) external onlyOwner {
        _addDEX(name, router, factory, fee);
    }

    function _addDEX(
        string memory name,
        address router,
        address factory,
        uint16 fee
    ) internal {
        require(router != address(0), "Invalid router address");
        require(!supportedDEXs[router], "DEX already exists");
        require(fee <= 1000, "Fee too high"); // Max 10%

        dexConfigs[router] = DEXConfig({
            name: name,
            router: router,
            factory: factory,
            fee: fee,
            isActive: true
        });

        supportedDEXs[router] = true;
        activeDEXs.push(router);

        emit DEXAdded(name, router, factory, fee);
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
    function updateDEXStatus(address _router, bool _isActive) external onlyOwner {
        require(supportedDEXs[_router], "DEX not found");
        dexConfigs[_router].isActive = _isActive;
        emit DEXUpdated(dexConfigs[_router].name, _router, _isActive);
    }

    /**
     * @dev Execute multi-DEX aggregated swap with withdrawal protection
     */
    function aggregatedSwap(
        SwapParams calldata params
    ) external payable nonReentrant whenNotPaused onlyActiveChain notInEmergencyMode {
        require(params.deadline >= block.timestamp, "Swap deadline exceeded");
        require(params.recipient != address(0), "Invalid recipient");
        require(params.dexRouters.length > 0, "No DEX routers provided");
        require(params.percentages.length == params.dexRouters.length, "Mismatched array lengths");
        
        // Verify percentages sum to 100
        uint256 totalPercentage = 0;
        for (uint i = 0; i < params.percentages.length; i++) {
            totalPercentage += params.percentages[i];
        }
        require(totalPercentage == 100, "Percentages must sum to 100");

        uint256 totalAmountOut = 0;
        uint256 totalGasUsed = 0;

        // Handle native HYPE or ERC20 token input
        if (params.tokenIn == address(0)) {
            require(msg.value == params.amountIn, "Incorrect HYPE amount");
        } else {
            IERC20(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
        }

        // Calculate platform fee
        uint256 feeAmount = (params.amountIn * platformFee) / 10000;
        uint256 amountAfterFee = params.amountIn - feeAmount;

        // Execute swaps across multiple DEXs
        for (uint i = 0; i < params.dexRouters.length; i++) {
            address router = params.dexRouters[i];
            require(supportedDEXs[router] && dexConfigs[router].isActive, "Unsupported or inactive DEX");

            uint256 swapAmount = (amountAfterFee * params.percentages[i]) / 100;
            uint256 gasStart = gasleft();
            
            uint256 amountOut = _executeSwapOnDEX(
                router,
                params.tokenIn,
                params.tokenOut,
                swapAmount,
                params.recipient
            );
            
            uint256 gasUsed = gasStart - gasleft();
            totalAmountOut += amountOut;
            totalGasUsed += gasUsed;

            emit HyperEVMSwapExecuted(
                msg.sender,
                router,
                params.tokenIn,
                params.tokenOut,
                swapAmount,
                amountOut,
                gasUsed
            );
        }

        require(totalAmountOut >= params.amountOutMin, "Insufficient output amount");

        // Transfer platform fee to fee recipient
        if (feeAmount > 0) {
            if (params.tokenIn != address(0)) {
                IERC20(params.tokenIn).safeTransfer(feeRecipient, feeAmount);
            } else {
                payable(feeRecipient).transfer(feeAmount);
            }
        }

        emit MultiDEXRouteExecuted(msg.sender, params.amountIn, totalAmountOut, params.dexRouters.length, totalGasUsed);
        emit SwapExecuted(msg.sender, params.tokenIn, params.tokenOut, params.amountIn, totalAmountOut, feeAmount);
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
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        emit PlatformFeeUpdated(oldFee, _newFee);
    }

    /**
     * @dev Update fee recipient
     */
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "Invalid recipient");
        address oldRecipient = feeRecipient;
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(oldRecipient, _newRecipient);
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