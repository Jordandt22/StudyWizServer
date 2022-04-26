const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// User
const UserSchema = new Schema(
  {
    fbId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Term
const TermSchema = new Schema(
  {
    term: {
      type: String,
      required: true,
    },
    definition: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Privacy
const PrivacySchema = new Schema({
  hideCreator: {
    type: Boolean,
    default: false,
  },
  private: {
    type: Boolean,
    default: false,
  },
});

// Set
const SetSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    creatorFbId: {
      type: String,
      required: true,
    },
    privacy: PrivacySchema,
    terms: [TermSchema],
    users: [UserSchema],
    totalUsers: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("set", SetSchema);
