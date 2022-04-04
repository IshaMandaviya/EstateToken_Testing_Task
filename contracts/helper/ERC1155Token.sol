// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

contract ERC1155Token is ERC1155,  ERC1155Burnable {


    constructor() ERC1155("") {
        mint(1,10000000000000000,"");
    }

    function setURI(string memory newuri) public  {
        _setURI(newuri);
    }

    function mint( uint256 id, uint256 amount, string memory newuri)
        public
        
    {
        _mint(msg.sender, id, amount, "");
        _setURI(newuri);
    }

    function mintBatch(uint256[] memory ids, uint256[] memory amounts, string memory newuri)
        public
        
    {
        _mintBatch(msg.sender, ids, amounts, "");
        _setURI(newuri);
    }
}