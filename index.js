//Load express module with `require` directive
const express = require('express');
const fileUpload = require('express-fileupload');
const { Web3Storage, getFilesFromPath  } = require('web3.storage');
const fsExtra = require('fs-extra');
const redis = require("redis");
require("dotenv").config()
const app = express();
app.use(
  fileUpload({
    extended: true,
  })
);
app.use(express.json());
const path = require("path");


const ethers = require('ethers');


(async () => {
    //Initializing Redis Client
    redisClient = redis.createClient();
  
    redisClient.on("error", (error) => console.error(`Error : ${error}`));
  
    await redisClient.connect();
})();

//Serving index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Function to define the API call from Redis
async function getSpeciesData(req, res) {
    const dateID = req.params.dateID;  //Search corresponding IPFS hash from a certain date
    let results;
    let isCached = false;    //Variable to see if the result is from Cache or not


    const cacheResults = await redisClient.get(dateID);
    // If data is avaiable in cache, set isCached true
    if (cacheResults != "") {
        isCached = true;
        results = JSON.parse(cacheResults);
    } 
  
  //run else if data is not available in cache
    else {
      // initializing blockchain to call smart contract function to retreive IPFS hash
        const API_URL = process.env.API_URL;
        const PRIVATE_KEY = process.env.PRIVATE_KEY;
        const CONTRACT_ADDRESS_1 = process.env.CONTRACT_ADDRESS;
        // Contract ABI
        const { abi } = require("./artifacts/contracts/IPFShashStorage.sol/IPFShashStorage.json");
        const provider = new ethers.providers.JsonRpcProvider(API_URL);
        // It calculates the blockchain address from private key
        const signer = new ethers.Wallet(PRIVATE_KEY, provider);
        //console.log(signer)
        const StorageContract = new ethers.Contract(CONTRACT_ADDRESS_1, abi, signer);
        let _date = JSON.stringify(dateID);
    
        //Checking if data is already available for certain date and address
        const newMessage = await StorageContract.GetIPFShash(_date);
        if (newMessage != "") {
            results = newMessage;
            await redisClient.set(_date, JSON.stringify(results));
        }
        else {
            console.log("Data is not stored for this date in the blockchain");
        }
            
    }
    
    //Send response to front-end with cached data
    res.send({
       fromCache: isCached,
       data: results,
    });

}

// API call to receive the cached data
app.get("/date/:dateID", getSpeciesData);


app.post("/uploadData", async (req, res) => {
    //Getting form parameters from HTML
    var date = req.body.datefolder;
    var sampleFile = req.files.file1;
    var filename = req.files.file1.name; 
    // Setup date format for influxDB query

    async function moveFiletoServer() {   //storing file in project directory first...
        sampleFile.mv(__dirname + `/${filename}`, err => {
            if (err) {
             return res.status(500).send(err);
            }
            console.log("File added to server")
        });
    }
    
    
    //async function deleteFiles() {
    //    fsExtra.emptyDirSync(__dirname + `${filename}`);
   // }
    //res.send("Data uploaded to blockchain")
    
    
    async function uploaddatatoIPFS() {
        //Uploading file in IPFS web3 storage using the token
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGYwNTMwNUY1NUJiRjM4MjhjNjE2Q0RhYTk0ZDZGN2YzMDVjQTRjYzUiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2NTIxMjY3NTM2MTIsIm5hbWUiOiJTdG9yYWdlU29sIn0.XH1EzxD93lUrJVVnO1uzpzDsmh4XG1PEsdgJdBpVvlk";
      const storage = new Web3Storage({ token: token });
      const files = await getFilesFromPath(__dirname + `/${filename}`);
      console.log(`read ${files.length} file(s) from path`)
      console.log("Uploading file to IPFS. Please wait...")
      const cid = await storage.put(files)
      console.log(`IPFS CID: ${cid}`)
      return(cid)
    }
    
    async function storeDataInBlockchain(date, hash) {
        //Storing the data in blockchain
      const { ethers } = require("hardhat");
      //Environment variables
      const API_URL = process.env.API_URL;
      const PRIVATE_KEY = process.env.PRIVATE_KEY;
      const CONTRACT_ADDRESS_1 = process.env.CONTRACT_ADDRESS;
      // Contract ABI
      const { abi } = require("./artifacts/contracts/IPFShashStorage.sol/IPFShashStorage.json");
      const provider = new ethers.providers.JsonRpcProvider(API_URL);
      // It calculates the blockchain address from private key
      const signer = new ethers.Wallet(PRIVATE_KEY, provider);
      //console.log(signer)
      const StorageContract = new ethers.Contract(CONTRACT_ADDRESS_1, abi, signer);
      let _hash = hash.toString();
      let _date = date;
    
      //Checking if data is already available for certain date and address
      const newMessage = await StorageContract.GetIPFShash(_date);
      if (newMessage == "") {
        console.log("Storing the IPFS hash...");
        const tx = await StorageContract.StoreIPFShash(_hash, _date);
        await tx.wait();
      }
      else {
        console.log("Data is already stored for this date")
      }
      // Shows the stored hash
      const newMessage1 = await StorageContract.GetIPFShash(_date);
      console.log("The stored hash is: " + newMessage1);

      await redisClient.set(date, JSON.stringify(newMessage1));   //store hash data in redis with a key date
    }
    
    
    await moveFiletoServer();
    let hash = await uploaddatatoIPFS();
    
    await storeDataInBlockchain(date, hash)
    //await deleteFiles();
    res.send("ok");

    });


//Launch listening server on port 3000
app.listen(3000, function () {
    console.log('app listening on port 3000!')
})
