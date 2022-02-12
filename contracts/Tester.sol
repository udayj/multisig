//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Tester {

    string greeting="initial";
    function setGreeting(string calldata _greeting) public payable{

        greeting=_greeting;
    }

    function getGreeting() public view returns(string memory){

        return greeting;
    }

    function getBalance() public view returns(uint) {

        return (address(this)).balance;
    }
}