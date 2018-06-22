pragma solidity ^0.4.4;
contract Conference {
address public organizer;
mapping (address => uint) public registrantsPaid;
uint public quota;
address public speaker; //added speaker field
uint public numRegistrants;
// Constructor
function Conference(address speakaddr) {
organizer = msg.sender;
quota = 500;
numRegistrants = 0;
speaker=speakaddr; //initialised speaker field in constructor
}
function changeQuota(uint newquota) public {
if (msg.sender != organizer) { return; }
quota = newquota;
}
function buyTicket() public payable returns (bool success) {
if (numRegistrants >= quota) { return false; }
registrantsPaid[msg.sender] = msg.value;
numRegistrants++;
return true;
}
//added by multiple tickets function
function buyMultipleTickets(uint num) public payable returns (bool success) {
if (numRegistrants >= quota) { return false; }
registrantsPaid[msg.sender] = msg.value;
numRegistrants=numRegistrants+num;
return true;
}
function refundTicket(address recipient, uint amount) public {
if (msg.sender != organizer) { return; }
if (registrantsPaid[recipient] == amount) {
address myAddress = this;
if (myAddress.balance >= amount) {
if(!recipient.send(amount)) throw;
registrantsPaid[recipient] = 0;
numRegistrants--;
}}}
function destroy() {
if (msg.sender == organizer) {
address myAddress = this; //getting contract address
if(!speaker.send(((myAddress.balance)*(80))/100)) throw;
// sending 80% funds to speaker
suicide(organizer); // send funds to organizer
}
}
}//end of conference
