// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.6.0 <0.9.0;
import "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract Rentals is OwnableUpgradeable {
    IERC1155Upgradeable estateTokenAddress;
    IERC20Upgradeable tokenAddress;

    //struct for User details
    struct User {
        uint256 tokenBalance;
        uint256 submitTimestamp;
        bool submitted;
    }

    //struct for rentals
    struct Rental {
        uint256 maxSupply;
        uint256 totalRewardAmount;
        uint256 fromDate;
        uint256 toDate;
        uint256 perTokenRewardDaily;
        mapping(address => User) users;
    }

    // mapping to store all the rentals
    mapping(uint256 => Rental) rentals;

    function initialize() public initializer {
        __Ownable_init();
    }

    //function to set erc1155 contract address
    function setErc1155ContractAddress(IERC1155Upgradeable _address)
        public
        onlyOwner
    {
        estateTokenAddress = _address;
    }

    //function to create a new rental
    function enterRentalDetails(
        uint256 _estateID,
        uint256 _maxSupply,
        uint256 _totalRewardAmount,
        uint256 _fromDate,
        uint256 _toDate
    ) external onlyOwner {
        require(_maxSupply > 0);
        require(_totalRewardAmount > 0);
        require(_fromDate > 0);
        require(_toDate > 0);

        Rental storage rental = rentals[_estateID];
        rental.maxSupply = _maxSupply;
        rental.totalRewardAmount = _totalRewardAmount;
        rental.fromDate = _fromDate;
        rental.toDate = _toDate;
        // rentals[_estateID] = rental;

        calculateDailyIntrest(_estateID);
    }

    //function to calculate daily intrest
    function calculateDailyIntrest(uint256 _estateID) internal {
        uint256 totalPerTokenRewardForDuration = (rentals[_estateID]
            .totalRewardAmount * 10**18) / rentals[_estateID].maxSupply;

        uint256 duration = (rentals[_estateID].toDate -
            rentals[_estateID].fromDate) / 1 days;

        rentals[_estateID].perTokenRewardDaily =
            (totalPerTokenRewardForDuration / duration) /
            10**18;
    }

    //function to submit the token to the contract
    function submitTokens(uint256 _estateID, uint256 _amount) external {
        require(rentals[_estateID].fromDate <= block.timestamp);
        require(rentals[_estateID].toDate >= block.timestamp);
        require(
            rentals[_estateID].users[msg.sender].submitted == false,
            "alredy submitted for this duration"
        );
        IERC1155Upgradeable(estateTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _estateID,
            _amount,
            ""
        );
        rentals[_estateID].users[msg.sender].tokenBalance += _amount;
        rentals[_estateID].users[msg.sender].submitTimestamp = block.timestamp;
        rentals[_estateID].users[msg.sender].submitted = true;
    }

    //function to get the subitted token balance
    function getTokenBalance(uint256 _estateID) public view returns (uint256) {
        return rentals[_estateID].users[msg.sender].tokenBalance;
    }

    //function to get the intreset earned till now
    function getIntrestEarned(uint256 _estateID) public view returns (uint256) {
        if (block.timestamp >= rentals[_estateID].toDate) {
            return
                rentals[_estateID].users[msg.sender].tokenBalance *
                rentals[_estateID].perTokenRewardDaily;
        }
        return
            (rentals[_estateID].users[msg.sender].tokenBalance *
                rentals[_estateID].perTokenRewardDaily *
                (block.timestamp - rentals[_estateID].fromDate)) / 1 days;
    }

    // funtion to transfer the tokens to User and send intrest earned
    function redeemToken(uint256 _estateID) external {
        require(
            rentals[_estateID].toDate < block.timestamp,
            "You can not redeem these tokens yet"
        );
        require(
            rentals[_estateID].users[msg.sender].submitted == true,
            "You have not submitted your tokens yet"
        );
        require(
            block.timestamp >=
                rentals[_estateID].users[msg.sender].submitTimestamp + 15 days
        );
        uint256 intrest = getIntrestEarned(_estateID);
        uint256 _amount = rentals[_estateID].users[msg.sender].tokenBalance;

        IERC1155Upgradeable(estateTokenAddress).safeTransferFrom(
            msg.sender,
            address(this),
            _estateID,
            _amount,
            ""
        );
        rentals[_estateID].users[msg.sender].tokenBalance = 0;
        IERC20Upgradeable(tokenAddress).transferFrom(
            owner(),
            msg.sender,
            intrest
        );
    }
}