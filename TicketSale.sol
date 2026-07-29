// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ISolarExpressTicket {
    function mintTicket(
        address to,
        uint256 destinationId,
        string memory metadataURI
    ) external returns (uint256);
}

interface IBookingHistory {
    function recordBooking(
        address user,
        uint256 ticketId,
        uint256 destinationId,
        uint256 pricePaid
    ) external;
}

/// @notice Handles pricing and ETH payment for SolarExpress tickets, mints
/// the NFT via SolarExpressTicket, then records the trip in BookingHistory.
/// This is the one contract that ties all three pieces together.
contract TicketSale is Ownable {
    ISolarExpressTicket public immutable ticketContract;
    IBookingHistory public immutable bookingHistory;

    mapping(uint256 => uint256) public destinationPrice; // destinationId => price in wei

    event TicketPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        uint256 indexed destinationId,
        uint256 pricePaid
    );

    /// @param ticketContractAddress The deployed address of SolarExpressTicket.sol
    /// @param bookingHistoryAddress The deployed address of BookingHistory.sol
    constructor(address ticketContractAddress, address bookingHistoryAddress) Ownable(msg.sender) {
        ticketContract = ISolarExpressTicket(ticketContractAddress);
        bookingHistory = IBookingHistory(bookingHistoryAddress);
    }

    function setDestinationPrice(uint256 destinationId, uint256 priceWei) external onlyOwner {
        destinationPrice[destinationId] = priceWei;
    }

    function setDestinationPrices(
        uint256[] calldata destinationIds,
        uint256[] calldata pricesWei
    ) external onlyOwner {
        require(destinationIds.length == pricesWei.length, "Length mismatch");
        for (uint256 i = 0; i < destinationIds.length; i++) {
            destinationPrice[destinationIds[i]] = pricesWei[i];
        }
    }

    /// @notice Buy a ticket: pay exact ETH price, mint the NFT, record history.
    function buyTicket(uint256 destinationId, string memory metadataURI) external payable returns (uint256) {
        uint256 price = destinationPrice[destinationId];
        require(price > 0, "Destination not available");
        require(msg.value == price, "Incorrect ETH amount");

        uint256 tokenId = ticketContract.mintTicket(msg.sender, destinationId, metadataURI);

        bookingHistory.recordBooking(msg.sender, tokenId, destinationId, msg.value);

        emit TicketPurchased(tokenId, msg.sender, destinationId, msg.value);
        return tokenId;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
