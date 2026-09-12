// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CapSteward, IDepthOracle} from "../src/CapSteward.sol";

contract MockDepthOracle is IDepthOracle {
    struct Snapshot {
        uint256 depthUsd;
        uint256 updatedAt;
    }

    mapping(address => Snapshot) internal snapshots;

    function set(address token, uint256 depthUsd, uint256 updatedAt_) external {
        snapshots[token] = Snapshot(depthUsd, updatedAt_);
    }

    function sellableDepthUsd(address token) external view returns (uint256) {
        return snapshots[token].depthUsd;
    }

    function updatedAt(address token) external view returns (uint256) {
        return snapshots[token].updatedAt;
    }
}

contract CapStewardTest is Test {
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    uint256 constant CAP_BPS = 3000;
    uint256 constant STALENESS = 15 minutes;

    MockDepthOracle oracle;
    CapSteward steward;

    function setUp() public {
        vm.warp(1_760_000_000);
        oracle = new MockDepthOracle();
        steward = new CapSteward(oracle, CAP_BPS, STALENESS);
    }

    function test_FreshSnapshotReturnsThirtyPercent() public {
        oracle.set(WETH, 1_000_000e18, block.timestamp);
        assertEq(steward.maxBorrowableUsd(WETH), 300_000e18);
        assertTrue(steward.isFresh(WETH));
    }

    function test_ExactlyMaxStalenessIsStillFresh() public {
        oracle.set(WETH, 1_000_000e18, block.timestamp);
        vm.warp(block.timestamp + STALENESS);
        assertEq(steward.maxBorrowableUsd(WETH), 300_000e18);
        assertTrue(steward.isFresh(WETH));
    }

    function test_StaleSnapshotReturnsZero() public {
        oracle.set(WETH, 1_000_000e18, block.timestamp);
        vm.warp(block.timestamp + STALENESS + 1);
        assertEq(steward.maxBorrowableUsd(WETH), 0);
        assertFalse(steward.isFresh(WETH));
    }

    function test_UnpublishedTokenReturnsZero() public view {
        address unknown = address(0xBEEF);
        assertEq(steward.maxBorrowableUsd(unknown), 0);
        assertFalse(steward.isFresh(unknown));
    }

    function test_RevertsOnZeroOracle() public {
        vm.expectRevert(CapSteward.ZeroOracle.selector);
        new CapSteward(IDepthOracle(address(0)), CAP_BPS, STALENESS);
    }

    function test_RevertsOnZeroCap() public {
        vm.expectRevert(abi.encodeWithSelector(CapSteward.InvalidCapBps.selector, 0));
        new CapSteward(oracle, 0, STALENESS);
    }

    function test_RevertsOnCapAboveOneHundredPercent() public {
        vm.expectRevert(abi.encodeWithSelector(CapSteward.InvalidCapBps.selector, 10_001));
        new CapSteward(oracle, 10_001, STALENESS);
    }

    function testFuzz_CapIsProportionalToDepth(uint128 depthUsd) public {
        oracle.set(WETH, depthUsd, block.timestamp);
        assertEq(steward.maxBorrowableUsd(WETH), (uint256(depthUsd) * CAP_BPS) / 10_000);
    }

    function testFuzz_FutureTimestampsAreFresh(uint32 ahead) public {
        oracle.set(WETH, 1e18, block.timestamp + ahead);
        assertTrue(steward.isFresh(WETH));
    }
}
