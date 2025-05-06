const { MongoClient } = require("mongodb");
const uri = "mongodb://localhost:27017"
const client = new MongoClient(uri);
async function connectDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return client.db("chatdb"); 
  } catch (err) {
    console.error(err);
  }
}

module.exports = connectDB;