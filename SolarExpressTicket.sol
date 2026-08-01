// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.4.0
pragma solidity ^0.8.27;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Pure NFT contract for SolarExpress tickets.
/// Holds no pricing/payment logic -- that lives in TicketSale.sol.
/// Only the approved TicketSale contract (or the owner, for setup) can mint.
contract SolarExpressTicket is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;

    // The one contract allowed to call mintTicket (set after both are deployed)
    address public saleContract;

    struct TicketData {
        uint256 destinationId;
        uint256 timestamp;
    }

    mapping(uint256 => TicketData) public tickets; // tokenId => TicketData

    event TicketMinted(uint256 indexed tokenId, address indexed buyer, uint256 indexed destinationId);

    constructor() ERC721("SolarExpress Ticket", "SXT") Ownable(msg.sender) {}

    modifier onlySaleContract() {
        require(msg.sender == saleContract, "Only the sale contract can mint");
        _;
    }

    /// @notice Set which TicketSale contract is allowed to mint. Call once after
    /// deploying TicketSale.sol, passing its deployed address.
    function setSaleContract(address _saleContract) external onlyOwner {
        saleContract = _saleContract;
    }

    /// @notice Mint a new ticket NFT. Only callable by the approved sale contract.
    function mintTicket(
        address to,
        uint256 destinationId,
        string memory metadataURI
    ) external onlySaleContract returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        tickets[tokenId] = TicketData({
            destinationId: destinationId,
            timestamp: block.timestamp
        });

        emit TicketMinted(tokenId, to, destinationId);
        return tokenId;
    }

    /// @notice Update the metadata URI of an existing ticket (e.g. to fix a broken image).
    /// @param tokenId The ticket token ID to update.
    /// @param metadataURI New metadata URI (e.g. a Pinata gateway URL).
    function setTokenURI(uint256 tokenId, string memory metadataURI) external onlyOwner {
        _setTokenURI(tokenId, metadataURI);
        emit MetadataUpdate(tokenId);
    }

    // --- Required overrides for ERC721URIStorage ---
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
