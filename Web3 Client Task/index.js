const escrowCaller = require('./EscrowCaller');
const express = require('express');
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(bodyParser.json());
app.use(cors());


// ======================================== section 1: Static contents =======================================
app.get('/',(req, res)=>{
    res.sendFile(path.join(__dirname, './public/index.html'));
});

app.get('/static/arbitror',(req, res)=>{
    res.sendFile(path.join(__dirname, './public/static/arbitror.html'));
});

app.get('/static/depositor',(req, res)=>{
    res.sendFile(path.join(__dirname, './public/static/depositor.html'));
});


// ======================================== section 2: Makes Use of Web3 =======================================

// function - > 2.1 (createAccount())
app.post("/account/creation",async(req, res)=>{
    
    let apiResponse = {};

    try{
        let web3Response = await escrowCaller.createAccount();
        apiResponse = web3Response
    }
    catch(err){
        apiResponse = err;
    }
    res.send(apiResponse);
});

// function - > 2.2 (getAccountBalance(accountAddress))
app.post("/account/balance",async(req, res)=>{
    let apiResponse = {};

    try{

        let requestBody     = req.body;
        let accountAddress  = requestBody.address;
        let web3Response = await escrowCaller.getAccountBalance(accountAddress);
        apiResponse = web3Response;
    }
    catch(err){
        apiResponse = err
    }
    res.send(apiResponse);
});

// function - > 2.3 (getNonceForAddress(address))
app.post("/account/nonce",async(req, res)=>{
    let apiResponse = {};

    try{
        let requestBody     = req.body;
        let address         = requestBody.address;
        let web3Response = await escrowCaller.getNonceForAddress(address);
        apiResponse = web3Response;
    }
    catch(err){
        apiResponse = err
    }
    res.send(apiResponse);
});

// function - > 2.4 (createDeposite(depositorAddress, depositorPrivateKey, recipeintAddress, amount))
app.post("/deposite/creation",async(req, res)=>{
    let apiResponse = {};

    try{

        let requestBody         = req.body;
        let depositorAddress    = requestBody.depositorAddress;
        let depositorPrivateKey = requestBody.depositorPrivateKey; 
        let recipeintAddress    = requestBody.recipeintAddress; 
        let amount              = requestBody.amount;

        if(!depositorAddress || !depositorPrivateKey || !recipeintAddress || !amount){

        }

        let web3Response = await escrowCaller.createDeposite(depositorAddress, depositorPrivateKey, recipeintAddress, amount);
        apiResponse = web3Response;
    
    }
    catch(err){
        apiResponse = err;
    }
    res.send(apiResponse);
});

// function - > 2.5 (confirmServiceDelivery(depositorAddress, depositorPrivateKey))
app.post("/deposite/confirmation",async(req, res)=>{
    let apiResponse = {};

    try{

        let requestBody         = req.body;
        let depositorAddress    = requestBody.depositorAddress; 
        let depositorPrivateKey = requestBody.depositorPrivateKey;
        let web3Response = await escrowCaller.confirmServiceDelivery(depositorAddress, depositorPrivateKey);
        apiResponse = web3Response
    
    }
    catch(err){
        apiResponse = err;
    }
    res.send(apiResponse);
});

// function - > 2.6 (unlockDeposite(arbitrorAddress, depositorAddress, arbitrorPrivateKey))
app.post("/deposite/unlock",async(req, res)=>{
    let apiResponse = {};

    try{

        let requestBody         = req.body;
        let arbitrorAddress     = requestBody.arbitrorAddress;
        let depositorAddress    = requestBody.depositorAddress; 
        let arbitrorPrivateKey  = requestBody.arbitrorPrivateKey;
        let web3Response = await escrowCaller.unlockDeposite(arbitrorAddress, depositorAddress, arbitrorPrivateKey);
        apiResponse = web3Response;
    }
    catch(err){
        apiResponse = err
    }
    res.send(apiResponse);
});

// function - > 2.7 (withdrawDeposite(depositorAddress, depositorPrivateKey))
app.post("/deposite/withdraw",async(req, res)=>{
    let apiResponse = {};
    try{

        let requestBody         = req.body;
        let depositorAddress    = requestBody.depositorAddress;
        let depositorPrivateKey = requestBody.depositorPrivateKey;
        let web3Response = await escrowCaller.withdrawDeposite(depositorAddress, depositorPrivateKey);
        apiResponse = web3Response
    }
    catch(err){
        apiResponse = err
    }
    res.send(apiResponse);
});

// function - > 2.8 (getDepositStatus(depositorAddress))
app.post("/deposite/status",async(req, res)=>{
    let apiResponse = {};

    try{

        let requestBody             = req.body;
        let depositorAddress        = requestBody.depositorAddress;
        let web3Response = await escrowCaller.getDepositStatus(depositorAddress);
        apiResponse = web3Response
    }
    catch(err){
        apiResponse = err
    }
    res.send(apiResponse);
});

// function - > 2.9 (getContractBalance())
app.post("/contract/balance",async(req, res)=>{
    let apiResponse = {};

    try{
        let web3Response = await escrowCaller.getContractBalance();
        apiResponse = web3Response
    }
    catch(err){
        apiResponse = err
    }
    res.send(apiResponse);
});

// function - > 2.10 (getDepositeInfo(depositorAddress))
app.post("/deposite/info",async(req, res)=>{
    let apiResponse = {};

    try{

        let requestBody                 = req.body;
        let depositorAddress            = requestBody.depositorAddress;
        let web3Response = await escrowCaller.getDepositeInfo(depositorAddress);
        apiResponse = web3Response;
    }
    catch(err){
        apiResponse = err;
    }
    res.send(apiResponse);
});

app.get("/deposite/pending-unlock", async(req, res)=>{
    let listOfLockedPendingDeposites = await escrowCaller.getPendingToBeUnlockedDeposites();
    res.send(listOfLockedPendingDeposites);
})

// ======================================== section 3 : helper section =======================================

function formatSuccessResponse(value){
    let response = {};
    response.status     = 200;
    response.message    = "success";
    response.data       = value;
    return response;
}

function formatFailureResponse(value){
    let response = {};
    response.status     = 500;
    response.message    = "failure";
    response.error      = value;

    return response;
}

// ======================================== section last : final section =======================================
const port = 8085;
app.listen(port,()=>{
    console.log("server started successfully at port " + port);
});