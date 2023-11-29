const express = require('express');
// var router = express.Router();

const hbs = require('hbs');
const path = require('path');
const mongoose = require('mongoose');
const registerModel = require('./mongodb');

const bcrypt=require('bcryptjs')

const app = express();
const port = 3001;

app.set('view engine', 'hbs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
    .connect("mongodb://localhost:27017/data", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch(() => {
        console.log("Failed to connect to MongoDB");
    });

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'img')));
app.use(express.static(path.join(__dirname, 'lib')));
app.use(express.static(path.join(__dirname, 'js')));


app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, } = req.body;
        const newRegister = new registerModel({
            name: name,
            password: password,
            email: email,
        });

        await newRegister.save();
        
   
        res.redirect('/login');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await registerModel.findOne({ email, password });
        

        console.log("hello");

        if (!user) {

            res.render('login', { error: 'User not found' });
        } else {
     
           return res.render('home');

            // return res.json({message:"successfully loged"})
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }

});

app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/home', (req, res) => {
    res.render('home');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

