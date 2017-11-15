const mongoose = require('mongoose');

const PolicySchema = new mongoose.Schema({
    nameplate: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    deptNbr: {
        type: Number,
        required: true,
        unique: true
    },
    deptName: {
        type: String,
        require: true,
        minlength: 1,
        trim: true
    },
    policyName: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    policyDescription: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    policyPeriod: {
        type: Number,
        required: true
    }
});

const Policy = mongoose.model('Policies', PolicySchema);

module.exports = { Policy };