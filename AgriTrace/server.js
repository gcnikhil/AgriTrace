const { initializeApp } = require("firebase/app");
const express = require("express");
const {
  getDatabase,
  ref,
  get,
  set,
  push,
  update,
  onChildAdded,
} = require("firebase/database");
const Blockchain = require("./blockchain.js");
const { addToEthereum, getEthereumData } = require("./ethereum.js");

// Initialize blockchain
const blockchain = new Blockchain();
//import inquirer from 'inquirer';
//import qr from 'qr-image';
//import fs from 'fs';
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));


const appp = initializeApp(firebaseConfig);
const database = getDatabase(appp);

// Track server start time
const serverStartTime = Date.now();

// Add real-time listener for ESP32 data with loop prevention
let processing = false;
const esp32DataRef = ref(database, "data");
onChildAdded(esp32DataRef, (snapshot) => {
  if (processing) return; // Prevent overlapping processing
  processing = true;

  try {
    const data = snapshot.val();
    if (!data) {
     // console.log("Empty data received - skipping");
      return;
    }

    // If data doesn't have a timestamp, assume it's new
    if (!data.timestamp || data.timestamp > serverStartTime) {
     // console.log("New ESP32 data received:", data);

      // Add only the new data to blockchain
      // console.log(
      //   "Before adding to blockchain - Chain length:",
      //   blockchain.chain.length
      // );
     // console.log('Current blockchain:', JSON.stringify(blockchain.chain, null, 2));
      
      const newBlock = blockchain.addData(data);
      //console.log("New ESP32 data added to blockchain:", newBlock);
      
     // console.log(
      //  "After adding to blockchain - Chain length:",
      //  blockchain.chain.length
      //);
      //console.log('Updated blockchain:', JSON.stringify(blockchain.chain, null, 2));
      //console.log("Latest block:", blockchain.getLatestBlock());
      //console.log("Is chain valid:", blockchain.isChainValid());
      
      // Verify the new block was actually added
      if (blockchain.chain[blockchain.chain.length - 1].hash !== newBlock.hash) {
        //console.error('Error: New block was not added to the chain!');
      }
    } else {
      // console.log(
      //   "Old data received (timestamp:",
      //   data.timestamp,
      //   "server start:",
      //   serverStartTime,
      //   ") - skipping"
      // );
    }
  } catch (error) {
   // console.error("Error processing new ESP32 data:", error);
  } finally {
    processing = false; // Reset processing flag
  }
});

const getNextSerialNumber = async () => {
  const serialRef = ref(database, "serialNumber");
  const snapshot = await get(serialRef);
  if (snapshot.exists()) {
    const currentSerialNumber = snapshot.val();
    const newSerialNumber = currentSerialNumber + 1;
    await set(serialRef, newSerialNumber);
    return newSerialNumber;
  } else {
    await set(serialRef, 1);
    return 1;
  }
};

const saveToFirebaseAndBlockchain = async (path, data) => {
  try {
    // Save to Firebase
    const dbRef = ref(database, path);
    await set(dbRef, data);

    // Save to Blockchain
    blockchain.addData(data);
    // Save to Ethereum
    await addToEthereum(data);

    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    throw error;
  }
};

const saveMessages = async (name, emailid, msgContent) => {
  const serialNumber = await getNextSerialNumber();
  const data = {
    serialNumber: serialNumber,
    name: name,
    emailid: emailid,
    msgContent: msgContent,
  };

  await saveToFirebaseAndBlockchain(`user feedback/${serialNumber}`, data);
  return serialNumber;
};
var user_id;
app.post("/submit", async (req, res) => {
  const { name, emailid, msgContent } = req.body;
  console.log(name, emailid, msgContent);

  try {
    const serialNumber = await saveMessages(name, emailid, msgContent);
    //res.redirect(`/${serialNumber}`);
    res.redirect("/1");
  } catch (error) {
    console.error("Error saving message:", error);
   // res.status(500).send("Internal Server Error");
   res.redirect("/?error=Internal Server Error");
  }
});




app.get("/:id", async (req, res) => {
   user_id = req.params.id;

  // Skip favicon requests
  if (user_id === "favicon.ico") {
    return res.status(204).end();
  }

  console.log(`Received user_id: ${user_id}`);

  const userRef = ref(database, `data/user${user_id}/${user_id}`);
  try {
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      res.render("iot.ejs", {
        air_quality: data.air_quality,
        PH: data.pH,
        humidity: data.humidity,
        ph_spike: data.pH_spikes,
        pressure: data.pressure,
        soil_moisture: data.soil_moisture,
        soil_temp: data.soil_temp,
        temperature: data.temperature,
        location : data.location,
        producer_name : data.producer_name,
        product_name : data.product_name,

      });
    } else {
      console.log("No data available");
      res.render("iot.ejs", {
        air_quality: "N/A",
        PH: "N/A",
        humidity: "N/A",
        ph_spike: "N/A",
        pressure: "N/A",
        soil_moisture: "N/A",
        soil_temp: "N/A",
        temperature: "N/A",
        location: "N/A",
        producer_name: "N/A",
        product_name: "N/A"
      });
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Endpoint for generic data storage
app.post("/data", async (req, res) => {
  const { path, data } = req.body;

  try {
    await saveToFirebaseAndBlockchain(path, data);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Failed to save data" });
  }
});

// Endpoint to view blockchain
app.get("/blocks", async (req, res) => {
  try {
    res.setHeader("Content-Type", "application/json");
    const ethereumData = await getEthereumData();
    res.json({
      localChain: blockchain.chain,
      isValid: blockchain.isChainValid(),
      ethereumData: ethereumData,
    });
  } catch (error) {
    console.error("Error fetching blockchain:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// const localhostURL = `http://localhost:${PORT}`;

// // Function to generate QR code and save it
// function generateQRCode(url) {
//   var qr_img = qr.image(url);
//   qr_img.pipe(fs.createWriteStream('@Project FortiFiy.png'));

//   fs.writeFile("URL.txt", url, (err) => {
//     if (err) throw err;
//     console.log("The file has been saved!");
//   });
// }

// // Generate the QR code without user input
// console.log(`Generating QR code for URL: ${localhostURL}`);
// generateQRCode(localhostURL);
