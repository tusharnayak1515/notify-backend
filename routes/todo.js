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
        const todos = await Todo.find({ user: req.user.id });
        success = true;
        return res.json({ success, todos, status: 200 });
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

// ROUTE 2: Add todo using POST. Login required
router.post('/addtodo', [
    body('text', 'Todo cannot be less than 5 characters!').isLength({ min: 5 })
], fetchUser, async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    const text1 = req.body.text.replace(/ /g,'');
    if (!errors.isEmpty() || text1.length < 5) {
        success = false;
        return res.json({ success, error: !errors.isEmpty() ? errors.array()[0].msg : 'Todo cannot be less than 5 characters!', status: 400 })
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
            isComplete: false,
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

        const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
        const filteredTodos = await Todo.find({user: req.user.id});
        const myuser = await User.findByIdAndUpdate({_id:req.user.id},{$pull: {todos: req.params.id}})

        success = true;
        return res.json({ success, filteredTodos, status: 200 });
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

// ROUTE 4: Edit todo using PUT. Login required
router.put('/edittodo/:id',[
    body('text', 'Todo cannot be less than 5 characters!').isLength({ min: 5 })
], fetchUser, async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    const text1 = req.body.text.replace(/ /g,'');
    if (!errors.isEmpty() || text1.length < 5) {
        success = false;
        return res.json({ success, error: !errors.isEmpty() ? errors.array()[0].msg : 'Todo cannot be less than 5 characters!', status: 400 })
    }
    try {
        const {text,date} = req.body;
        let todo = await Todo.findById(req.params.id);

        if(!todo) {
            success = false;
            return res.json({success,error: "Todo not found",status: 404})
        }

        let newTodo = {text: todo.text, date: todo.date, isComplete: todo.isComplete};
        if(text) {
            newTodo.text = text;
        }

        if(date !== undefined) {
            newTodo.date = date;
        }

        if(todo.user.toString() !== req.user.id) {
            success = false;
            return res.json({success, error: "This is not allowed", status: 401})
        }

        todo = await Todo.findByIdAndUpdate(req.params.id, {$set: newTodo}, {new: true});
        success = true;
        res.json({success, todo, status: 200}); 
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

// ROUTE 4: Complete todo using PUT. Login required
router.put('/complete/:id', fetchUser, async (req, res) => {
    let success = false;
    try {
        let todo = await Todo.findById(req.params.id);

        if(!todo) {
            success = false;
            return res.json({success,error: "Todo not found",status: 404})
        }

        let newTodo = {text: todo.text, date: todo.date, isComplete: !todo.isComplete};

        if(todo.user.toString() !== req.user.id) {
            success = false;
            return res.json({success, error: "This is not allowed", status: 401})
        }

        todo = await Todo.findByIdAndUpdate(req.params.id, {$set: newTodo}, {new: true});
        const updatedTodos = await Todo.find({user: req.user.id});
        success = true;
        res.json({success, updatedTodos, status: 200}); 
    }
    catch (error) {
        res.send({ error: "Internal Server Error", status: 500 });
    }
});

module.exports = router;