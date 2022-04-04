pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MYToken is ERC20 {
    uint public decimal=18;
    uint256 public initialSupply;
    constructor()  ERC20("MyToken", "MYT") {
        initialSupply=100000000*10**decimal;
        _mint(msg.sender, initialSupply);
    }
}