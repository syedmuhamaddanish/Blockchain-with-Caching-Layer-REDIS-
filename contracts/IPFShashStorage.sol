// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.9;

contract IPFShashStorage{

    address owner;
    constructor() {
        owner = msg.sender;
    }

    //Maps date and customer information to the related energy consumption values
    mapping(string => string) hash;
    
    function StoreIPFShash (string memory _hash, string memory _date) public {
        //require(msg.sender == owner);
        //if(hash[_date][_customer] != ""){
        //    revert("The data is already stored for this date");
       // }
        bytes memory temp = bytes(hash[_date]);
        if(temp.length != 0){
            revert("The data is already stored for this date");
        }
    hash[_date] = _hash;
    }
    // Retrieve data based on date and sender
    function GetIPFShash (string memory _date) public view returns (string memory){
        return(hash[_date]) ;

    }
}