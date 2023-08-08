const { Schema, model } = require("mongoose");

// defining the user schema
const userSchema = new Schema({
  email: {
    type: String,
    // specifies that the field is required
    required: true,
    // specifies that the field is unique
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  refreshtoken: {
    type: String,
  },
});

// exporting the user model
module.exports = model("User", userSchema);
