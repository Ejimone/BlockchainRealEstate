// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";



contract RealEstate is ERC721, Ownable {
    struct Property {
        uint256 price;
        address payable seller;
        string location;
        bytes32 description;
        bool isListed;
        bool isSold;
        address payable buyer;
        uint256 offerAmount;
        bool isInspectionPassed;
        bool FinancingApproved;
        
    }


    uint256 private _propertyIdCounter;


    constructor() ERC721("RealEstateNFT", "RENFT") Ownable(msg.sender) {
        _propertyIdCounter = 0;
    }
}