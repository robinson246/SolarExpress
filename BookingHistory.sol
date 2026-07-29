// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Records a persistent, queryable booking history per user, separate
/// from the NFT ticket contract itself. Written to by TicketSale at the
/// moment of purchase, so history stays accurate even if a ticket NFT is
/// later transferred or resold (ownership of the NFT can change hands, but
/// the historical fact "this address booked this trip" should not).
contract BookingHistory is Ownable {
    struct Booking {
        uint256 ticketId;       // matches the tokenId minted in SolarExpressTicket
        uint256 destinationId;
        uint256 pricePaid;
        uint256 timestamp;
    }

    // The one contract allowed to record bookings (set to TicketSale's address)
    address public saleContract;

    mapping(address => Booking[]) private _bookingsByUser;
    mapping(address => uint256) public tripCount;

    event BookingRecorded(
        address indexed user,
        uint256 indexed ticketId,
        uint256 indexed destinationId,
        uint256 pricePaid,
        uint256 timestamp
    );

    constructor() Ownable(msg.sender) {}

    modifier onlySaleContract() {
        require(msg.sender == saleContract, "Only the sale contract can record bookings");
        _;
    }

    /// @notice Set which TicketSale contract is allowed to record bookings.
    function setSaleContract(address _saleContract) external onlyOwner {
        saleContract = _saleContract;
    }

    /// @notice Record a completed booking. Called by TicketSale right after
    /// a successful purchase/mint.
    function recordBooking(
        address user,
        uint256 ticketId,
        uint256 destinationId,
        uint256 pricePaid
    ) external onlySaleContract {
        _bookingsByUser[user].push(Booking({
            ticketId: ticketId,
            destinationId: destinationId,
            pricePaid: pricePaid,
            timestamp: block.timestamp
        }));
        tripCount[user]++;

        emit BookingRecorded(user, ticketId, destinationId, pricePaid, block.timestamp);
    }

    /// @notice Get a user's full booking history.
    function getBookings(address user) external view returns (Booking[] memory) {
        return _bookingsByUser[user];
    }

    /// @notice Get a single booking by index (cheaper than returning the
    /// whole array if the frontend just needs one entry).
    function getBooking(address user, uint256 index) external view returns (Booking memory) {
        require(index < _bookingsByUser[user].length, "Index out of range");
        return _bookingsByUser[user][index];
    }
}
