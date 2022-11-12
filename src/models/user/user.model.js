const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Term Schemas
const TermSchema = new Schema(
  {
    termId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Set Schema
const SetSchema = new Schema(
  {
    setId: {
      type: String,
      required: true,
    },
    creatorFbId: {
      type: String,
      required: true,
    },
    lastRequested: {
      type: Date,
      default: new Date(),
    },
    favorite: { type: Boolean, default: false },
    favoriteTerms: [TermSchema],
  },
  { timestamps: true }
);

// User
const UserSchema = new Schema(
  {
    provider: {
      type: String,
      enum: ["password", "google.com"],
      required: true,
    },
    lastOnline: { type: Date, default: new Date() },
    fbId: {
      type: String,
      required: true,
    },
    sets: [SetSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", UserSchema);
