const express = require("express")
const http = require("http");
const socketIo = require("socket.io")
const cors = require("cors");
const bodyParser = require("body-parser")
const cookieParser = require("cookie-parser")
const authRoutes =require('./routes/authRoutes')
const fileshareRoutes = require("./routes/fileShareRoutes");
const dotenv = require('dotenv');

dotenv.config();
require('./db')
require('./models/userModel')
require('./models/verificationModel')

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

//adding frontend url origin
const allowedOrigins = ['http://localhost:3000']; // Add more origins as needed
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true, // Allow credentials
    })
);

app.use(bodyParser.json());
app.use(cookieParser());
app.use('/public',express.static('public'))

//generative a downloadable link

//share the io instance with filesharedRoutes
//middleare which always run
app.use((req,res,next) =>{
    req.io = io;
    next();
});

app.use('/auth', authRoutes);
app.use('/file',fileshareRoutes);

//home routes
app.get('/',(req,res) => {
    res.send("API is running");
})

//server stared
server.listen(8000,()=>{
    console.log("server started");
})