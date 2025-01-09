// SPDX-License-Identifier: MIT
pragma solidity 0.8.25;

import {Script, console} from "forge-std/Script.sol";
import {GasStationFactory} from "../src/gas-station/mainnet/GasStationFactory.sol";

contract DeployGasStation is Script {
    function run() external returns (GasStationFactory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address admin = vm.envAddress("ADMIN_ADDRESS");
        address gasStation = vm.envAddress("GAS_STATION_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        GasStationFactory factory = new GasStationFactory(admin, gasStation);

        vm.stopBroadcast();

        console.log("GasStationFactory deployed to:", address(factory));
        console.log("Admin address:", admin);
        console.log("Gas Station address:", gasStation);

        return factory;
    }
}
