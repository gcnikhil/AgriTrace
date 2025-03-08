const { Web3 } = require('web3');

// Connect to Ganache
const ganacheUrl = 'http://localhost:7545';
const web3 = new Web3(ganacheUrl);

// Contract ABI and address
const contractABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_jsonData",
                "type": "string"
            }
        ],
        "name": "addData",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "dataCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "data",
        "outputs": [
            {
                "internalType": "string",
                "name": "jsonData",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
const contractAddress = '0x23d0a01007a211b99D7c2812Aa19f7fd0231d65A';

// Create contract instance
const contract = new web3.eth.Contract(contractABI, contractAddress);

// Function to add data to Ethereum blockchain
const addToEthereum = async (data) => {
    const accounts = await web3.eth.getAccounts();
    const result = await contract.methods
        .addData(JSON.stringify(data))
        .send({ from: accounts[0], gas: 3000000 });
    return result;
};

// Function to get all data from Ethereum blockchain
const getEthereumData = async () => {
    const dataCount = await contract.methods.dataCount().call();
    const data = [];
    
    for (let i = 0; i < dataCount; i++) {
        const item = await contract.methods.data(i).call();
        data.push(JSON.parse(item.jsonData));
    }
    
    return data;
};

module.exports = { addToEthereum, getEthereumData };
