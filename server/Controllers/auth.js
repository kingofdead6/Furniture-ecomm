import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import User from '../Models/User.js';
import validator from 'validator';

const signToken = (user) =>
  jwt.sign({ id: user._id, usertype: user.usertype }, process.env.JWT_SECRET, { expiresIn: '30d' });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  usertype: user.usertype,
});

// Login user
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !validator.isEmail(email)) {
    res.status(400);
    throw new Error('Valid email is required');
  }
  if (!password) {
    res.status(400);
    throw new Error('Password is required');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  res.status(200).json({ token: signToken(user), usertype: user.usertype, user: publicUser(user) });
});

// Public customer signup — always creates a 'user' account.
export const registerCustomer = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  if (!name || !validator.isLength(name, { min: 1, max: 100 })) {
    res.status(400);
    throw new Error('Please enter your name');
  }
  if (!email || !validator.isEmail(email)) {
    res.status(400);
    throw new Error('A valid email is required');
  }
  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    res.status(400);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase(),
    phone: phone?.trim() || '',
    password,
    usertype: 'user',
  });

  res.status(201).json({ token: signToken(user), usertype: user.usertype, user: publicUser(user) });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist', 'name slug price images').lean();
  res.json(user);
});

// PUT /api/auth/me — update own profile.
export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { name, phone, password } = req.body;
  if (name) user.name = name.trim();
  if (phone !== undefined) user.phone = phone.trim();
  if (password) {
    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }
    user.password = password;
  }
  await user.save();
  res.json(publicUser(user));
});

// ── Address book ─────────────────────────────────────────────────────────────
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = req.body;
  if (address.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  if (user.addresses.length === 0) address.isDefault = true;
  user.addresses.push(address);
  await user.save();
  res.status(201).json(user.addresses);
});

export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }
  if (req.body.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  Object.assign(address, req.body);
  await user.save();
  res.json(user.addresses);
});

export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) {
    res.status(404);
    throw new Error('Address not found');
  }
  address.deleteOne();
  await user.save();
  res.json(user.addresses);
});

// ── Wishlist ─────────────────────────────────────────────────────────────────
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'name slug price compareAtPrice images ratingAvg')
    .lean();
  res.json(user.wishlist || []);
});

export const toggleWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const { productId } = req.body;
  if (!productId) {
    res.status(400);
    throw new Error('productId is required');
  }
  const idx = user.wishlist.findIndex((id) => String(id) === String(productId));
  if (idx >= 0) user.wishlist.splice(idx, 1);
  else user.wishlist.push(productId);
  await user.save();
  res.json({ wishlist: user.wishlist });
});

// Register user (superadmin only)
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, usertype } = req.body;
  console.log('Register user request:', { name, email, usertype });

  if (!name || !validator.isLength(name, { min: 1, max: 100 })) {
    console.error('Invalid name');
    res.status(400);
    throw new Error('Valid name required');
  }
  if (!email || !validator.isEmail(email)) {
    console.error('Invalid email');
    res.status(400);
    throw new Error('Valid email required');
  }
  if (!password || password.length < 6) {
    console.error('Invalid password');
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }
  if (!usertype || !['user', 'admin', 'superadmin'].includes(usertype)) {
    console.error('Invalid usertype');
    res.status(400);
    throw new Error('Valid usertype required');
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.error('Email already exists');
    res.status(400);
    throw new Error('Email already exists');
  }

  const user = await User.create({ name, email, password, usertype });
  console.log('User registered:', user._id);
  res.status(201).json({ id: user._id, name, email, usertype });
});

// Get all users (superadmin only)
export const getUsers = asyncHandler(async (req, res) => {
  console.log('Fetching all users');
  const users = await User.find({}).select('-password').lean();
  console.log('Retrieved users:', users.length);
  res.status(200).json(users);
});

// Update user (superadmin only)
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, usertype } = req.body;
  console.log('Update user request:', { id: req.params.id, name, email, usertype });

  const user = await User.findById(req.params.id);
  if (!user) {
    console.error('User not found:', req.params.id);
    res.status(404);
    throw new Error('User not found');
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (usertype) user.usertype = usertype;

  await user.save();
  console.log('User updated:', user._id);
  res.status(200).json({ id: user._id, name: user.name, email: user.email, usertype: user.usertype });
});

// Delete user (superadmin only)
export const deleteUser = asyncHandler(async (req, res) => {
  console.log('Delete user request:', req.params.id);
  const user = await User.findById(req.params.id);
  if (!user) {
    console.error('User not found:', req.params.id);
    res.status(404);
    throw new Error('User not found');
  }
  if (user.usertype === 'superadmin') {
    console.error('Cannot delete superadmin');
    res.status(400);
    throw new Error('Cannot delete superadmin');
  }
  await User.deleteOne({ _id: req.params.id });
  console.log('User deleted:', req.params.id);
  res.status(200).json({ message: 'User deleted' });
});

// Register Super Admin 
export const registerSuperAdmin = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  console.log('Register superadmin request:', { name, email });

  // ✅ Validation
  if (!name || !validator.isLength(name, { min: 1, max: 100 })) {
    console.error('Invalid name');
    res.status(400);
    throw new Error('Valid name required');
  }
  if (!email || !validator.isEmail(email)) {
    console.error('Invalid email');
    res.status(400);
    throw new Error('Valid email required');
  }
  if (!password || password.length < 6) {
    console.error('Invalid password');
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }


  // ✅ Prevent duplicate email
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.error('Email already exists');
    res.status(400);
    throw new Error('Email already exists');
  }

  // ✅ Create superadmin
  const superAdmin = await User.create({
    name,
    email,
    password,
    usertype: 'superadmin',
  });

  console.log('Superadmin registered successfully:', superAdmin._id);
  res.status(201).json({
    id: superAdmin._id,
    name: superAdmin.name,
    email: superAdmin.email,
    usertype: superAdmin.usertype,
  });
});

export const updatePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
  if (!user) throw new Error("User not found");
  user.password = req.body.password;
  await user.save();
  res.json({ message: "Password updated" });
});