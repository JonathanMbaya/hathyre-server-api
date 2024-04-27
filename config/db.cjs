const mongoose = require('mongoose');

module.exports = () => {
  mongoose.set("strictQuery", false);
  
  mongoose
  .connect("mongodb+srv://jonathanmbaya13:hathyre1234@app-hathyre.grr5ukx.mongodb.net/")
  .then(() => {
    console.log('Mongodb connected....');
  })
  .catch(err => console.log(err.message));

  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to db...');
  });

  mongoose.connection.on('error', err => {
    console.log(err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose connection is disconnected...');
  });

  process.on('SIGINT', () => {
    mongoose.connection.close(() => {
      console.log(
        'Mongoose connection is disconnected due to app termination...'
      );
      process.exit(0);
    });
  });
};