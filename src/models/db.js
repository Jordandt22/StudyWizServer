// Mongoose
const mongoose = require("mongoose");

module.exports = () => {
  mongoose.Promise = global.Promise;

  // Connecting to the database
  mongoose.connect(
    process.env.MONGO_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    (err) => {
      if (err !== null) {
        console.log(`Connection Error: ${err}`);
      }
    }
  );

  // Mongoose Connection
  mongoose.connection
    .once("open", () => {
      console.log("Connected to Database...");
    })
    .on("error", (err) => {
      if (err !== null) {
        console.log(`Connection Error: ${err}`);
      }
    });
};
