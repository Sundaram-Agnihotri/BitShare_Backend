const mongoose = require('mongoose');
const bcrypt = require('bcrypt');


const fileSchema = new mongoose.Schema({
    senderemail: {required:true , type:String},
    receiveremail: {required:true , type:String},
    fileurl: {required:true , type:String},
    filename: {required:true , type:String},
    sharedAt: {required:true , type:Date},
    fileType : {type:String}
},{timestamps: true})   //time is alsobe recorded at real time

const userSchema = new mongoose.Schema({
    name: {required:true , type:String},
    email: {required:true , type:String},
    password: {required:true , type:String},
    profilePic:{
        type: String,
        default: ''
    },
    files:{
        type : [fileSchema],
        default : []
    }
}, {timestamps: true})   //time is also be recorded at real time


//hahsing the password before saving into db
userSchema.pre('save', async function(next) {
 
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    } 
    next();   //perform the next operation ,saving to db
})

module.exports = mongoose.model('User', userSchema);