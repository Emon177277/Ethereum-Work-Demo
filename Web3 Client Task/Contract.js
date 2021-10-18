
const Web3 = require('web3');
const web3 = new Web3("http://127.0.0.1:9545"); //this project is done for local network only

const Escrow = require("../Solidity Task/build/contracts/Escrow.json");

module.exports = async function(){
    const id = await web3.eth.net.getId();                      // get id 
    const deployedNetwork = Escrow.networks[id];                // get network
    const contractAddressInNetwork = deployedNetwork.address;   // get network address
    
    const contract = new web3.eth.Contract(
        Escrow.abi,
        contractAddressInNetwork
    )
    return contract;
}
