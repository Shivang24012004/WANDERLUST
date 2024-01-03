const mongoose = require("mongoose");
const initdata = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
async function main() {
    await mongoose.connect(MONGO_URL);
}

main().then((res) => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
});

const initDB=async()=>{
    await Listing.deleteMany({});
    initdata.data=initdata.data.map((obj)=>({ ...obj ,owner:'658d1bc5eee7f5f1804f11ce'}));
    await Listing.insertMany(initdata.data);
    console.log("DB fed with data");
}

initDB();