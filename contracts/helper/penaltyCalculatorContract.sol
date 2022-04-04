/* ANCHOR: Info regarding the contract

1. This contract is not intended to be used as a standalone contract.

2. mintNewPropertyToken() is the function which is called by the contract owner to mint tokens
    and transfer them to mogul and the crowdsale contract.

3. The initial state of Mogul and crowdsale percentage share is set to  50% and 50% respectively.

4. To change the initial state of Mogul percentage share,
    please use the updateMogulPercentage() , crowdsale percentage will calculated

5. Make sure to set crowdsale contract address with the help of updateCrowdsaleAddress() function.

6. To enable burning for a token, please use the updateBurningState() function 
    make sure to set the burning state to true and set time till burning of token is allowed

7. Default Mogul address is set to msg.sender address. pls change it using updateMogulAddress() function.

*/

/* TODO 
PENDING THINGS : 
    1. Withdraw funds after burning of tokens  
*/

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155SupplyUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/utils/ERC1155HolderUpgradeable.sol";

contract EstateToken_PenaltyContract is
    Initializable,
    ERC1155Upgradeable,
    OwnableUpgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155PausableUpgradeable,
    ERC1155SupplyUpgradeable,
    ERC1155HolderUpgradeable
{
    function initialize() public initializer {
        __ERC1155_init("");
        __Ownable_init();
        __ERC1155Burnable_init();
        __ERC1155Pausable_init();
        __ERC1155Supply_init();
    }

    //address private _mogulAddress = msg.sender;
    address public vestingContractAddress;
    address public crowdsaleContractAddress;

    //function to pause contract
    function pause() external onlyOwner {
        _pause();
    }

    // function to unpause contract
    function unPause() external onlyOwner {
        _unpause();
    }

    // struct for token info

    struct Tokeninfo {
        bool burnState; // true if burn is on
        bool activelyListed; // true if token is listed and active
        uint256 burnAllowedTill; // time left till burn is allowed
        uint256 burnAllowedTillBeforeExtension; //for pentalty calculation
        uint256 penaltyPercentageWeekly; // penalty percentage ffor delay in burning
        string uri; // uri of the token
    }

    // mapping for token info
    mapping(uint256 => Tokeninfo) public tokenInfo;

    // // function to set mogul address
    // function updateMogulAddress(address mogulAddress) external onlyOwner {
    //     _mogulAddress = mogulAddress;
    // }

    // function to set the crowdsale contract address
    function updateCrowdsaleAddress(address _crowdsale) external onlyOwner {
        crowdsaleContractAddress = _crowdsale;
    }

    //function to view uri of a token overridden
    function uri(uint256 _tokenId)
        public
        view
        override
        returns (string memory)
    {
        return tokenInfo[_tokenId].uri;
    }

    // function to set the uri of a token
    function updateTokenURI(uint256 _tokenId, string memory _uri)
        external
        onlyOwner
    {
        tokenInfo[_tokenId].uri = _uri;
    }

    //function to change vesting Contract address
    function updateVestingContractAddress(address _vestingContractAddress)
        external
        onlyOwner
    {
        vestingContractAddress = _vestingContractAddress;
    }

    // Header function for minting token directly to mogul and crowdsale contract
    //vesting token amount is the sum of mogul's token + property owner's token from deed contract
    function mintNewPropertyToken(
        uint256 vestingTokenAmount,
        uint256 crowdsaleTokenAmount,
        string calldata __uri,
        uint256 _estateId
    ) external onlyOwner {
        //require(bytes(__uri).length < 0, "URI not found");
        tokenInfo[_estateId].uri = __uri;
        _mint(crowdsaleContractAddress, _estateId, crowdsaleTokenAmount, "");
        _mint(vestingContractAddress, _estateId, vestingTokenAmount, "");
        tokenInfo[_estateId].activelyListed = true;
    }

    // function to set burn allowance for tokens
    // penalty percentage of delay in burning is set via this function
    function updateBurningState(
        bool _state,
        uint256 _tokenid,
        uint256 _timetill,
        uint256 _penaltyPercentageWeekly
    ) internal onlyOwner {
        tokenInfo[_tokenid].burnState = _state;
        tokenInfo[_tokenid].burnAllowedTill = _timetill;
        tokenInfo[_tokenid].penaltyPercentageWeekly = _penaltyPercentageWeekly;
        tokenInfo[_tokenid].burnAllowedTillBeforeExtension = _timetill;
    }

    // function to start delisting process of a token
    function delistToken(
        uint256 _tokenId,
        uint256 _timetill,
        uint256 _penaltyPercentageWeekly
    ) external onlyOwner {
        require(tokenInfo[_tokenId].activelyListed, "Token is not listed");
        tokenInfo[_tokenId].activelyListed = false;

        //calling updateBurningState() to update the burning state of the token
        updateBurningState(true, _tokenId, _timetill, _penaltyPercentageWeekly);
    }

    // function to burn token overridden from ERC1155BurnableUpgradeable
    function burn(
        address _account,
        uint256 _tokenId,
        uint256 _amount
    ) public override {
        require(
            tokenInfo[_tokenId].burnState == true,
            "Burning is not allowed at the moment"
        );
        require(
            tokenInfo[_tokenId].burnAllowedTill > block.timestamp,
            "Burn time is over"
        );
        require(
            totalSupply(_tokenId) > 0,
            "Cannot burn token with no available supply"
        );
        require(
            balanceOf(_account, _tokenId) >= _amount,
            "Amount exceeds the available balance to burn with this token-id in this account"
        );

        require(
            _account == _msgSender() ||
                isApprovedForAll(_account, _msgSender()),
            "ERC1155: caller is not owner nor approved"
        );
        require(
            !tokenInfo[_tokenId].activelyListed,
            "Token is actively listed"
        );

        /* NOTE:INFO on _burn from ERC1155BurnableUpgradeable 
            _burn(address account, uint256 id, uint256 amount)
            internal
            Destroys amount tokens of token type id from account
            Requirements:
            account cannot be the zero address.
            account must have at least amount tokens of token type id.
        */

        _burn(_account, _tokenId, _amount);
    }

    // function to burn in batch overridden from ERC1155Burnableupgradeable
    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public override {
        require(
            ids.length == values.length,
            "Length of ids and values should be same"
        );
        for (uint256 i = 0; i < ids.length; i++) {
            require(
                tokenInfo[ids[i]].burnState == true,
                "Burning is not allowed at the moment for token-id "
            );
            require(
                tokenInfo[ids[i]].burnAllowedTill > block.timestamp,
                "Burn time is over"
            );
            require(
                totalSupply(ids[i]) > 0,
                "Cannot burn token with no available supply"
            );
            require(
                balanceOf(account, ids[i]) >= values[i],
                "Amount exceeds the available balance to burn with this token-id in this account"
            );

            require(
                account == _msgSender() ||
                    isApprovedForAll(account, _msgSender()),
                "ERC1155: caller is not owner nor approved"
            );
            require(
                !tokenInfo[ids[i]].activelyListed,
                "Token is actively listed"
            );
        }

        _burnBatch(account, ids, values);
    }

    // funtion to extend the burn deadline
    function extendBurnDeadline(uint256 _tokenId, uint256 _timetill)
        external
        onlyOwner
    {
        require(
            tokenInfo[_tokenId].burnState == true,
            "Burning is not allowed at the moment"
        );
        tokenInfo[_tokenId].burnAllowedTill = _timetill;
    }

    //function calculate penalty
    /* NOTE: This function needs to be called after burning the tokens
        to calculate the penalty for the tokens

        and this percentage should be subtracted from the payout amount of the user in USDC

        STEPS :- 

        1. calculate the penalty percentage
        2. convert the burnt token vaue to USD 
        3. deduct the percentage from the payout amount
    */

    function penaltyPercentageCalculator(
        uint256 _penaltyWeekly,
        uint256 tokenId,
        uint256 timeStamp
    ) external view returns (uint256) {
        if (timeStamp > tokenInfo[tokenId].burnAllowedTill) {
            return
                // penalty if late
                (_penaltyWeekly * timeStamp - (tokenInfo[tokenId].burnAllowedTillBeforeExtension)) / (1 weeks);
        } else {
            // no penalty as it is in burn window
            return 0;
        }
    }

    // override function to save from errors in ERC1155
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    )
        internal
        override(
            ERC1155PausableUpgradeable,
            ERC1155Upgradeable,
            ERC1155SupplyUpgradeable
        )
        whenNotPaused
    {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }

    // override function to stop transfer is not actively listed
    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
        require(tokenInfo[id].activelyListed, "Token is not actively listed");
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not owner nor approved"
        );
        _safeTransferFrom(from, to, id, amount, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155Upgradeable, ERC1155ReceiverUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
