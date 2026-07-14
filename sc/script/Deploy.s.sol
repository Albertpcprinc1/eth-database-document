// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {DocumentRegistry} from "../src/DocumentRegistry.sol";

/// @title Deploy
/// @notice Deploys DocumentRegistry to the configured Ethereum network.
contract Deploy is Script {
    function run() external returns (DocumentRegistry registry) {
        vm.startBroadcast();

        registry = new DocumentRegistry();

        vm.stopBroadcast();

        console2.log("DocumentRegistry deployed at:", address(registry));
    }
}
