//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Multisig {

    //Based on solidity-by-example code - extends it by adding the ability to add/renounce ownership, 
    //and slightly different checks while approving/executing
    //idea is to make this a dynamic ownership multisig wallet
    event Deposit(address depositer, uint amount);
    event Submit(address sender, address to, uint value, bytes data, uint id);
    event Approve(address approver, uint id);
    event Revoke(address revoker, uint id);
    event Execute(address executor, uint id);
    event OwnerAdded(address addedBy, address newOwner);
    event OwnershipRenounced(address prevOwner);

    struct Transaction {
        uint id;
        
        uint value;
        uint conf;
        address to;
        bytes data;
        bool executed;
    }

    uint id_count;
    Transaction[] transactions;
    uint public minApprovals;
    mapping(address=> bool) public owners;
    uint public numOwners;
    mapping (uint => mapping (address => bool)) approvalStatus;


    constructor() {
        numOwners++;
        owners[msg.sender]=true;
        minApprovals=1;
    }
    modifier txExists(uint _id) {

        require(_id < id_count, "No transaction exists with this id");
        _;
        
    }

    modifier onlyOwner (address _addr) {

        require(owners[_addr],"Not owner");
        _;
    }

    function addOwner(address _addr) public onlyOwner(msg.sender) {
        owners[_addr]=true;
        numOwners++;
        minApprovals=(numOwners/2)+1;
        emit OwnerAdded(msg.sender,_addr);
    }
    function submitTransaction(address _to, bytes calldata data, uint _value) public onlyOwner(msg.sender){
        
        transactions.push(Transaction(id_count,_value,0,_to,data,false));
        id_count++;
        emit Submit(msg.sender, _to, _value,data,id_count-1);

    }

    function approveTransaction(uint _id) public txExists(_id) onlyOwner(msg.sender) {

        
        require(!transactions[_id].executed,"Cannot approve completed transaction");
        approvalStatus[_id][msg.sender]=true;
        transactions[_id].conf++;
        emit Approve(msg.sender,_id);
    }

    function revokeApproval(uint _id) public txExists(_id) onlyOwner(msg.sender) {

        require(!transactions[_id].executed,"Cannot revoke approval for completed transaction");
        require(approvalStatus[_id][msg.sender],"No approval to revoke");
        approvalStatus[_id][msg.sender]=false;
        transactions[_id].conf--;
        emit Revoke(msg.sender,_id);

    }

    function executeTransaction(uint _id) public txExists(_id) returns(bool){

        Transaction memory transaction=transactions[_id];

        require(transaction.value < address(this).balance, "Not enough balance for executing transaction");
        require(transaction.conf >= minApprovals,"Approval quorum not met");
        (bool status,)=transaction.to.call{value:transaction.value}(transaction.data);
        emit Execute(msg.sender, _id);
        return status;
    }

    function renounceOwnership() public onlyOwner(msg.sender) {

        owners[msg.sender]=false;
        numOwners--;
        minApprovals=(numOwners/2)+1;
        for(uint i=0;i<transactions.length;i++) {
            if(transactions[i].executed) {
                continue;
            }
            if(approvalStatus[transactions[i].id][msg.sender]) {
                approvalStatus[transactions[i].id][msg.sender]=false;
                transactions[i].conf--;
            }
        }
        emit OwnershipRenounced(msg.sender);
    }

    function getTransactionData(uint id) public view returns(Transaction memory) {

        require(id < id_count, "Transaction id does not exist");
        return transactions[id];

    }

    receive() external payable {
        emit Deposit(msg.sender,msg.value);
    }


    function getTotalTransactions() public view returns(uint){

        return id_count;

    }
}