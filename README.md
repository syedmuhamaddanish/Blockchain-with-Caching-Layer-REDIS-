# Sample IPFS hash storage project on blockchain with Caching Layer (REDIS)

This project demonstrates a very simple usage of REDIS cache database in web3 application. 

Caching can help improve the performance and scalability of web3 applications by reducing the load on the database, lowering latency, managing network traffic, and handling high traffic periods. Caching can be used to store frequently accessed data in memory, reducing the number of requests to the database. By serving requests from cache, the load on the database can be reduced, improving its performance and scalability. Here, we use REDIS cache database in our DAPP, which stores IPFS hash in the blockchain network. 

The cache functionality is implemented in storing and retreiving hash from the blockchain network in index.js file. When the IPFS hash is stored in the blockchain network, we also store hash in the redis database. Therefore, in case someone wants to access this hash again, they don't have to query the blockchain. To run this project, you first need to install redis using the following link 
```shell
https://redis.io/docs/getting-started/installation/
```

Then simply run the command 

Try running some of the following tasks:

```shell
npm install
```

To uplaod smart contract, run the following commands

```shell
npx hardhat compile
npx hardhat run --network volta scripts/deploy.js
```

Once the contract is uploaded to the blockchain, copy the contract address and copy it in the .env file. You can also use another blockchain by writing the blockchain's endpoint in truffle-config.

Once you have pasted your private key and contract address in the .env file, simply run command

```shell
node index.js
```

and go to http://localhost:3000 to select and upload file on IPFS, and corresponding hash in the blockchain network of your choice.
