import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { username, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        username,
        email,
        password,
        preferences: {
            theme: 'dark'
        }
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            username: user.username,
            email: user.email,
            preferences: user.preferences,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            preferences: user.preferences,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            preferences: user.preferences,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user preferences (theme) and profile (username, email)
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        // Update username if provided
        if (req.body.username) {
            // Check if new username is already taken by another user
            const existingUser = await User.findOne({ username: req.body.username, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Username already taken' });
            }
            user.username = req.body.username;
        }

        // Update email if provided
        if (req.body.email) {
            // Check if new email is already taken by another user
            const existingUser = await User.findOne({ email: req.body.email, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = req.body.email;
        }

        // Ensure preferences object exists
        if (!user.preferences) {
            user.preferences = {};
        }

        if (req.body.theme) {
            user.preferences.theme = req.body.theme;
        }
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            _id: updatedUser._id,
            username: updatedUser.username,
            email: updatedUser.email,
            preferences: updatedUser.preferences,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404).json({ success: false, message: 'User not found' });
    }
};

export { registerUser, authUser, getUserProfile, updateUserProfile };
