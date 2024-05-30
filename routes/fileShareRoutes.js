const express = require("express");
const User  = require("../models/userModel")
const Verification= require("../models/verificationModel");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

router.get('/test',(req,res)=>{
    res.send("file share routes are working")
})


module.exports = router;