const express = require("express");
const User  = require("../models/userModel")
const Verification= require("../models/verificationModel");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const nodemailer = require("nodemailer")
const responseFunction=require("../utils/responseFunction");
const fs = require("fs");
const errorHandler = require("../middlewares/errorMiddleware")
const authTokenHandler = require("../middlewares/checkAuthToken");
const dotenv = require('dotenv');
dotenv.config();

//nodemailer function
async function mailer(recieveremail,code){
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        post: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: "agnihotrisundaram8@gmail.com",
            pass: "nrlu egyn ytgb zdnc",
        }
    })

    let info = await transporter.sendMail({
        from: '"Team BitShare" <agnihotrisundaram8@gmail.com>',
        to: recieveremail,
        subject: "OTP for BitShare",
        text: "Your OTP is " + code,
        html: "<b>Your OTP is " + code + "</b>",

    })

    // console.log("Message sent: %s", info.messageId);

}

//establish the storage
const storage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,'./public')  //in public folder file to be saved
    },

    //define the filename
    filename: (req,file,cb) => {
        let filetype = file.mimetype.split('/')[1];
        console.log(req.headers.filename);
        cb(null, `${Date.now()}.${filetype}`);
    }
})

//in this specific storage going to upload things
const upload = multer({storage : storage});

//craete  a function to upload file
const fileuploadFunction = (req,res,next) => {
    //upload the file into public folder
    upload.single('clientfile')(req,res,(err) => {
        if(err){
            return responseFunction(res,400,"fle upload fail",null,false);
        }
        next();
    })
}

router.get('/test',(req,res)=>{
    res.send("Auth routes are working")
})

//send otp API

router.post('/sendotp', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return responseFunction(res, 400, 'Email is required', null, false);
    }
    try {
        await Verification.deleteOne({ email: email });

        //generating an otp code
        const code = Math.floor(100000 + Math.random() * 900000);
        await mailer(email, code);
        // await Verification.findOneAndDelete({ email: email });
        const newVerification = new Verification({
            email: email,
            code: code,
        })
        await newVerification.save();
        return responseFunction(res, 200, 'OTP sent successfully', null, true);
    }
    catch (err) {
        console.log(err);
        return responseFunction(res, 500, 'Internal server error', null, false);
    }
})

//registration Api
router.post('/register',fileuploadFunction,async (req,res,next) => {
    try {
        const { name, email, password, otp} = req.body;
        let user = await User.findOne({ email: email });
        let verificationQueue = await Verification.findOne({ email: email });
        if (user) {
            if(req.file && req.file.path){
                fs.unlink(req.file.path , (err) => {
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log("file deleted successfully");
                    }
                })
            }
        }
        if (!verificationQueue) {
                if(req.file && req.file.path){
                    fs.unlink(req.file.path , (err) => {
                        if(err){
                            console.log(err);
                        }else{
                            console.log("file deleted successfully");
                        }
                    })
                }
            return responseFunction(res,400,"Please send OTP first",null,false);
        }


        const isMatch = await bcrypt.compare(otp, verificationQueue.code);
        if (!isMatch) {
            if(req.file && req.file.path){
                fs.unlink(req.file.path , (err) => {
                    if(err){
                        console.log(err);
                    }else{
                        console.log("file deleted successfully");
                    }
                })
            }
            return responseFunction(res, 400, 'Invalid OTP', null, false);
        }

        user = new User({
            name: name,
            email: email,
            password: password,
            profilePic: req.file.path
        });
        await user.save();
        await Verification.deleteOne({ email: email });
        return responseFunction(res, 200, 'registered successfully', null, true);

    }
    catch (err) {
        console.log(err);
        return responseFunction(res, 500, 'Internal server error', null, false);
    }
})

//login api
router.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return responseFunction(res, 400, "Invalid credentials", null, false);
      }
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return responseFunction(res, 400, "invalid credentials", null, false);
      }
      //generate auth tokens
      const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: `10m` });
  
      //genrate refresh token
      const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: `10m` });
  
      //set cookies
      res.cookie('authToken', authToken, { httpOnly: true });
      res.cookie('refreshToken', refreshToken, { httpOnly: true });
  
      return responseFunction(res, 200, "loggedin successfully", {
        authToken: authToken,
        refreshToken: refreshToken
      }, true);
  
    } catch (err) {
      next(err);
    }
  });

//updated API

//checklogin Api
router.get('/checklogin',authTokenHandler,async (req,res,next) => {
    res.json({
        ok : req.ok,
        message : req.message,
        userId : req.userId
    })
})

//logout api
router.post('/logout',authTokenHandler,async (req,res,next) => {
    res.clearCookie('authToken')
    res.clearCookie('refreshToekn');

    res.json({
        ok : true,
        message :"logged out successfully"
    })
})

//getuser API
router.get('/getuser', authTokenHandler, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return responseFunction(res, 400, 'User not found', null, false);
        }
        return responseFunction(res, 200, 'User found', user, true);

    }
    catch (err) {
        next(err);
    }
})
module.exports = router;