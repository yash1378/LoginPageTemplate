const { verify } = require("jsonwebtoken");
require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const { hash, compare } = require("bcryptjs");
// const mongoose = require("mongoose");
const { createAccessToken, createRefreshToken, sendAccessToken, sendRefreshToken } = require("./utils/token");
// const User = require("./models/user");

const port = process.env.PORT || 4500;
const app = express();
const nodemailer = require("nodemailer");


const { createPasswordResetToken } = require("./utils/token");
const {
  createPasswordResetUrl,
  passwordResetTemplate,
  passwordResetConfirmationTemplate,
} = require("./utils/email");


const mongoose = require("mongoose");
// connecting to the database
mongoose
  .connect('mongodb+srv://yashd:ramlal@nodeexpressproject.qp0arwg.mongodb.net/LoginData?retryWrites=true&w=majority')
  .then(() => {
    console.log("MongoDB connection is established successfully! 🎉");
  });

  const User = require("./models/user")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('./public'));

app.get('/',(req,res)=>{
    res.sendFile(__dirname+'/public/html/login.html')
})

app.get('/signup',(req,res)=>{
    res.sendFile(__dirname+'/public/html/signup.html')
})

// User registration request
app.post("/signup", async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // 1. check if user already exists
      const user = await User.findOne({ email });
  
      // if user exists already, return error
      if (user)
        return res.status(500).json({
          message: "User already exists! Try logging in. 😄",
          type: "warning",
        });
  
      // 2. if user doesn't exist, create a new user
      // hashing the password
      const passwordHash = await hash(password, 10);
      const newUser = new User({
        email,
        password: passwordHash,
      });
  
      // 3. save the user to the database
      await newUser.save();
  
      // 4. send the response
      res.status(200).json({
        message: "User created successfully! 🥳",
        type: "success",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        type: "error",
        message: "Error creating user!",
        error,
      });
    }
  });
  
  

app.post('/',async (req,res)=>{
    try {
        const { email, password } = req.body;
    
        // 1. check if user exists
        const user = await User.findOne({ email });
    
        // if user doesn't exist, return error
        if (!user){
            console.log('user does not exist')
            return
        }
        //   return res.status(500).json({
        //     message: "User doesn't exist! 😢",
        //     type: "error",
        //   });
    
        // 2. if user exists, check if password is correct
        const isMatch = await compare(password, user.password);
    
        // if password is incorrect, return error
        if (!isMatch){
            console.log('password is incorrect...')
        }
        //   return res.status(500).json({
        //     message: "Password is incorrect! ⚠️",
        //     type: "error",
        //   });
    
        // 3. if password is correct, create the tokens
        const accessToken = createAccessToken(user._id);
        const refreshtoken = createRefreshToken(user._id);
    
        // 4. put refresh token in the database
        user.refreshtoken = refreshtoken;
        await user.save();
    
        // 5. send the response
        sendRefreshToken(res, refreshtoken);
        sendAccessToken(req,res, accessToken);
        console.log('user successfully logged in ...')
        res.sendFile(__dirname + '/public/html/login.html');
      } catch (error) {
        console.log(error);
        res.status(500).json({
          type: "error",
          message: "Error signing in!",
          error,
        });
      }
    });





// const { verify } = require("jsonwebtoken");
// Refresh Token request
app.get("/refresh_token", async (req, res) => {
    try {
      const { refreshtoken } = req.cookies;
      // if we don't have a refresh token, return error
      if (!refreshtoken)
        return res.status(500).json({
          message: "No refresh token! 🤔",
          type: "error",
        });
      // if we have a refresh token, you have to verify it
      let id;
      try {
        id = verify(refreshtoken, process.env.REFRESH_TOKEN_SECRET).id;
      } catch (error) {
        return res.status(500).json({
          message: "Invalid refresh token! 🤔",
          type: "error",
        });
      }
      // if the refresh token is invalid, return error
      if (!id)
        return res.status(500).json({
          message: "Invalid refresh token! 🤔",
          type: "error",
        });
      // if the refresh token is valid, check if the user exists
      const user = await User.findById(id);
      // if the user doesn't exist, return error
      if (!user)
        return res.status(500).json({
          message: "User doesn't exist! 😢",
          type: "error",
        });
      // if the user exists, check if the refresh token is correct. return error if it is incorrect.
      if (user.refreshtoken !== refreshtoken)
        return res.status(500).json({
          message: "Invalid refresh token! 🤔",
          type: "error",
        });
      // if the refresh token is correct, create the new tokens
      const accessToken = createAccessToken(user._id);
      const refreshToken = createRefreshToken(user._id);
      // update the refresh token in the database
      user.refreshtoken = refreshToken;
      // send the new tokes as response
      sendRefreshToken(res, refreshToken);
      return res.json({
        message: "Refreshed successfully! 🤗",
        type: "success",
        accessToken,
      });
    } catch (error) {
      res.status(500).json({
        type: "error",
        message: "Error refreshing token!",
        error,
      });
    }
  });




  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      // TODO: replace `user` and `pass` values from <https://forwardemail.net>
      user: 'yashdugriyal1066@gmail.com',
      pass: 'tgurzzqcptydammg'
    }
  });

  app.get("/send-password-reset-email",(req,res)=>{
    res.sendFile(__dirname+'/public/passwordreset.html')
  })
  
  // send password reset email
  app.post("/send-password-reset-email", async (req, res) => {
    // try {
      // get the user from the request body
  
  
    try {
  
      const { email } = req.body;
      console.log(email);
      // find the user by email
      const user = await User.findOne({ email });
      // if the user doesn't exist, return error
      if (!user){
        res.redirect('/send-password-reset-email')
      }
      // send mail with defined transport object
  
      const info = await transporter.sendMail({
        from: "yashdugriyal1066@gmail.com", // sender address
        to: email, // list of receivers
        subject: "Hello ✔", // Subject line
        text: "Hello world?", // plain text body
        html: `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                /* Add your custom CSS styles here */
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                }
                .container {
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #333;
                }
                p {
                    color: #555;
                    line-height: 1.6;
                }
                .button {
                    display: inline-block;
                    padding: 10px 20px;
                    background-color: #007bff;
                    color: #fff;
                    text-decoration: none;
                    border-radius: 5px;
                }
                @media (max-width: 600px) {
                    .container {
                        max-width: 100%;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Welcome Back!</h1>
                <p>Your password has been successfully changed to <strong>abc@123</strong>.</p>
                <p>You can now log in using your new password.</p>
                <p>If you did not make this change, please <a href="#">contact us</a> immediately.</p>
                <p>Thank you!</p>
                <a class="button" href="#">Log In</a>
            </div>
        </body>
        </html>
        
        
        `, // html body
      });

      try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const passwordHash = await hash("abc@123", 10);

        user.password = passwordHash;
        await user.save();

        res.status(200).json({ message: 'Email Sent Successfully and Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating password', error: error.message });
    }
  
      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    //   res.send("Email sent successfully!");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error sending email.");
    }
  });
app.listen(port,()=>{
    console.log(`listening on the port ${port}`)
})

