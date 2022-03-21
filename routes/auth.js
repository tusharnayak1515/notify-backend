const express = require('express');
const { body, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fetchUser = require('../middlewares/fetchUser');
const Todo = require('../models/Todo');

const router = express.Router();

const secret = process.env.JWT_SECRET;

// ROUTE 1: Register a new user using POST. No Login Required
router.post('/register', [
    body('name', 'Name must be of minimum 5 characters!').isLength({ min: 5 }),
    body('username', 'Username must be of minimum 5 characters!').isLength({ min: 5 }),
    body('email', 'Enter a valid email').isEmail(),
    body('password', "Enter a valid password").isLength({ min: 8 }).matches(/^[a-zA-Z0-9!@#$%^&*]{6,16}$/)
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        success = false;
        return res.json({ success, error: errors.array()[0].msg, status: 400 })
    }
    try {
        let user = await User.findOne({ email: req.body.email });
        if (user) {
            success = false;
            return res.json({ success, error: "Another user with the same email already exists!", status: 400 })
        }

        let user1 = await User.findOne({ username: req.body.username });
        if (user1) {
            success = false;
            return res.json({ success, error: "Another user with the same username already exists!", status: 400 })
        }

        const salt = await bcryptjs.genSalt(10);
        const securePassword = await bcryptjs.hash(req.body.password, salt);
        user = await User.create({
            name: req.body.name,
            username: req.body.username,
            email: req.body.email,
            password: securePassword
        });
        const data = {
            user: {
                id: user.id,
            },
        };
        const authToken = jwt.sign(data, secret);
        success = true;
        res.json({ success, authToken, status: 200 });
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }

});

// ROUTE 2: Login a new user using POST. No Login Required
router.post('/login', [
    body('email', 'Enter a valid email').isEmail(),
    body('password',"Password cannot be empty").exists()
], async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        success = false;
        return res.json({ success, error: errors.array()[0].msg, status: 400 })
    }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({email: email})
        if(!user) {
            success = false;
            return res.json({ success, error: "Please login with coreect credentials!", status: 400 })
        }
        const passwordCompare = await bcryptjs.compare(password, user.password);
        if(!passwordCompare) {
            success = false;
            return res.json({success,error: "Invalid Credentials",status: 400})
        }
        const data = {
            user: {
                id: user.id
            }
        };
        const authToken = jwt.sign(data,secret);
        const mytodos = await Todo.find({user: user._id});
        success = true;
        res.json({success,authToken,mytodos,status:200})
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

// ROUTE 3: Get user details using POST. Login Required
router.get('/profile', fetchUser , async (req, res) => {
    let success = false;
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        success = true;
        return res.json({success,user,status:200})
    }
    catch(error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

// ROUTE 4: Delete an existing user using DELETE. Login Required
router.delete('/deleteuser/:id', fetchUser , async (req, res) => {
    let success = false;
    try {
        const userId = req.params.id;
        let user = await User.findOne({_id:userId});
        if(!user) {
            success = false;
            return res.json({success,error: "Account not found", status: 404})
        }

        if(user._id.toString() !== req.user.id) {
            success = false;
            return res.send({success, error: "This is not allowed", status: 401})
        }

        user = await User.findByIdAndDelete(userId);
        let todos = await Todo.deleteMany({user: userId});
        success = true;
        return res.json({success,user,status: 200})
    }
    catch(error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

module.exports = router;