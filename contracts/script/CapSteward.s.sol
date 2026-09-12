// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {CapSteward, IDepthOracle} from "../src/CapSteward.sol";

/// @notice Roadmap deploy script. Not run for the hackathon submission; there is
///         no on-chain depth oracle yet. Usage once one exists:
///
///   DEPTH_ORACLE=0x... forge script script/CapSteward.s.sol --rpc-url $RPC --broadcast
contract DeployCapSteward is Script {
    function run() external returns (CapSteward steward) {
        address oracle = vm.envAddress("DEPTH_ORACLE");
        vm.startBroadcast();
        steward = new CapSteward(IDepthOracle(oracle), 3000, 15 minutes);
        vm.stopBroadcast();
    }
}
