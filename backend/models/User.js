const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    username: {
      type: String,
      trim: true,
      default: null,
    },
    walletAddress: {
      type: String,
      trim: true,
      default: null,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    tickets: [
      {
        destinationId: Number,
        txHash: String,
        tokenId: Number,
        purchasedAt: { type: Date, default: Date.now },
      },
    ],
    favorites: [
      {
        type: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
