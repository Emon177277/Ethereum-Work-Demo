// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract Escrow{


    
    
// Section1 ============================== > Constructor
    
    
    /*
        making them admin of the contract so that certain features can only be available to them
    */
    constructor(){
        arbitror = msg.sender;  
    }


    
   
// Section2 ============================== > State Variables 
    
    address arbitror;
    
    /*
        This enum is to identify the status of a deposite
    */
    enum CONFIRMATION_STATUS { 
        INACTIVE            ,           // 0, this is the default status 
        FINALIZE_PAYMENT    ,           // 2, when depositor confirms that recipient can recieve the money
        PENDING                         // 5, when the deposite is still active but the payment to the recipient is yet pending
    }
    
    
    struct Deposite{
        address payable depositor               ;
        address payable recipient               ;
        uint amount                             ;
        uint depositeTime                       ;
        CONFIRMATION_STATUS confirmation_status ;
    }
    
    
    /* 
        to have a mapping of all the deposites,deposites are identified by the depositor's address
    */
    mapping (address => Deposite) deposites;                
    
    
    /* 
        to check if the depositor has any pending deposite, in case 'yes' they will not be able to deposite any 
        further ammount unless they withdraw or their recipient recieves the money
    */
    mapping (address => bool) disabled_depositor;           
    
    
    /* 
        updates on the deposites 
    */
    event DepositeStatusUpdate(address indexed depositor_address, string indexed deposite_status); 
    
 
 
    
// Section3 ============================== > Moifiers
    
    /* 
        modifier:1 -> this confirms that the dipositor is unable to deposite more than once,
        they can only deposite when they don't have any pending payment or if they cancel their previous deposite 
    */
    modifier checkIfDepositorCanDeposite(address depositorAddress){
        require(disabled_depositor[depositorAddress] == false, "There is already an incomplete transaction for this depositor");
        disableDepositorToDeposite(depositorAddress);
        _;
    }
    
    
    /* 
        modifier:2 -> this checks if the invoker of the funciton is the arbritror or not 
    */
    modifier checkIfArbitror(address _requester){
        require(_requester == arbitror, "Sorry, only arbitror has access to this feature");
        _;
    }
    
    
    /*
        modifier:3 -> this checks if the depositor is trying to withdraw their deposite within 24 hours or not 
    */
    modifier withdrawalTimePermmission(address _requester){
        Deposite memory _depositeForThisAddress = deposites[_requester];
        require(block.timestamp - _depositeForThisAddress.depositeTime >= 1 days, "Amount can not be withdrawn within 24 hours of deposite"); // cheking needs to be done
        _;
    }
    
    
    /*
        modifier:4 -> this modifier ensures that the arbritror won't be able to send the money to the 
        recipent until the depositor confirms it 
    */
    modifier depositeStatusPermission( address _requester){
        Deposite memory _depositeForThisAddress = deposites[_requester];
        require(_depositeForThisAddress.confirmation_status == CONFIRMATION_STATUS.PENDING, "Access denied, can not perform action for this deposite");
        _;
    }
    
    
    /*
        modifier:5 -> this checks if the depositor is valid one, this modifier is a bit redundant 
        but there might come certain situations when this could be useful 
    */
    modifier checkIfDipositorIsValid(address _requester){
        require(disabled_depositor[_requester] == true, "This depositor address is not valid for this action, or the depositor does not exit");
        _;
    }
    
    
    /*
        modifier:6 -> checks if the depositor has finalized the payment, after this, 
        the arbitror can unlock the money for the recipient
    */
    modifier checkIfPaymentHasBeenConfirmedByDepositor(address _depositor){
        require(deposites[_depositor].confirmation_status == CONFIRMATION_STATUS.FINALIZE_PAYMENT, "The depositor has not yet finalized the payment");
        _;
    }
    



    
// Section4 ============================== > Functions 
   
   
    /*
        function:1 ->
        1. checks if the depositor has permission to deposite
        2. creates the deposite with all necessary informations
        3. adds the deposite information in the map , where depositor's address is the key and the deposite is the value. This deposite can be tracked again with the depositor's id only
        4. emits an event after successfully createing a new deposite 
    */
    function depositeCreate(address payable _recipient) external 
                                                        payable 
                                                        checkIfDepositorCanDeposite(msg.sender){
        address payable _depositor = payable(msg.sender);
        Deposite memory _deposite = Deposite(
                                        {
                                            depositor               :   _depositor,
                                            recipient               :   _recipient,
                                            amount                  :   msg.value,
                                            depositeTime            :   block.timestamp,
                                            confirmation_status     :   CONFIRMATION_STATUS.PENDING 
                                        }
                                    );
        deposites[_depositor] = _deposite;
        emit DepositeStatusUpdate(_deposite.depositor, "Deposite CREATED, Status for this depositor's deposite is : PENDING");
    }
    
    
    /*
        function:2 ->
        This function helps the depositor to change the status of the deposite and finalize the payment, so that the arbritror can
        unlock the deposite and send it to the recipient. After successful execution, this function emits an event so that the
        arbritror may become aware of the confimation(arbritor needs to listen to the event from outside the network) 
    */
    function confirmServiceDelivery() external 
                                      checkIfDipositorIsValid(msg.sender)  
                                      depositeStatusPermission(msg.sender) {
        deposites[msg.sender].confirmation_status = CONFIRMATION_STATUS.FINALIZE_PAYMENT;
        emit DepositeStatusUpdate(msg.sender, "payment for recipient CONFIRMED, Status for this depositor's deposite is : FINALIZE_PAYMENT , please wait for the arbitror to unlock the deposite");
    }
    
    
    /*
        function:3 ->
        This function can be called by the arbritor after the depositor confrims that the recipient can be payed 
    */
    function unlockDeposite(address _depositor) external 
                                                checkIfArbitror(msg.sender) 
                                                checkIfDipositorIsValid(_depositor) 
                                                checkIfPaymentHasBeenConfirmedByDepositor( _depositor) {                 
        Deposite memory _deposite = deposites[_depositor];
        uint amount_to_be_transferred = _deposite.amount;
        _deposite.recipient.transfer(amount_to_be_transferred);
        delete deposites[_depositor];
        delete disabled_depositor[_depositor];
        emit DepositeStatusUpdate(_depositor,  "payment sent to recipient, Status for this depositor's deposite is : INACTIVE");
    }
    
    
    /* 
       function:4 ->
       After 24 hours of deposite the depositor can invoke this fuction to withdraw their deposite if they feel that they 
       they no longer want to pay the recipent 
    */
    function withdrawDeposite() external 
                                checkIfDipositorIsValid(msg.sender) 
                                depositeStatusPermission(msg.sender)
                                withdrawalTimePermmission(msg.sender) {    
        Deposite memory _deposite = deposites[msg.sender];        
        _deposite.depositor.transfer(_deposite.amount);
        delete deposites[msg.sender];
        delete disabled_depositor[msg.sender];
        emit DepositeStatusUpdate(_deposite.depositor, "Deposite WITHDRAWN, Status for this depositor's deposite is : INACTIVE");
    }
    
    
    /* 
        function:5 -> 
        The arbitror can call this function if they want to see the current status of any deposite 
    */
    function getDepositStatus(address _depositorAddress) external 
                                                         view 
                                                         checkIfDipositorIsValid(_depositorAddress) 
                                                         returns(string memory){ 
        Deposite memory deposite = deposites[_depositorAddress];
        string memory status;
        if(deposite.confirmation_status == CONFIRMATION_STATUS.INACTIVE){
            status = "inactive";
        }
        if(deposite.confirmation_status == CONFIRMATION_STATUS.FINALIZE_PAYMENT){
            status = "payment finalized, waiting for the arbritor to unlock";
        }
        if(deposite.confirmation_status == CONFIRMATION_STATUS.PENDING){
            status = "pending confirmation by the depositor";
        }
        return status;
    }
    
    
    /* 
        function:6 ->
       This method returns the balance of this contract, anyone can call this function to chek the balance 
    */
    function getContractBalance() external 
                                  view 
                                  returns(uint){
        return address(this).balance;
    }
    
    
    /*
        function:7 ->
        This function is used to put the depositor in the disabled list, so that they may not be able to deposite until they're
        removed from the list 
    */
    function disableDepositorToDeposite(address _depositorAddress) internal{
        disabled_depositor[_depositorAddress] = true;
    }
    
    /*
        function:8 ->
        This function is used to get the deposite information
    */
    function getDepositInfo(address _depositorAddress) external 
                                                         view 
                                                         checkIfDipositorIsValid(_depositorAddress) 
                                                         returns(Deposite memory){ 
        return deposites[_depositorAddress];
    }
    

}