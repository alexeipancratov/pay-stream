// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentRouter {
    mapping(bytes32 => bool) public usedInvoices;

    event PaymentReceived(
        bytes32 indexed invoiceId,
        address indexed merchant,
        address indexed payer,
        address token,
        uint256 amount,
        uint256 timestamp
    );

    function pay(
        address token,
        address merchant,
        uint256 amount,
        bytes32 invoiceId,
        uint256 expiresAt
    ) external {
        require(block.timestamp <= expiresAt, "PaymentRouter: invoice has expired");
        require(!usedInvoices[invoiceId], "PaymentRouter: invoice has already been used");
        require(merchant != address(0), "PaymentRouter: merchant cannot be zero address");
        require(amount > 0, "PaymentRouter: amount must be greater than zero");

        usedInvoices[invoiceId] = true;

        IERC20(token).transferFrom(msg.sender, merchant, amount);

        emit PaymentReceived(invoiceId, merchant, msg.sender, token, amount, block.timestamp);
    }
}
