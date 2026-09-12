// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IDepthOracle
/// @notice Read side of a shoalfi snapshot posted on-chain by a keeper.
/// @dev ROADMAP. Nothing in this file is deployed. shoalfi today is an off-chain API;
///      this interface describes how its `sellable_depth_usd` field would be consumed
///      by a lending protocol once a signed snapshot feed exists.
interface IDepthOracle {
    /// @return USD value (18 decimals) of `token` that can be sold on Uniswap v3
    ///         before its price falls by the configured slippage (10% by default).
    function sellableDepthUsd(address token) external view returns (uint256);

    /// @return Unix timestamp of the snapshot behind `sellableDepthUsd`, 0 if never posted.
    function updatedAt(address token) external view returns (uint256);
}

/// @title CapSteward
/// @notice Turns a liquidity-depth snapshot into the maximum USD a market should
///         allow to be borrowed against a collateral token.
/// @dev ROADMAP, not deployed, not audited. A lending protocol's risk module would
///      call `maxBorrowableUsd(token)` before approving a borrow and reject the
///      borrow when the market's total borrows against `token` would exceed it.
contract CapSteward {
    uint256 public constant BPS = 10_000;

    IDepthOracle public immutable oracle;

    /// @notice Share of sellable depth that may be lent against, in basis points (3000 = 30%).
    uint256 public immutable capBps;

    /// @notice Snapshots older than this are treated as missing and the cap becomes 0.
    uint256 public immutable maxStaleness;

    error ZeroOracle();
    error InvalidCapBps(uint256 capBps);

    constructor(IDepthOracle oracle_, uint256 capBps_, uint256 maxStaleness_) {
        if (address(oracle_) == address(0)) revert ZeroOracle();
        if (capBps_ == 0 || capBps_ > BPS) revert InvalidCapBps(capBps_);
        oracle = oracle_;
        capBps = capBps_;
        maxStaleness = maxStaleness_;
    }

    /// @notice Maximum USD (18 decimals) that should be borrowable against `token`.
    ///         Returns 0 when the snapshot is missing or older than `maxStaleness`,
    ///         which fails closed: no fresh depth, no new borrows.
    function maxBorrowableUsd(address token) external view returns (uint256) {
        if (!_fresh(oracle.updatedAt(token))) return 0;
        return (oracle.sellableDepthUsd(token) * capBps) / BPS;
    }

    /// @notice True when `token` has a snapshot no older than `maxStaleness`.
    function isFresh(address token) external view returns (bool) {
        return _fresh(oracle.updatedAt(token));
    }

    function _fresh(uint256 updatedAt) internal view returns (bool) {
        return updatedAt != 0 && block.timestamp <= updatedAt + maxStaleness;
    }
}
