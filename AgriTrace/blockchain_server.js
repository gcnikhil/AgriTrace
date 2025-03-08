import db from "./firebase.js";
import contract from "./blockchain.js";

console.log("Backend application started...");

const ref = db.ref("users"); // Path to monitor in Firebase

ref.on("child_added", async (snapshot) => {
  const data = snapshot.val(); // Get new data from Firebase
  console.log("New data received from Firebase:", data);

  try {
    console.log("Adding data to blockchain...");
    const dataString = JSON.stringify(data);
    const tx = await contract.addData(dataString); // Call the smart contract function
    console.log("Transaction sent. Hash:", tx.hash);

    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    console.log("Transaction mined. Receipt:", receipt);
  } catch (error) {
    console.error("Error interacting with smart contract:", error);
  }
});
