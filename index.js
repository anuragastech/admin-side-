const express = require('express');
// var router = express.Router();

const hbs = require('hbs');
const path = require('path');
const mongoose = require('mongoose');
const registerModel = require('./mongodb');
const productModel=require('./productAdd')

const bcrypt=require('bcryptjs')
const jwt= require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const Category = require('./category');
const subcategory=require('./subcategory');
const productAdd = require('./productAdd');
const category = require('./category');
const cloudinary =require('./cloudinary');

const multer =require('./multerconfig');









const app = express();
const port = 3002;

app.set('view engine', 'hbs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


mongoose
    .connect("mongodb://localhost:27017/data")
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((error) => {
        console.error("Failed to connect to MongoDB:", error);
    });


app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'img')));
app.use(express.static(path.join(__dirname, 'lib')));
app.use(express.static(path.join(__dirname, 'js')));

// ---------------------------------------------------------------------------------------------------------
app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, } = req.body;
const myEncriptPassword=await bcrypt.hash(password, 10)

        const newRegister = new registerModel({
            name: name,
            password: myEncriptPassword,
            email: email,
        });


        await newRegister.save();
        const token= jwt.sign({id:registerModel._id},"mynameissomethinglikestartwithathatsit",{expiresIn:"2h"});

        registerModel.token=token
        registerModel.password=undefined
   
        res.redirect('/login');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await registerModel.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            console.log("Authentication successful");

            const token = jwt.sign({ id: user._id }, "mynameissomethinglikestartwithathatsit", { expiresIn: "2h" });

         
            user.token = token;
            user.password = undefined;

            // Cookies setting
            const options = {
                expires: new Date(Date.now() + 3 * 60 * 1000),  // 3 minutes in milliseconds
                httpOnly: true,
            };

           
            res.cookie("token", token, options);

            return res.redirect('home');
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// ---------------------------------------------------------------------------------------------------------------


app.post('/productAdd',async(req,res)=>{
    try{

    const category= await category.findById(req.body.category);
    if(!category)return res.status(400).send('invalid category')

    const{productName,manufactureName,brand,price,subcategory,discription,productImage}=req.body;
    const newProduct =new productModel({
            productname: productName,
            manufacturename: manufactureName,
            brand: brand,
            price: price,
            discription: discription,
            category: category,
            subcategory: subcategory,
            productImage: productImage,
    })

    await newProduct.save();
    res.redirect('/login')
  }  catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
})
  


 
app.get('/home', (req, res) => {
  
    const token = req.cookies.token;

    if (token) {
        return res.render('home');
    } else {
        return res.redirect('/login');
    }
});




app.get('/signup', (req, res) => {
    res.render('signup');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/productAdd', (req, res) => {


    res.render('productAdd');
});





app.get('/productAdd', async (req, res) => {
    try {

        const{men,women}=req.params
        const categories = await Category.find({}, 'men women'); 
        
        const viewsData = {
            edit: false,
            categories,
            pageTitle: 'productAdd'
        };
        
        res.render('productAdd', viewsData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.get('/category', async (req, res) => {
    try {
        const { id ,title, description, image } = req.query;
       
        const categoryList = await category.find({}, ' id title description image');


        if (!categoryList) {
            return res.status(500).json({ success: false });
        }

        res.render('category', { categories: categoryList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});

const upload = multer.single('image');
// ------------------------------------------------------------------------------------------------------------------

app.post('/category', upload, async (req, res) => {
    try {
        const { title, description } = req.body;

        // Check if req.file exists before using it
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const desiredWidth = 300;
        const desiredHeight = 200;

        const result = await cloudinary.uploader.upload(req.file.path, {
            width: desiredWidth,
            height: desiredHeight,
            crop: 'scale' // Maintain aspect ratio
        });
        
        const newCategory = new category({
            title: title,
            description: description,
            image: {
                public_id: result.public_id,
                url: result.secure_url
            },
        });

        const savedCategory = await newCategory.save();

        res.render('category', { category: savedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.delete('/delete/:_id', async (req, res) => {
    try {
        const { _id } = req.params;

        // Step 1: Find the Cloudinary public ID from the Category document
        const category = await Category.findOne({ _id});

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Assuming the public ID is stored in the image field of the Category document
        const publicId = category.image.public_id;

        // Step 2: Use Cloudinary SDK to delete the file
        cloudinary.uploader.destroy(publicId, function(result) {
            if (result.error) {
                console.error(result.error.message);
            } else {
                console.log(result);
            }
        });
        // Step 3: Delete the Category document from MongoDB
        await category.remove();

        res.status(200).json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

