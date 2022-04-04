// const { inputToConfig } = require("@ethereum-waffle/compiler");
// const chai = require("chai");
// const { solidity } = require("ethereum-waffle");
// chai.use(solidity);
// const expect = chai.expect;
// const { ethers, upgrades } = require("hardhat");
// describe("Rentals Test",function(){
//     let RentalContract;
//     let ERC1155TokenContract;
//     let deployer;

//     beforeEach(async()=>{
//         [deployer] = await ethers.getSigners();
//         const ERC1155Token = await ethers.getContractFactory("ERC1155Token");
//         ERC1155TokenContract = await ERC1155Token.deploy();
//         ERC1155TokenContract = await ERC1155TokenContract.deployed();
//         const Rentals = await ethers.getContractFactory("Rentals");
//         RentalContract = await upgrades.deployProxy(Rentals);
//         RentalContract = await RentalContract.deployed();
//     });

//     describe("",function(){
//         it("",async()=>{

//         });
//     })
// })