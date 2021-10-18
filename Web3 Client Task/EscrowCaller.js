/* 
=============================== SECTION 1 : IMPORTING THE NECESSARY LIBRARIES =================================================================
*/
const Web3 = require('web3');
const web3 = new Web3("http://127.0.0.1:9545");
const contract = require("./Contract");
const Tx = require("ethereumjs-tx").Transaction;

const pending_unlocked_deposites = new Set();

function getPendingToBeUnlockedDeposites(){
    const myArr = Array.from(pending_unlocked_deposites);
    return myArr;
}


async function getContract(){
    let escrowContract = await contract();
    return escrowContract;
}


/* 
=============================== SECTION 2 : CONTRACTLESS FUNCTIONS =================================================================
*/

/* 
    function -> 2.1
    calling this function gets the balance of specified account
*/
async function getAccountBalance(accountAddress){
    let resonseObject={}; 
    try{
        let balance = await web3.eth.getBalance(accountAddress);
        resonseObject.response_status   = "success";
        resonseObject.message           = "the balance was successfully retrieved"
        resonseObject.balance              = balance;
    }
    catch(err){
        resonseObject.response_status   = "failure";
        resonseObject.message           = err.data
        resonseObject.detailed_response = err
    }
    // console.log(resonseObject);
    return resonseObject;
}
// getAccountBalance("0x7e5f519016277434da984e820b36578d62a3885e");

/* 
    function - 2.2
    calling this function gets the nonce(number of transactions) for specified account, nonce is important for signing transactions
*/
async function getNonceForAddress(address){
    let resonseObject={};
    try{
        let nonce = await web3.eth.getTransactionCount(address);
        resonseObject.response_status   = "success";
        resonseObject.message           = "";
        resonseObject.data              = nonce;
    }catch(err){
        
        resonseObject.response_status   = "failure";
        resonseObject.message           = err.data;
        resonseObject.detailed_response = err;
    
    }
    // console.log(resonseObject);
    return resonseObject;
}
// getNonceForAddress("0x7e5f519016277434da984e820b36578d62a3885e");

/*
    function - 2.3
    calling this function creates new account and retuns address and privateKey
*/
async function createAccount(){
    let responseObject = {};
    try{
        let addressDetails = await web3.eth.accounts.create();
        responseObject.status   = "success";
        responseObject.message  = "successfully created account";
        responseObject.data     = addressDetails;
    }catch(err){
        responseObject.status           = "failure";
        responseObject.message          = "error occures while creating account"
        responseObject.error_details    = err
    }
    // console.log(responseObject);
    return responseObject;
}
// createAccount();


/* 
=============================== SECTION 3 : CONTRACT FUNCTIONS(TRANSACTION TYPE) =================================================================
*/

/* 
    function - > 3.1
    this function is called by the depositor to deposite money in the smart contract, so that
    it can later be sentto the recipent after the depositor confirms the transaction later, after
    confirmation the arbitror will unlock the deposite and the recipent will recieve the amount specified 
    here in this function. this is a signed transaction, so private key is needed for this function
*/
async function createDeposite(  depositorAddress,
                                depositorPrivateKey, 
                                recipeintAddress, 
                                amount
                                ){
    let responseFromFunction = {};
    try{

        let contractObj = await getContract();
        let noneInfo    = await getNonceForAddress(depositorAddress);
        let nonceNo     = noneInfo.data;
    
        transactionObject = {
            nonce           : web3.utils.toHex(nonceNo),
            gasLimit        : web3.utils.toHex(300000),
            to              : contractObj._address,
            value           : web3.utils.toHex(web3.utils.toWei(amount, 'ether')),
            data            : contractObj.methods.depositeCreate(recipeintAddress).encodeABI()
        }

        
        let responseFromTheNetwork = await signAndSendTheTransaction(depositorPrivateKey, transactionObject)
        responseFromFunction = responseFromTheNetwork;
    }
    catch(err){
        responseFromFunction = {
            status          : "falure",
            message         : "failed execution from createDeposite() function",
            error_details   : err.message
        }
        
    }
    
    // console.log(responseFromFunction);
    
    return responseFromFunction;
}
// createDeposite("0x0e931145ec1c813e4db863a9a08c689c80de09e2","dea3f8f1d80214791197da8acd07b31f3cb453a392e491ac36045d8a67a3f874" ,"0xbd9caec906414d0691fa0ebf1dd51c0c6fdc38af","2")

/*
    function - > 3.2
    this function is called by the depositor to confirm the payment to the recipent, after this function the arbitror can
    unlock the deposite and the recipent will recieve the money. this is a signed transaction, so private key is needed for 
    this function.

    **************** special node ***************  
    also I wanted to use event listener after this function is called (an event is being emmited from the contract). but due
    to time contraints I could not do so. event listener would've helped the arbitror to trac the confirmed payments.
*/
async function confirmServiceDelivery(depositorAddress, depositorPrivateKey){
    
    let responseFromFunction = {};
    try{
        let contractObj = await getContract();
        let noneInfo    = await getNonceForAddress(depositorAddress);
        let nonceNo     = noneInfo.data;
    
        transactionObject = {
            nonce           : web3.utils.toHex(nonceNo),
            gasLimit        : web3.utils.toHex(300000),
            to              : contractObj._address,
            data            : contractObj.methods.confirmServiceDelivery().encodeABI()
        }
    
        let responseFromTheNetwork = await signAndSendTheTransaction(depositorPrivateKey, transactionObject);

        responseFromFunction = responseFromTheNetwork;

        if(responseFromFunction.status != "failure"){
            //I am storing these deposites in a set so that the arbitror can see the list of addresses that needs to be unlocked
            pending_unlocked_deposites.add(depositorAddress);
        }
        
    }
    catch(err){
        // console.log(err);
        responseFromFunction = {
            status          : "falure",
            message         : "failed execution from confirmServiceDelivery function",
            error_details   : err.message
        }
        
    }
    // console.log(pending_unlocked_deposites);
    // console.log(responseFromFunction);
    return responseFromFunction;
}
// confirmServiceDelivery("0x0e931145ec1c813e4db863a9a08c689c80de09e2", "dea3f8f1d80214791197da8acd07b31f3cb453a392e491ac36045d8a67a3f874");

/*
    function - > 3.3
    this function is called by the arbitror after the depositor confirms the payment. 
    this is also a signed transactionand it requires the arbitror's privateKey.
*/
async function unlockDeposite(arbitrorAddress, depositorAddress, arbitrorPrivateKey){
    
    let responseFromFunction = {};
    try{
        let contractObj = await getContract();
        let noneInfo    = await getNonceForAddress(arbitrorAddress);
        let nonceNo     = noneInfo.data;
    
        transactionObject = {
            nonce           : web3.utils.toHex(nonceNo),
            gasLimit        : web3.utils.toHex(300000),
            to              : contractObj._address,
            data            : contractObj.methods.unlockDeposite(depositorAddress).encodeABI()
        }
    
        let responseFromTheNetwork = await signAndSendTheTransaction(arbitrorPrivateKey, transactionObject)
        responseFromFunction = responseFromTheNetwork;

        // deleting the addresses after arbitror unlocks them successfully, this should have been done with event listener,
        // but I was not able to implement it within this time.
        if(responseFromFunction.status == "success" ){
            pending_unlocked_deposites.delete(depositorAddress);
        }
    }
    catch(err){
        responseFromFunction = {
            status          : "falure",
            message         : "failed execution from unlockDeposite function",
            error_details   : err
        }
        
    }
    
    console.log(responseFromFunction);
    
    return responseFromFunction;
}
// unlockDeposite("0xf6a9bce0c5cab5f1b079089a13d230a7ba99e154","0x0e931145ec1c813e4db863a9a08c689c80de09e2", "9a5425ad4f477c7474a50a24fe7004eed10b4a6a00362f460f6bbf50e65a274b");

/*
    function - > 3.4
    this function is called by the depositor to withdraw their deposite ammount, 
    calling this function withing 24 hours of deposite will throw an error because 
    they are no allowed to withdraw the money withing 24 hours of deposite

    this functions is also a transaction type and needs the callers private key
*/
async function withdrawDeposite(depositorAddress, depositorPrivateKey){
    
    let responseFromFunction = {};
    try{
        let contractObj = await getContract();
        let noneInfo    = await getNonceForAddress(depositorAddress);
        let nonceNo     = noneInfo.data;
    
        transactionObject = {
            nonce           : web3.utils.toHex(nonceNo),
            gasLimit        : web3.utils.toHex(300000),
            to              : contractObj._address,
            data            : contractObj.methods.withdrawDeposite().encodeABI()
        }
    
        let responseFromTheNetwork = await signAndSendTheTransaction(depositorPrivateKey, transactionObject)
        responseFromFunction = responseFromTheNetwork;
    }
    catch(err){
        responseFromFunction = {
            status          : "falure",
            message         : "failed execution from withdrawDeposite() function",
            error_details   : err
        }
        
    }
    
    // console.log(responseFromFunction);
    
    return responseFromFunction;
}
// withdrawDeposite("0x0e931145ec1c813e4db863a9a08c689c80de09e2", "9a5425ad4f477c7474a50a24fe7004eed10b4a6a00362f460f6bbf50e65a274b");


/* 
=============================== SECTION 4 : CONTRACT FUNCTIONS(VIEW TYPE) =================================================================
*/

/*
    function - > 4.1
    this functions takes the depositor address as an argument, as the 
    same address is also the deposite uniq id in the smartcontract
    then it returns the status of that deposite status ( string value ) 
*/
async function getDepositStatus(depositorAddress){
    let resonseObject={};
    try{
        let contractObj = await getContract();
        let reciept = await contractObj.methods.getDepositStatus(depositorAddress).call();
        resonseObject = generateSuccessResponseForCallFunctions(reciept)
    }catch(err){
        resonseObject= generateFailedResponseForCallFunctions(err)
    }
    // console.log(resonseObject);
    return resonseObject;
}
// getDepositStatus("0x0e931145ec1c813e4db863a9a08c689c80de09e2");

/*
    function - > 4.2
    this is a view function that returns the balance of the contract, anyone can call this function
    I've made this function available for everyone because they can check the balance of this contract anyway
    if they look it up in the etherscan.io
*/
async function getContractBalance(){
    let resonseObject={};
    try{
        let contractObj = await getContract();
        let reciept = await contractObj.methods.getContractBalance().call();
        resonseObject = reciept;
    }catch(err){
        resonseObject= err;
    }
    // console.log(resonseObject);
    return resonseObject;
}
// getContractBalance();

/*
    function - > 4.3
    this is a view function that returns the detailed information of a deposite, it also takes in the 
    depositors address as an input, because that address is used as a uniqe identifier for the deposite
*/
async function getDepositeInfo(depositorAddress){
      
    let resonseObject={};

    try{
        let contractObj = await getContract();
        let reciept = await contractObj.methods.getDepositInfo(depositorAddress).call();
        resonseObject = generateSuccessResponseForCallFunctions(reciept)
    }catch(err){
        resonseObject= generateFailedResponseForCallFunctions(err)
    }
    // console.log(resonseObject);
    return resonseObject;
   
}
// getDepositeInfo("0x0e931145ec1c813e4db863a9a08c689c80de09e2");




/* 
=============================== SECTION 5 : HELPER FUNCTIONS =================================================================
*/

/* 
    function - > 5.1
    this functions is used to send signed transactions with private key for locked accounts, this is not necessary for 
    local accouts like the one in this project but in a public test net, transactions must be signed so I've added this
*/
async function signAndSendTheTransaction(privateKey, transactionObject){
    
    let responseFromBlockchainNetwork = {};

    try{
        let bufferedPrivateKey = Buffer.from(privateKey, "hex");
        let tx = new Tx(transactionObject);
        tx.sign(bufferedPrivateKey);
        let serializedTx = tx.serialize();
        
        let txHex = "0x" + serializedTx.toString("hex");
        // console.log("tx porjonto ashche")

        reciept = await web3.eth.sendSignedTransaction(txHex);

        // console.log("recept porjonto ashche")

        responseFromBlockchainNetwork = {
            status  : "success",
            message : "the request was successfull",
            data    : reciept 
        }

    }catch(err){

        // console.log("formation er aage ashche")
        responseFromBlockchainNetwork = {
            status              : "failure",
            message             : Object.values(err.data)[0].reason,
            error_details       : err.data
        }

        // console.log("ekhane ashche")
    }
    return responseFromBlockchainNetwork;
}

/* 
    function - > 5.2
    this helps genarates a success response for the 'view' type functions
*/
function generateSuccessResponseForCallFunctions(reciept){
    let resonseObject={};
    resonseObject.response_status   = "success";
    resonseObject.message           = "successfully retrived depositeInfo"
    resonseObject.detailed_response = reciept;
    return resonseObject;
}

/* 
    function -> 5.3
    this helps genarate a failure response for the 'vew' type functions
*/
function generateFailedResponseForCallFunctions(err){
    let resonseObject={};
    resonseObject.response_status   = "failure";
    resonseObject.message           = Object.values(err.data)[0].reason
    resonseObject.detailed_response = err.data
    return resonseObject;
}


/* 
=============================== SECTION 6 : EXPORT THE FUNCTIONS TO BE USED FROM OUTSIDE THIS FILE =============================
*/


module.exports = {
    createAccount,
    getAccountBalance,
    getNonceForAddress,
    createDeposite,
    confirmServiceDelivery, 
    unlockDeposite, 
    withdrawDeposite, 
    getDepositStatus, 
    getContractBalance, 
    getDepositeInfo,
    getPendingToBeUnlockedDeposites
}