const express = require('express');
const { body, validationResult } = require('express-validator');
const fetchUser = require('../middlewares/fetchUser');
const Todo = require('../models/Todo');
const User = require('../models/User');

const router = express.Router();

// ROUTE 1: Fetch all todos of the user using GET. Login required
router.get('/fetchAlltodos', fetchUser, async (req, res) => {
    let success = false;
    try {
        const posts = await Todo.find({ user: req.user.id });
        success = true;
        return res.json({ success, posts, status: 200 });
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

// ROUTE 2: Add todo using POST. Login required
router.post('/addtodo', [
    body('text', 'Enter a valid todo').isLength({ min: 5 })
], fetchUser, async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        success = false;
        return res.json({ success, errors: errors.array(), status: 400 })
    }
    try {
        const mydate = new Date();
        let day = mydate.getDate();
        let month = mydate.getMonth();
        let year = mydate.getFullYear();
        let customDate = `${day}/${month+1}/${year}`;
        let date1;
        if (req.body.date) {
            date1 = req.body.date;
        }
        else {
            date1 = customDate;
        }
        const todo = new Todo({
            text: req.body.text,
            date: date1,
            user: req.user.id
        });

        const mytodo = await todo.save();

        const user = await User.findByIdAndUpdate({_id: req.user.id},{$push: {todos: mytodo}});
        success = true;
        return res.json({ success, mytodo, status: 200 });
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

// ROUTE 3: Delete todo using DELETE. Login required
router.delete('/deletetodo/:id', fetchUser, async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        success = false;
        return res.json({ success, errors: errors.array(), status: 400 })
    }
    try {
        const targetTodo = await Todo.findOne({_id:req.params.id});

        if(!targetTodo) {
            success = false;
            return res.json({success,error: "Todo not found",status: 404})
        }

        if(targetTodo.user.toString() !== req.user.id) {
            success = false;
            return res.json({success, error: "This is not allowed", status: 401})
        }

        const filteredTodos = await Todo.findByIdAndDelete(req.params.id);
        const myuser = await User.findByIdAndUpdate({_id:req.user.id},{$pull: {todos: req.params.id}})

        success = true;
        return res.json({ success, filteredTodos, status: 200 });
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

// ROUTE 4: Edit todo using PUT. Login required
router.put('/edittodo/:id', fetchUser, async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        success = false;
        return res.json({ success, errors: errors.array(), status: 400 })
    }
    try {
        const {text,date} = req.body;
        let todo = await Todo.findById(req.params.id);

        if(!todo) {
            success = false;
            return res.json({success,error: "Todo not found",status: 404})
        }

        let newTodo = {text: "", date: todo.date};
        if(text) {
            newTodo.text = text;
        }

        if(date !== undefined) {
            newTodo.date = date;
        }

        if(!todo) {
            success = false;
            return res.json({success, error: "Not Found", status: 404});
        }

        if(todo.user.toString() !== req.user.id) {
            success = false;
            return res.json({success, error: "This is not allowed", status: 401})
        }

        post = await Todo.findByIdAndUpdate(req.params.id, {$set: newTodo}, {new: true})
        success = true;
        res.json({success, post, status: 200}); 
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

module.exports = router;