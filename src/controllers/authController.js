import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Built-in accounts for fallback / auto-seeding
const DEFAULT_ACCOUNTS = [
  {
    _id: '66d000000000000000000001',
    name: 'Zubyte Admin',
    email: 'admin@zubyte.com',
    username: 'admin',
    passwords: ['zubte@admin', 'zubyte@admin'],
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    _id: '66d000000000000000000002',
    name: 'Zubyte Developer',
    email: 'developer@zubyte.com',
    username: 'developer',
    passwords: ['zubyte@developer', 'zubte@developer'],
    role: 'developer',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
];

/**
 * Ensures initial default Admin and Developer accounts exist in MongoDB
 */
export const ensureDefaultUsers = async () => {
  if (mongoose.connection.readyState !== 1) return;
  try {
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('[Auth] Initializing default admin and developer users in MongoDB...');
      for (const acc of DEFAULT_ACCOUNTS) {
        await User.create({
          name: acc.name,
          email: acc.email,
          username: acc.username,
          password: acc.passwords[0],
          role: acc.role,
          avatar: acc.avatar,
        });
      }
      console.log('[Auth] Default admin and developer created in DB.');
    }
  } catch (error) {
    console.error(`[Auth Init Notice] ${error.message}`);
  }
};

/**
 * @desc    Login user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res, next) => {
  try {
    const { identifier, username, email, password } = req.body;
    const loginId = (identifier || username || email || '').trim().toLowerCase();
    const inputPass = (password || '').trim();

    if (!loginId || !inputPass) {
      return ApiResponse.badRequest(res, 'Please provide username/email and password');
    }

    const secret = process.env.JWT_SECRET || 'zubyte_jwt_super_secret_production_key_2026_x99!';
    const expire = process.env.JWT_EXPIRE || '7d';

    // ─── 1. If MongoDB is connected ──────────────────────────────────────────
    if (mongoose.connection.readyState === 1) {
      await ensureDefaultUsers();

      const user = await User.findOne({
        $or: [
          { email: { $regex: new RegExp(`^${loginId}$`, 'i') } },
          { username: { $regex: new RegExp(`^${loginId}$`, 'i') } },
        ],
      }).select('+password');

      let isMatch = false;
      if (user) {
        isMatch = await user.comparePassword(inputPass);
        // Also check if matches built-in aliases
        if (!isMatch) {
          const acc = DEFAULT_ACCOUNTS.find((a) => a.role === user.role);
          if (acc && acc.passwords.includes(inputPass)) {
            isMatch = true;
          }
        }
      }

      if (user && isMatch) {
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        const token = user.generateAuthToken();

        return ApiResponse.success(
          res,
          {
            token,
            user: {
              id: user._id,
              name: user.name,
              email: user.email,
              username: user.username,
              role: user.role,
              avatar: user.avatar,
              lastLogin: user.lastLogin,
            },
          },
          `Welcome back, ${user.name}! Logged in as ${user.role.toUpperCase()}.`
        );
      }
    }

    // ─── 2. Fallback mode if MongoDB is offline or initial seed ──────────────
    console.log('[Auth] Checking credentials (offline/master fallback)...');
    const fallbackUser = DEFAULT_ACCOUNTS.find(
      (u) =>
        (u.username.toLowerCase() === loginId || u.email.toLowerCase() === loginId) &&
        u.passwords.includes(inputPass)
    );

    if (!fallbackUser) {
      return ApiResponse.error(
        res,
        'Invalid credentials. Please check your username and password.',
        401
      );
    }

    const token = jwt.sign(
      {
        id: fallbackUser._id,
        name: fallbackUser.name,
        email: fallbackUser.email,
        username: fallbackUser.username,
        role: fallbackUser.role,
      },
      secret,
      { expiresIn: expire }
    );

    return ApiResponse.success(
      res,
      {
        token,
        user: {
          id: fallbackUser._id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          username: fallbackUser.username,
          role: fallbackUser.role,
          avatar: fallbackUser.avatar,
          lastLogin: new Date(),
        },
      },
      `Welcome back, ${fallbackUser.name}! Logged in as ${fallbackUser.role.toUpperCase()}.`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res, next) => {
  try {
    if (req.user) {
      return ApiResponse.success(res, req.user, 'Current user profile');
    }

    return ApiResponse.notFound(res, 'User session not found');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/auth/users
 * @access  Private / Admin
 */
export const getAllUsers = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const users = await User.find().select('-password');
      return ApiResponse.success(res, users, 'Users retrieved');
    }

    const safeFallback = DEFAULT_ACCOUNTS.map(({ passwords, ...u }) => ({
      ...u,
      id: u._id,
    }));
    return ApiResponse.success(res, safeFallback, 'Users retrieved (offline mode)');
  } catch (error) {
    next(error);
  }
};

