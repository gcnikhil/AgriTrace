const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const blockchainFilePath = path.join(__dirname, 'blockchain.json');

class Block {
  constructor(index, timestamp, data, previousHash = "") {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.data)
      )
      .digest("hex");
  }
}

class Blockchain {
  constructor() {
    try {
      if (fs.existsSync(blockchainFilePath)) {
        const data = fs.readFileSync(blockchainFilePath, 'utf8');
        if (data.trim() === '') {
          // Initialize with genesis block if file is empty
          this.chain = [this.createGenesisBlock()];
          this.saveChain();
        } else {
          this.chain = JSON.parse(data);
        }
      } else {
        this.chain = [this.createGenesisBlock()];
        this.saveChain();
      }
    } catch (error) {
      console.error('Error initializing blockchain:', error);
      // Initialize with genesis block if there's any error
      this.chain = [this.createGenesisBlock()];
      this.saveChain();
    }
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), "Genesis block", "0");
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addBlock(newBlock) {
    newBlock.previousHash = this.getLatestBlock().hash;
    newBlock.hash = newBlock.calculateHash();
    this.chain.push(newBlock);
    this.saveChain();
  }

  addData(data) {
    const newBlock = new Block(this.chain.length, Date.now(), data);
    this.addBlock(newBlock);
    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }
    return true;
  }

  saveChain() {
    fs.writeFileSync(blockchainFilePath, JSON.stringify(this.chain, null, 2));
  }
}

module.exports = Blockchain;
