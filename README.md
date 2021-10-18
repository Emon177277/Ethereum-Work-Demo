# __Ethereum Demo__

## ___Problem Statement___ 

The goal is to create a naive escrow smart contract and a dapp for it.

One user (Depositor) makes a deal with another one (Recipient) to pay ether for some off-chain service. Until Recipient has delivered the service, ether is locked in the escrow smart contract. Third user (Arbitror) acts as a guarantor and ensures that Recipient gets ethers only when Depositor receives the service (how it is done is out of scope here, we just need to provide a way for Arbitror to release the money). In the case when Recipient doesn’t deliver the service on time, Depositor can withdraw his deposit back.

___Smart Contract :___  

We have to write a simple smart contract with the following properties:

- anyone can send/deposit ether to the contract. Each deposit should have a receipient address specified
- allows only one deposit per account at a time
- depositors should be able to withdraw their deposits, but not earlier than 24 hours after deposit.
- arbitror should be able to unlock deposit of any account any time. When unlocked ether should be transferred to recipient’s account.
  
___Dapp :___  

Create a simple app to work with the smart contract above. It should support both Depositor and Arbitror users.

___Tools :___
- Truffle
- Node.js
- Web3
- Postman
- Visual Studio Code
---
## __Part - 1 : Running the network and deploying the smart contract in the network__  
---  

___Step 1 : Download/Clone this repository___  
___Step 2 : install Truffle___  
- open cmd/terminal and enter the following command. This will install Truffle globally in your machine

~~~
npm install -g truffle  
~~~

___Step 3 : compiling the Smart Contract___
- open terminal/cmd in the __'Solidity TasK'__ folder
- run the command below to compile the contracts
~~~
truffle compile
~~~
- above line will compile both of the smart contracts in the contracts folder. 
(running truffle init provided one default contract which I didn't delete)

- The name of my smart contract for this project is __'Escrow.sol'__.

___Step 4 : Run the Network___
- from the __'Solidity Task'__ folder run the command below in the terminal/cmd.

~~~
truffle develop
~~~
- you can see that after this command, 10 unlocked accounts and their private keys will be genarated for your use  


___Step 5 : Migrate the Smart Contracts in the Network___  

- again from the __'Solidity Task'__ folder. run the command below

~~~
migrate --reset
~~~
- after this command your contracts will be compiled and deployed in the network using the first account from the genarated account list. This account is going to be our arbitror's account. 

__* note: Keep it running, don't close the terminal.__
  
---

## __Part - 2 : Running the Dapp__  
--- 
___Step 1 : Installing dependencies___
- move to ___'Web3 Client Task'___ folder and open cmd/terminal and run the command.

~~~
npm install
~~~

- above command will install all the necessary dependencies for the project.

___Step 2 : Runing the web3 server client.___
- although I've installed nodemon but for some reason. Its not working. if you wish you can run the project with the following command which uses nodemon. but don't expect that it will reset the server automatically in case of error, because nodemon does run the program but it isn't restarting in case of error.

~~~
npm start
~~~

- if ou wish you can run the project with this command too.

~~~
node index.js
~~~

- this will start the server and the api will be available which you can use to communicate with the web3 client. its running in [localhost:8085]().

- I've provided a [__web3.json__](https://github.com/Emon177277/Blockchain-Assignment/blob/main/web3.json) file which you can import in postman to communicate with the api. all the endpoints and request bodies are described there.  

___Step 3 : Use the Dapp as a regular depositor user___
- go to [localhost:8085](http://localhost:8085/) and click on the [Go to Depositor Section](http://localhost:8085/static/depositor). 

- I haven't used a database or any user management mechanism in the system ___(as that was not the goal)___ in my application yet, due to time contraints. So everytime you make a request that requires your identification, you need to fill up the necessary informations before you call that function.  

- if you first click on the buttons, and if they require inputs, they will let you know which fields should be filled up before you execute the function.   

- you can see the result of clicking each button in the __Results__ section at the bottom of the page.

___Step 4 : Use the Dapp as an arbitror___
- go to [localhost:8085](http://localhost:8085/) and click on the [Go to Arbitror Section](http://localhost:8085/static/arbitror).  

- just like the depositor section, click on any button, it will tell you which fields can not be empty.

- you can see the result of clicking each button in the __Results__ section at the bottom of the page.



### ___*note___ : For the solidity descriptions checkout the  [__Escrow.sol__](https://github.com/Emon177277/Blockchain-Assignment/blob/main/Solidity%20Task/contracts/Escrow.sol) file. I've provided detailed descriptions on how each function works right above the functions themselves as comments.

### ___*note___ : For the contract interacction part please take a look at the [__EscrowCaller.js__](https://github.com/Emon177277/Blockchain-Assignment/blob/main/Web3%20Client%20Task/EscrowCaller.js) file. I've also written detailed descriptions of how each function is working here.  

### ___*note___ : Since I did not use a database so I used a javascript set to keep track of the diposits that were approved by the depositer so that their reciepents could be payed. The recipents will be payed immedietly when the arbitror unlocks these deposits for them.This list will go reset to null everytime the server restarts.






