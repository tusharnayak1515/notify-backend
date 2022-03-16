const mongoose = require('mongoose');
const { Schema } = mongoose;

const TodoSchema = new Schema({
    text: {
        type: String,
        required: true
    },
    date: {
        type: String,
        default: Date.now
    },
    isComplete: {
        type: Boolean,
        default: false
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
    }
});

module.exports = mongoose.model('todo',TodoSchema);