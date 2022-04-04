// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "contracts/helper/BMT.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Deed is BasicMetaTransaction, Initializable, OwnableUpgradeable {
    modifier onlyPropertyOwner(uint256 __estateId) {
        require(
            msg.sender == agreements[__estateId].propertyOwnerAddress,
            "Message sender / agreement signer should be property owner"
        );
        _;
    }

    modifier deedRunning(uint256 __estateId) {
        require(
            agreements[__estateId].dealComplete == false,
            "Deed is already completed"
        );
        _;
    }

    function initialize() public initializer {
        __Ownable_init();
    }

    //string to store the legal document

    IERC20 public _erc20Address;
    uint256 public estateId;
    uint256 private _platformFees;
    address private _mogulPayoutAddress;

    struct agreement {
        string saleDeed;
        string tncLegalDoc;
        string propertyDocument;
        uint256 propertyPrice;
        uint256 mogulPercentage;
        uint256 mogulTokenAmount;
        uint256 crowdsalePercentage;
        uint256 crowdsaleTokenAmount;
        uint256 propertyOwnerRetains;
        uint256 propertyOwnerTokenAmount;
        uint256 maxSupply;
        address propertyOwnerAddress;
        bool signedByPropertyOwner;
        bool signedByMogul;
        bool initialized;
        bool platfromFeePaid;
        bool dealComplete;
    }
    // mapping for containg deeds
    mapping(uint256 => agreement) internal agreements;

    // function to initiaite agreement

    function initiateAgreement(
        address _propertyOwner,
        uint256 _maxSupply,
        string calldata _legaldoc
    ) public onlyOwner returns (uint256) {
        agreements[estateId].propertyOwnerAddress = _propertyOwner;
        agreements[estateId].initialized = true;
        agreements[estateId].tncLegalDoc = _legaldoc;
        agreements[estateId].maxSupply = _maxSupply;
        estateId++;
        return estateId - 1;
    }

    //function to enter details of property by owner
    //NOTE: estate Id is required
    function enterPropertyDetails(
        string calldata _propertyDocument,
        uint256 _estateId,
        uint256 _propertyPrice,
        uint256 _propertyOwnerRetains
    ) public onlyPropertyOwner(_estateId) {
        require(
            _propertyOwnerRetains < 10000,
            "Property owner retains should be less than 100 %"
        );
        agreements[_estateId].propertyDocument = _propertyDocument;
        agreements[_estateId].propertyPrice = _propertyPrice;
        agreements[_estateId].propertyOwnerRetains = _propertyOwnerRetains;
    }

    //function to set percentqage of mogul and crowdsale
    //NOTE: estate Id is required
    function setPercentage(
        uint256 _estateId,
        uint256 _mogulPercentage,
        uint256 _crowdsalePercentage
    ) public onlyOwner deedRunning(_estateId) {
        require(
            _mogulPercentage <= 10000,
            "Mogul percentage should be less than 100"
        );
        require(
            _crowdsalePercentage <= 10000,
            "Crowdsale percentage should be less than 100"
        );
        agreements[_estateId].mogulPercentage = _mogulPercentage;
        agreements[_estateId].crowdsalePercentage = _crowdsalePercentage;
        require(
            agreements[_estateId].mogulPercentage +
                agreements[_estateId].crowdsalePercentage +
                agreements[_estateId].propertyOwnerRetains ==
                10000,
            "Percentage should be equal to 100"
        );

        //calculate token amount
        percentageToTokens(_estateId);
        agreements[_estateId].signedByPropertyOwner = false;
    }

    //function to change percentage into tokens
    //NOTE: estate Id is required
    function percentageToTokens(uint256 __estateID) internal onlyOwner {
        agreement storage _agreement = agreements[__estateID];

        _agreement.propertyOwnerTokenAmount =
            (_agreement.propertyOwnerRetains * _agreement.maxSupply) /
            10000; // divide by 10000 to convert percentage to tokens

        _agreement.mogulTokenAmount =
            (_agreement.mogulPercentage * _agreement.maxSupply) /
            10000;

        _agreement.crowdsaleTokenAmount =
            (_agreement.crowdsalePercentage * _agreement.maxSupply) /
            10000;

        require(
            _agreement.propertyOwnerTokenAmount +
                _agreement.mogulTokenAmount +
                _agreement.crowdsaleTokenAmount ==
                _agreement.maxSupply,
            "Tokens should be equal to max supply"
        );

        
    }

    // function to sign the agreement by the property owner
    // it will accept all the info present in struct of the specific tokenID
    function signByPropertyOwner(uint256 _estateId)
        public
        onlyPropertyOwner(_estateId)
        deedRunning(_estateId)
    {
        agreements[_estateId].signedByPropertyOwner = true;
    }

    function signByMogul(uint256 _estateId)
        public
        onlyOwner
        deedRunning(_estateId)
    {
        //address caller = msg.sender;
        agreements[_estateId].signedByMogul = true;
    }

    //function to get the agreement details
    function getAgreement(uint256 _estateId)
        public
        view
        returns (agreement memory)
    {
        return agreements[_estateId];
    }

    // function to set mogul payout address
    function setMogulPayoutAddress(address __mogulPayoutAddress)
        public
        onlyOwner
    {
        _mogulPayoutAddress = __mogulPayoutAddress;
    }

    //function to set platform fees
    function setPlatformFees(uint256 __platformFees) public onlyOwner {
        _platformFees = __platformFees;
    }

    //function to set erc20 address
    function setERC20Address(IERC20 __erc20Address) public onlyOwner {
        _erc20Address = __erc20Address;
    }

    //function to update property price by owner
    function updatePriceByPropertyOwner(uint256 _estateId, uint256 _price)
        public
        onlyPropertyOwner(_estateId)
        deedRunning(_estateId)
    {
        agreements[_estateId].propertyPrice = _price;
        agreements[_estateId].signedByMogul = false;
    }

    //update property doc by owner
    function updatePropertyDocByPropertyOwner(
        uint256 _estateId,
        string calldata _propertyDocument
    ) public onlyPropertyOwner(_estateId) deedRunning(_estateId) {
        agreements[_estateId].propertyDocument = _propertyDocument;
        agreements[_estateId].signedByMogul = false;
    }

    //function to update property owner retains by owner
    function updatePropertyOwnerRetainsByPropertyOwner(
        uint256 _estateId,
        uint256 _propertyOwnerRetains
    ) public onlyPropertyOwner(_estateId) deedRunning(_estateId) {
        agreements[_estateId].propertyOwnerRetains = _propertyOwnerRetains;
        agreements[_estateId].signedByMogul = false;
    }

    //function to update property owner by mogul
    function updatePropertyOwnerByMogul(
        uint256 _estateId,
        address _propertyOwnerAddress
    ) public onlyOwner deedRunning(_estateId) {
        agreements[_estateId].propertyOwnerAddress = _propertyOwnerAddress;
    }

    // function to change the maxSupply of the token
    function updateMaxSupplyByMogul(uint256 _estateId, uint256 _maxSupply)
        public
        onlyOwner
        deedRunning(_estateId)
    {
        agreements[_estateId].maxSupply = _maxSupply;
    }

    function uploadSaleDeedByOwner(uint256 _estateId, string calldata _saleDeed)
        public
        onlyOwner
    {
        require(
            agreements[_estateId].dealComplete == true,
            "deal is not complete yet !!"
        );
        agreements[_estateId].saleDeed = _saleDeed;
    }

    // transfer confirmation function
    //NOTE need to get approval from the erc20  contract first
    function transferPlatformFee(uint256 __estateId) public {
        require(
            agreements[__estateId].signedByPropertyOwner,
            "Property owner should sign the agreement"
        );
        require(
            agreements[__estateId].signedByMogul,
            "Mogul should sign the agreement"
        );
        require(
            IERC20(_erc20Address).allowance(msg.sender, address(this)) >= _platformFees, 
            "Contract is not approved to transfer the funds, please increase the allowance."
        );
        IERC20(_erc20Address).transferFrom(
            msg.sender,
            _mogulPayoutAddress,
            _platformFees
        );
        agreements[__estateId].platfromFeePaid = true;
    }

    // funtion to confirm the deal completion after crowdsale
    function confirmDeedCompletion(uint256 __estateId) public onlyOwner {
        require(
            agreements[__estateId].signedByPropertyOwner,
            "Property owner should sign the agreement"
        );
        require(
            agreements[__estateId].signedByMogul,
            "Mogul should sign the agreement"
        );
        require(
            agreements[__estateId].platfromFeePaid,
            "Platform fee not paid"
        );
        agreements[__estateId].dealComplete = true;
    }

    // function
    function _msgSender() internal view virtual override returns (address) {
        return msgSender();
    }
}
