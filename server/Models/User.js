import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// A saved shipping address on a customer account. Mirrors the checkout shape
// (wilaya + delivery type) so it can be applied to an order in one click.
const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, default: 'Home' },
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    wilaya: { type: String, trim: true },
    deliveryType: { type: String, enum: ['home', 'desk'], default: 'home' },
    address: { type: String, trim: true },
    desk: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: '' },
    password: { type: String, required: true },
    usertype: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
