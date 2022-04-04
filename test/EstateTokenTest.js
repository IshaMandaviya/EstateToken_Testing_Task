const { inputToConfig } = require("@ethereum-waffle/compiler");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");
chai.use(solidity);
const expect = chai.expect;
const { ethers } = require("hardhat");
require("dotenv").config();

describe("Estate Token Tests", function () {

    let EstateTokenContract;
    let EstatePenaltyTokenContract;
    let deployer;
    let SecondAccount;
    let thirdAccount;
    let vestingContractAddress;
    let crowdsaleContractAddress;
    const vestingTokenAmount = 100000;
    const crowdsaleTokenAmount = 120000;
    const uri = "Uri ";
    const estateId = 1;
    const timetill = (Math.round(Date.now() / 1000) + ( 60 * 60 * 24 * 7 ));
    const penaltyPercentageWeekly = 10;

    beforeEach(async () => {
        [ deployer, SecondAccount, thirdAccount, crowdsaleContractAddress, vestingContractAddress ] = await ethers.getSigners();
        const EstateToken = await ethers.getContractFactory("EstateToken");
        EstateTokenContract = await upgrades.deployProxy(EstateToken);
        EstateTokenContract = await EstateTokenContract.deployed();
        const EstatePenaltyToken = await ethers.getContractFactory("EstateToken_PenaltyContract");
        EstatePenaltyTokenContract = await upgrades.deployProxy(EstatePenaltyToken);
        EstatePenaltyTokenContract = await EstatePenaltyTokenContract.deployed();
    });

    describe("End-to-End Test", function() {

        it("End-to-End", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await EstateTokenContract.connect(crowdsaleContractAddress).safeTransferFrom(crowdsaleContractAddress.address, SecondAccount.address, estateId, crowdsaleTokenAmount / 2, []);
            expect(await EstateTokenContract.balanceOf(SecondAccount.address, estateId)).to.be.equal(crowdsaleTokenAmount / 2);
            await EstateTokenContract.connect(vestingContractAddress).safeTransferFrom(vestingContractAddress.address, thirdAccount.address, estateId, vestingTokenAmount / 2, []);
            expect(await EstateTokenContract.balanceOf(thirdAccount.address, estateId)).to.be.equal(vestingTokenAmount / 2);
            await EstateTokenContract.connect(deployer).delistToken(estateId, (Math.round(Date.now() / 1000)-( 60 * 60 * 24 * 7 )), penaltyPercentageWeekly);
            await expect(EstateTokenContract.connect(SecondAccount).safeTransferFrom(SecondAccount.address, thirdAccount.address, estateId, vestingTokenAmount / 2, [])).to.be.revertedWith("Token is not actively listed");
            await expect(EstateTokenContract.connect(SecondAccount).burn(SecondAccount.address, estateId, crowdsaleTokenAmount / 2)).to.be.revertedWith("Burn time is over");
            await EstateTokenContract.connect(deployer).extendBurnDeadline(estateId, timetill);
            await EstateTokenContract.connect(SecondAccount).burn(SecondAccount.address, estateId, crowdsaleTokenAmount / 2)
            expect(await EstateTokenContract.balanceOf(SecondAccount.address, estateId)).to.be.equal(0);
            await EstateTokenContract.connect(thirdAccount).burn(thirdAccount.address, estateId, vestingTokenAmount / 2);
            expect(await EstateTokenContract.balanceOf(thirdAccount.address, estateId)).to.be.equal(0);
        });
    });

    describe("Pause Token Test", function () {

        it("User other than Owner can not call this Function", async () => {
            // Check For The Owner(revert - caller is not the owner )
            await expect(EstateTokenContract.connect(SecondAccount).pause()).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("Owner can Paused the Token contract", async () => {
            // Pause contract
            await expect(EstateTokenContract.connect(deployer).pause()).to.emit(EstateTokenContract, 'Paused')
                                                                          .withArgs(deployer.address);
        });
    });

    describe("UnPause Token Test", function () {

        it("User other than Owner can not call this Function", async () => {
            // Check For The Owner(revert - caller is not the owner )
            await EstateTokenContract.connect(deployer).pause();
            await expect(EstateTokenContract.connect(SecondAccount).unPause()).to.be.revertedWith('Ownable: caller is not the owner')
        });
        
        it("Owner can unpaused the Token contract", async () => {
            // Pause contract
            await EstateTokenContract.connect(deployer).pause();
            await expect(EstateTokenContract.connect(deployer).unPause()).to.emit(EstateTokenContract, 'Unpaused')
                                                                            .withArgs(deployer.address);
        });
    });

    describe("updateCrowdsaleAddress Test", function () {

        it("User other than Owner can not call this Function", async () => {
            await expect(EstateTokenContract.connect(SecondAccount).updateCrowdsaleAddress(crowdsaleContractAddress.address)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("Owner can update the Crowdsale Address", async () => {
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            expect(await EstateTokenContract.crowdsaleContractAddress()).to.equal(crowdsaleContractAddress.address);
        });
    });

    describe("updateVestingContractAddress Test", function () {

        it("User other than Owner can not call this Function", async () => {
            await expect(EstateTokenContract.connect(SecondAccount).updateVestingContractAddress(vestingContractAddress.address)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("Owner can update the Crowdsale Address", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            expect(await EstateTokenContract.vestingContractAddress()).to.equal(vestingContractAddress.address);
        });
    });

    describe("mintNewPropertyToken Test", async function () {

        it("User other than Owner can not call this Function", async () => {
            // Check For The Owner(revert - caller is not the owner )
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await expect(EstateTokenContract.connect(SecondAccount).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("Mint By the Owner", async () => {
            // mintNewPropertyToken By Owner 
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
        });

        it("Mint By null uri", async () => {
            // mintNewPropertyToken By Owner 
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await expect( EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount,"", estateId)).to.be.revertedWith("URI not found");
        });  

        it("Amount of tokens minted reflects in the balance of the vestingContractAddress", async () => {
            // Check For if Token Minted on vestingContractAddress
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            expect(await EstateTokenContract.balanceOf(vestingContractAddress.address, estateId)).to.be.equal(vestingTokenAmount);
        });

        it("Amount of tokens minted reflects in the balance of the updateCrowdsaleAddress", async () => {
            // Check For if Token Minted on updateCrowdsaleAddress
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            expect(await EstateTokenContract.balanceOf(crowdsaleContractAddress.address, estateId)).to.be.equal(crowdsaleTokenAmount);
        });

        it("Total supply should equal to amount of Minted Token", async () => {
            // Check For if Token Minted on updateCrowdsaleAddress
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            expect(await EstateTokenContract.totalSupply(estateId)).to.be.equal(vestingTokenAmount + crowdsaleTokenAmount);
        });
    });

    describe("delistToken Test", function () {
        
        it("User other than Owner can not call this Function", async () => {
            // Check For The Owner(revert - caller is not the owner )
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await expect(EstateTokenContract.connect(SecondAccount).delistToken(estateId, timetill, penaltyPercentageWeekly)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("Owner can delist the token", async () => {
            // Check with non exist token(revert - Token is not listed )
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await EstateTokenContract.connect(deployer).delistToken(estateId, timetill, penaltyPercentageWeekly);
            expect((await EstateTokenContract.tokenInfo(1))[0]).to.equal(true);
            expect((await EstateTokenContract.tokenInfo(1))[1]).to.equal(false);
            expect((await EstateTokenContract.tokenInfo(1))[2]).to.equal(timetill);
            expect((await EstateTokenContract.tokenInfo(1))[4]).to.equal(penaltyPercentageWeekly);
        });

        it("with non exist token", async () => {
            // Check with non exist token(revert - Token is not listed )
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await expect(EstateTokenContract.connect(deployer).delistToken(3, timetill, penaltyPercentageWeekly)).to.be.revertedWith('Token is not listed');
        });

    });

    describe("burn Test", function() {

        it("Only token holders can burn the tokens", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await EstateTokenContract.connect(deployer).delistToken(estateId, timetill, penaltyPercentageWeekly);
            await expect(EstateTokenContract.connect(SecondAccount).burn(crowdsaleContractAddress.address, estateId, crowdsaleTokenAmount)).to.be.revertedWith("ERC1155: caller is not owner nor approved");
        });

        it("Token holders can burn their tokens", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await EstateTokenContract.connect(deployer).delistToken(estateId, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(crowdsaleContractAddress).burn(crowdsaleContractAddress.address, estateId, crowdsaleTokenAmount);
            expect(await EstateTokenContract.totalSupply(estateId)).to.be.equal(vestingTokenAmount);
        });

        it("Token ca'nt be burn if its actively listed", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await expect(EstateTokenContract.connect(crowdsaleContractAddress).burn(crowdsaleContractAddress.address, estateId, crowdsaleTokenAmount)).to.be.revertedWith("Burning is not allowed at the moment");
        });

        it("Can't burn the non existing tokens", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await EstateTokenContract.connect(deployer).delistToken(estateId, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(crowdsaleContractAddress).burn(crowdsaleContractAddress.address, estateId, 1000);
            await expect(EstateTokenContract.connect(crowdsaleContractAddress).burn(crowdsaleContractAddress.address, estateId, crowdsaleTokenAmount)).to.be.revertedWith("Amount exceeds the available balance to burn with this token-id in this account");
        });
    });

    describe("burnBatch Test",  function() {

        it("Only token holders can burn the tokens", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 0);
            await EstateTokenContract.connect(deployer).delistToken(0, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 1);
            await EstateTokenContract.connect(deployer).delistToken(1, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 2);
            await EstateTokenContract.connect(deployer).delistToken(2, timetill, penaltyPercentageWeekly);
            const ids = [ 0, 1, 2 ];
            const amounts = [ crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount ];
            await expect(EstateTokenContract.connect(SecondAccount).burnBatch(crowdsaleContractAddress.address, ids, amounts)).to.be.revertedWith("ERC1155: caller is not owner nor approved");
        });

        it("token holders can burn their tokens", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 0);
            await EstateTokenContract.connect(deployer).delistToken(0, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 1);
            await EstateTokenContract.connect(deployer).delistToken(1, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 2);
            await EstateTokenContract.connect(deployer).delistToken(2, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 3);
            await EstateTokenContract.connect(deployer).delistToken(3, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 4);
            await EstateTokenContract.connect(deployer).delistToken(4, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 5);
            await EstateTokenContract.connect(deployer).delistToken(5, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 6);
            await EstateTokenContract.connect(deployer).delistToken(6, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 7);
            await EstateTokenContract.connect(deployer).delistToken(7, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 8);
            await EstateTokenContract.connect(deployer).delistToken(8, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 9);
            await EstateTokenContract.connect(deployer).delistToken(9, timetill, penaltyPercentageWeekly);
            const ids = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
            const amounts = [ crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount ];
            await EstateTokenContract.connect(crowdsaleContractAddress).burnBatch(crowdsaleContractAddress.address, ids, amounts);
            expect(await EstateTokenContract.totalSupply(0)).to.be.equal(vestingTokenAmount);
            expect(await EstateTokenContract.totalSupply(1)).to.be.equal(vestingTokenAmount);
            expect(await EstateTokenContract.totalSupply(2)).to.be.equal(vestingTokenAmount);
        });

        it("actively listed tokens can not be burn", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 0);
            await EstateTokenContract.connect(deployer).delistToken(0, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 1);
            //await EstateTokenContract.connect(deployer).delistToken(1, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 2);
            await EstateTokenContract.connect(deployer).delistToken(2, timetill, penaltyPercentageWeekly);
            const ids = [ 0, 1, 2 ];
            const amounts = [ crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount ];
            await expect(EstateTokenContract.connect(crowdsaleContractAddress).burnBatch(crowdsaleContractAddress.address, ids, amounts)).to.be.revertedWith("Burning is not allowed at the moment for token-id");
        });

        it("Should be reverted with the mismatch length of ids and amounts", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 0);
            await EstateTokenContract.connect(deployer).delistToken(0, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 1);
            await EstateTokenContract.connect(deployer).delistToken(1, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 2);
            await EstateTokenContract.connect(deployer).delistToken(2, timetill, penaltyPercentageWeekly);
            const ids = [ 0, 1, 2 ];
            const amounts = [ crowdsaleTokenAmount, crowdsaleTokenAmount ];
            await expect(EstateTokenContract.connect(crowdsaleContractAddress).burnBatch(crowdsaleContractAddress.address, ids, amounts)).to.be.revertedWith("Length of ids and values should be same");
        });

        it("can't burn the non existing tokens", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 0);
            await EstateTokenContract.connect(deployer).delistToken(0, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 1);
            await EstateTokenContract.connect(deployer).delistToken(1, timetill, penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, 2);
            await EstateTokenContract.connect(deployer).delistToken(2, timetill, penaltyPercentageWeekly);
            const ids = [ 0, 1, 2 ];
            const amounts = [ crowdsaleTokenAmount, crowdsaleTokenAmount, crowdsaleTokenAmount ];
            await EstateTokenContract.connect(crowdsaleContractAddress).burn(crowdsaleContractAddress.address, 1, 1000);
            await expect(EstateTokenContract.connect(crowdsaleContractAddress).burnBatch(crowdsaleContractAddress.address, ids, amounts)).to.be.revertedWith("Amount exceeds the available balance to burn with this token-id in this account");
        });
    });

    describe("extendBurnDeadline Tests", function() {

        it("User other than Owner can not call this Function", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await EstateTokenContract.connect(deployer).delistToken(estateId, Math.round(Date.now() / 1000), penaltyPercentageWeekly);
            await expect(EstateTokenContract.connect(SecondAccount).extendBurnDeadline(estateId, timetill)).to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("Burning deadline should be extended", async () => {
            await EstateTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstateTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstateTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            await EstateTokenContract.connect(deployer).delistToken(estateId, Math.round(Date.now() / 1000), penaltyPercentageWeekly);
            await EstateTokenContract.connect(deployer).extendBurnDeadline(estateId, timetill);
            expect((await EstateTokenContract.tokenInfo(estateId))[2]).to.equal(timetill);
        });
    });

    describe("penaltyPercentageCalculator Tests", async () => {

        // This testcase is working the instance of contract deployed with modified contract,
        // required to test this penalty formula

        it("penaltyPercentageCalculator should return the expected value", async function() {
            
            await EstatePenaltyTokenContract.connect(deployer).updateVestingContractAddress(vestingContractAddress.address);
            await EstatePenaltyTokenContract.connect(deployer).updateCrowdsaleAddress(crowdsaleContractAddress.address);
            await EstatePenaltyTokenContract.connect(deployer).mintNewPropertyToken(vestingTokenAmount, crowdsaleTokenAmount, uri, estateId);
            const dateNow = (Math.round(Date.now() / 1000));
            await EstatePenaltyTokenContract.connect(deployer).delistToken(estateId, dateNow, penaltyPercentageWeekly);
            const penalty = (penaltyPercentageWeekly *  timetill - dateNow) / ( 60 * 60 * 24 * 7 );
            expect(await EstatePenaltyTokenContract.penaltyPercentageCalculator(penaltyPercentageWeekly, estateId, timetill)).to.equal(Math.floor(penalty));
        });
    });

});