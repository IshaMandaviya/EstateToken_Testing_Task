// const { inputToConfig } = require("@ethereum-waffle/compiler");
// const chai = require("chai");
// const { solidity } = require("ethereum-waffle");
// chai.use(solidity);
// const expect = chai.expect;
// const { ethers } = require("hardhat");

// describe("Deed Token Tests", function () {

//     let DeedContract;
//     let ERC20TokenContract;
//     let deployer;
//     let SecondAccount;
//     let thirdAccount;
//     let ERC20Account;
//     let MogulPayout;
//     let maxSupply = 200000;
//     let legaldoc = 'This is legal doc';
//     let propertydoc = 'This is property doc';
//     let propertyPrice = 200000;
//     let propertyOwnerRetains = 2000;
//     //let estateId = 0;
//     let platformFees = 100000;

//     beforeEach(async () => {
//         [deployer, SecondAccount, thirdAccount, propertyOwner, MogulPayout, ERC20Account] = await ethers.getSigners();
//         const ERC20Token = await ethers.getContractFactory("MYToken");
//         ERC20TokenContract = await ERC20Token.connect(ERC20Account).deploy();
//         ERC20TokenContract = await ERC20TokenContract.deployed();
//         const DeedToken = await ethers.getContractFactory("Deed");
//         DeedContract = await upgrades.deployProxy(DeedToken);
//         DeedContract = await DeedContract.deployed();
//         await ERC20TokenContract.connect(ERC20Account).transfer(propertyOwner.address, 100000);
//         await DeedContract.connect(deployer).setERC20Address(ERC20TokenContract.address);
//         await DeedContract.connect(deployer).setPlatformFees(platformFees);
//         await DeedContract.connect(deployer).setMogulPayoutAddress(MogulPayout.address);
//     });

//     describe("initiateAgreement Test", function () {
//         it("User other than Owner can not call this Function", async () => {
//             // Check For The Owner(revert - caller is not the owner )
//             await expect(DeedContract.connect(SecondAccount).initiateAgreement(propertyOwner.address, maxSupply, legaldoc)).to.be.revertedWith('Ownable: caller is not the owner');
//         });

//         it("initiateAgreement by the owner", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             expect((await DeedContract.getAgreement(estateId))[1]).to.equal(legaldoc);
//             expect((await DeedContract.getAgreement(estateId))[10]).to.equal(maxSupply);
//             expect((await DeedContract.getAgreement(estateId))[11]).to.equal(propertyOwner.address);
//             expect((await DeedContract.getAgreement(estateId))[14]).to.equal(true);
//         });
//     });

//     describe("enterPropertyDetails Test", function () {
//         it("User other than Property Owner can not call this Function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             // Check For The Property Owner(revert - caller is not the Property owner )
//             await expect(DeedContract.connect(SecondAccount).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains)).to.be.revertedWith("Message sender / agreement signer should be property owner");
//         });

//         it("enterPropertyDetails by the property owner", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             expect((await DeedContract.getAgreement(estateId))[2]).to.equal(propertydoc);
//             expect((await DeedContract.getAgreement(estateId))[3]).to.equal(propertyPrice);
//             expect((await DeedContract.getAgreement(estateId))[8]).to.equal(propertyOwnerRetains);
//         });

//         it("propertyOwnerRetains should be less then 100%", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await expect(DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, 15000)).to.be.revertedWith("Property owner retains should be less than 100 %");
//         });
//     });

//     describe("signByPropertyOwner Test", function () {
//         it("User other than Property Owner can not call this Function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             // Check For The Property Owner(revert - caller is not the Property owner )
//             await expect(DeedContract.connect(SecondAccount).signByPropertyOwner(estateId)).to.be.revertedWith("Message sender / agreement signer should be property owner");
//         });

//         it("sign  By Property Owner", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             expect((await DeedContract.getAgreement(estateId))[12]).to.equal(true);
//         });

//         it("Property Owner can not sign completed deed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(propertyOwner).signByPropertyOwner(estateId)).to.be.revertedWith("Deed is already completed");

//         });

//     });

//     describe("signByMogul Test", function () {
//         it("User other than Owner can not call this Function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             // Check For The  Owner(revert - caller is not the  owner )
//             await expect(DeedContract.connect(SecondAccount).signByMogul(estateId)).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("sign Mogul By Property Owner", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             expect((await DeedContract.getAgreement(estateId))[13]).to.equal(true);
//         });
//         it("Mogul can not sign completed deed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees)
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(deployer).signByMogul(estateId)).to.be.revertedWith("Deed is already completed");

//         });

//     });
//     describe("setMogulPayoutAddress Test", function () {
//         it("User other than Owner can not call this Function", async () => {
//             // Check For The  Owner(revert - caller is not the  owner )
//             await expect(DeedContract.connect(SecondAccount).setMogulPayoutAddress(MogulPayout.address)).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("setMogulPayoutAddress By  Owner", async () => {
//             await DeedContract.connect(deployer).setMogulPayoutAddress(MogulPayout.address);
//         });
//     });

//     describe("setPlatformFees Test", function () {
//         it("User other than Owner can not call this Function", async () => {
//             // Check For The  Owner(revert - caller is not the  owner )
//             await expect(DeedContract.connect(SecondAccount).setPlatformFees(platformFees)).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("setPlatformFees By  Owner", async () => {
//             await DeedContract.connect(deployer).setPlatformFees(platformFees);
//         });
//     });

//     describe("setERC20Address Test", function () {
//         it("User other than Owner can not call this Function", async () => {
//             // Check For The  Owner(revert - caller is not the  owner )
//             await expect(DeedContract.connect(SecondAccount).setERC20Address(ERC20TokenContract.address)).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("setERC20Address By  Owner", async () => {
//             await DeedContract.connect(deployer).setERC20Address(ERC20TokenContract.address);
//         });
//     });

//     describe("updatePriceByPropertyOwner() Tests", function() {

//         it("User other than Property owner can not call this function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(SecondAccount).updatePriceByPropertyOwner(estateId, propertyPrice + 100000)).to.be.revertedWith("Message sender / agreement signer should be property owner");
//         });

//         it("Only Property owner can update the price of the property", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             const newPrice = propertyPrice + 100000;
//             await DeedContract.connect(propertyOwner).updatePriceByPropertyOwner(estateId, newPrice);
//             expect((await DeedContract.getAgreement(estateId))[3]).to.equal(newPrice);
//             expect((await DeedContract.getAgreement(estateId))[13]).to.equal(false);
//         });

//         it("Price can be updated for only incomplete deed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(propertyOwner).updatePriceByPropertyOwner(estateId, propertyPrice + 100000)).to.be.revertedWith("Deed is already completed");
//         });
//     });

//     describe("updatePropertyDocByPropertyOwner Tests", function() {

//         it("User other than Property owner can not call this function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(SecondAccount).updatePropertyDocByPropertyOwner(estateId, "<new property doc>")).to.be.revertedWith("Message sender / agreement signer should be property owner");
//         });

//         it("Only Property owner can update the property doc", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await DeedContract.connect(propertyOwner).updatePropertyDocByPropertyOwner(estateId, "<new property doc>");
//             expect((await DeedContract.getAgreement(estateId))[2]).to.equal("<new property doc>");
//             expect((await DeedContract.getAgreement(estateId))[13]).to.equal(false);
//         });

//         it("Property doc can be updated for only incomplete deed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(propertyOwner).updatePropertyDocByPropertyOwner(estateId, "<new property doc>")).to.be.revertedWith("Deed is already completed");
//         });
//     });

//     describe("updatePropertyOwnerRetainsByPropertyOwner Test", function() {

//         it("User other than Property owner can not call this function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(SecondAccount).updatePropertyOwnerRetainsByPropertyOwner(estateId, propertyOwnerRetains + 100)).to.be.revertedWith("Message sender / agreement signer should be property owner");
//         });

//         it("Only Property owner can update the owner retains", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await DeedContract.connect(propertyOwner).updatePropertyOwnerRetainsByPropertyOwner(estateId, propertyOwnerRetains + 100);
//             expect((await DeedContract.getAgreement(estateId))[8]).to.equal(propertyOwnerRetains + 100);
//             expect((await DeedContract.getAgreement(estateId))[13]).to.equal(false);
//         });

//         it("Owner retains can be updated for only incomplete deed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(propertyOwner).updatePropertyOwnerRetainsByPropertyOwner(estateId, propertyOwnerRetains + 100)).to.be.revertedWith("Deed is already completed");
//         });
//     });

//     describe("updatePropertyOwnerByMogul Tests", function() {

//         it("User other than Platform Owner can not call this function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(propertyOwner).updatePropertyOwnerByMogul(estateId, SecondAccount.address)).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("Only platform owner mogul can change the owner of the property", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await DeedContract.connect(deployer).updatePropertyOwnerByMogul(estateId, SecondAccount.address)
//             expect((await DeedContract.getAgreement(estateId))[11]).to.equal(SecondAccount.address);
//         });

//         it("Property owner can be updated for only incomplete deed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(deployer).updatePropertyOwnerByMogul(estateId, SecondAccount.address)).to.be.revertedWith("Deed is already completed");
//         });
//     });

//     describe("updateMaxSupplyByMogul Tests", function() {

//         it("User other than Platform Owner can not call this function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(propertyOwner).updateMaxSupplyByMogul(estateId, maxSupply + 100000)).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("Only platform owner mogul can update the max supply", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await DeedContract.connect(deployer).updateMaxSupplyByMogul(estateId, maxSupply + 100000);
//             expect((await DeedContract.getAgreement(estateId))[10]).to.equal(maxSupply + 100000);
//         });

//         it("max supply can be updated for only incomplete deed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(deployer).updateMaxSupplyByMogul(estateId, maxSupply + 100000)).to.be.revertedWith("Deed is already completed");
//         });
//     });

//     describe("uploadSaleDeedByOwner Tests", function() {

//         it("User other than Platform Owner can not call this function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(propertyOwner).uploadSaleDeedByOwner(estateId, "<sale deed>")).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("sale deed can be uploaded for only completed deeds", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(deployer).uploadSaleDeedByOwner(estateId, "<sale deed>")).to.be.revertedWith("deal is not complete yet !!"); 
//         });

//         it("platform owner can upload sale deed for completed deeds", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await DeedContract.connect(deployer).uploadSaleDeedByOwner(estateId, "<sale deed>");
//             expect((await DeedContract.getAgreement(estateId))[0]).to.equal("<sale deed>");
//         });
//     });

//     describe("transferPlatformFee Tests", function() {
        
//         it("agreement should be signed by the property owner before transfering the platforn fee", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await expect(DeedContract.connect(propertyOwner).transferPlatformFee(estateId)).to.be.revertedWith("Property owner should sign the agreement");
//         });

//         it("agreement should be signed by the mogul before transfering the platforn fee", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await expect(DeedContract.connect(propertyOwner).transferPlatformFee(estateId)).to.be.revertedWith("Mogul should sign the agreement"); 
//         });

//         it("deed contract should be approved with the amount of balance to transfer the platform fees", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(propertyOwner).transferPlatformFee(estateId)).to.be.revertedWith("Contract is not approved to transfer the funds, please increase the allowance.");
//         });

//         it("after payment of transaction fee,  it should  marked as paid", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             expect((await DeedContract.getAgreement(estateId))[15]).to.equal(true);
//             expect(await ERC20TokenContract.balanceOf(MogulPayout.address)).to.equal(platformFees);
//         });

//     });

//     describe("confirmDeedCompletion Tests", function() {

//         it("only owner can call this function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await expect(DeedContract.connect(SecondAccount).confirmDeedCompletion(estateId)).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("agreement should be signed by the property owner before marking the agreement as completed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await expect(DeedContract.connect(deployer).confirmDeedCompletion(estateId)).to.be.revertedWith("Property owner should sign the agreement");
//         });

//         it("agreement should be signed by the mogul before marking the agreement as completed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await expect(DeedContract.connect(deployer).confirmDeedCompletion(estateId)).to.be.revertedWith("Mogul should sign the agreement");
//         });

//         it("agreement can't be marked as completed if the platform fees are not paid", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await expect(DeedContract.connect(deployer).confirmDeedCompletion(estateId)).to.be.revertedWith("Platform fee not paid");
//         });

//         it("completed agreement should be marked as deal completed", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             expect((await DeedContract.getAgreement(estateId))[16]).to.equal(true);
//         });

//     });

//     describe("setPercentage Tests", function() {

//         it("Only owner can call this function", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await expect(DeedContract.connect(SecondAccount).setPercentage(estateId, 4000, 4000)).to.be.revertedWith("Ownable: caller is not the owner");
//         });

//         it("Percentage can be set only for incompleted deeds", async() => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000)).to.be.revertedWith("Deed is already completed");
//         });

//         it("mogul percentage should be less than 100%", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await expect(DeedContract.connect(deployer).setPercentage(estateId, 11000, 4000)).to.be.revertedWith("Mogul percentage should be less than 100");
//         });

//         it("crowdsale percentage should be less than 100%", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await expect(DeedContract.connect(deployer).setPercentage(estateId, 4000, 11000)).to.be.revertedWith("Crowdsale percentage should be less than 100");
//         });

//         it("total shares should be less than 100%", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await expect(DeedContract.connect(deployer).setPercentage(estateId, 5000, 7000)).to.be.revertedWith("Percentage should be equal to 100");
//         });

//         it("total shares should be less than 100%", async () => {
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             expect((await DeedContract.getAgreement(estateId))[9]).to.equal((propertyOwnerRetains * maxSupply) / 10000);
//             expect((await DeedContract.getAgreement(estateId))[5]).to.equal((4000 * maxSupply) / 10000);
//             expect((await DeedContract.getAgreement(estateId))[7]).to.equal((4000 * maxSupply) / 10000);
//             expect((await DeedContract.getAgreement(estateId))[12]).to.equal(false);
//         });
//     });

//     describe("End-to-End Tests", function() {
        
//         it("End to End", async () => {
//             await DeedContract.connect(deployer).setERC20Address(ERC20TokenContract.address);
//             await DeedContract.connect(deployer).setPlatformFees(platformFees);
//             await DeedContract.connect(deployer).setMogulPayoutAddress(MogulPayout.address);
//             await DeedContract.connect(deployer).initiateAgreement(propertyOwner.address, maxSupply, legaldoc);
//             const estateId = ((await DeedContract.estateId()).toNumber()) - 1;
//             await DeedContract.connect(propertyOwner).enterPropertyDetails(propertydoc, estateId, propertyPrice, propertyOwnerRetains);
//             await DeedContract.connect(deployer).setPercentage(estateId, 4000, 4000);
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await DeedContract.connect(deployer).setPercentage(estateId, 3000, 5000);
//             await ERC20TokenContract.connect(propertyOwner).approve(DeedContract.address, platformFees);
//             await expect(DeedContract.connect(propertyOwner).transferPlatformFee(estateId)).to.be.revertedWith("Property owner should sign the agreement");
//             await DeedContract.connect(propertyOwner).signByPropertyOwner(estateId);
//             await DeedContract.connect(propertyOwner).updatePriceByPropertyOwner(estateId, propertyPrice + 200000);
//             await expect(DeedContract.connect(propertyOwner).transferPlatformFee(estateId)).to.be.revertedWith("Mogul should sign the agreement");
//             await DeedContract.connect(deployer).signByMogul(estateId);
//             await DeedContract.connect(propertyOwner).transferPlatformFee(estateId);
//             await DeedContract.connect(deployer).confirmDeedCompletion(estateId);
//             await expect(DeedContract.connect(deployer).setPercentage(estateId, 2000, 6000)).to.be.revertedWith("Deed is already completed");
//             await DeedContract.connect(deployer).uploadSaleDeedByOwner(estateId, "<sale deed>");
//         });
//     });

// });