// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IAuctionPlatform {
    function bid(uint256 _auctionId) external payable;
}

contract Rejector {
    // Rejects any incoming ETH
    receive() external payable {
        revert("Rejecting ETH");
    }

    function fund() external payable {}

    function bid(address _platform, uint256 _auctionId, uint256 _amount) external {
        IAuctionPlatform(_platform).bid{value: _amount}(_auctionId);
    }

    function withdrawAll(address _platform) external {
        (bool success, ) = _platform.call(abi.encodeWithSignature("withdrawAll()"));
        require(success, "WithdrawAll failed");
    }
}
