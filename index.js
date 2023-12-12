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
// const Category = require('./category');
const subcategory=require('./subcategory');
const product = require('./productAdd');
const category = require('./category');
const cloudinary =require('./cloudinary');

const multer =require('./multerconfig');



const upload = multer.single('image');






const app = express();
const port = 3005;


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


// app.post('/productAdd',async(req,res)=>{
//     try{

//         const categories = await Category.find(); 
//         res.json({ categories });
//     const{productName,manufactureName,brand,price,subcategory,discription,productImage}=req.body;
//     const newProduct =new productModel({
//             productname: productName,
//             manufacturename: manufactureName,
//             brand: brand,
//             price: price,
//             discription: discription,
//             category: category,
//             subcategory: subcategory,
//             productImage: productImage,
//     })

//     await newProduct.save();
//     res.redirect('/login')
//   }  catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// })
  


 
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





// app.get('/productAdd', async (req, res) => {
//     try {

//         const{men,women}=req.params
//         const categories = await category.find({}, 'men women'); 
        
//         const viewsData = {
//             edit: false,
//             categories,
//             pageTitle: 'productAdd'
//         };
        
//         res.render('productAdd', viewsData);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

app.post('/productAdd', upload, async (req, res) => {
    try {
        const { productname, manufacturename, brand, price, description, category, subcategory } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File not provided' });
        }

        

        const desiredWidth = 300;
        const desiredHeight = 200;

        const photo = await cloudinary.uploader.upload(req.file.path, {
            width: desiredWidth,
            height: desiredHeight,
            crop: 'scale' // Maintain aspect ratio
        });

        const newProduct = new product({
            productname: productname,
            manufacturename: manufacturename,
            brand: brand,
            price: price,
            description: description,
            category: category,
            subcategory: subcategory,
            image: {
                public_id: photo.public_id,
                url: photo.secure_url,
            },
        });


        const savedProduct = await newProduct.save();
        const categories = await category.find();

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            product: savedProduct,
            categories: categories,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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

// const upload = multer.single('image');
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



app.delete('/delete', async (req, res) => {
    try {

        const category = await category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const { image} = req.params;

        const publicId = category.image && category.image.public_id;

        if (!publicId) {
            return res.status(400).json({ success: false, message: 'Missing public_id for Cloudinary' });
        }

        const deletionResult = await cloudinary.uploader.destroy(publicId);

        if (deletionResult.result === 'ok') {
            await category.deleteOne();
            res.status(200).json({ success: true, message: 'Category deleted successfully' });
        } else {
            res.status(500).json({ success: false, message: 'Cloudinary deletion failed' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});



// **********************************************************************************************************
app.get('/subcategories', async (req, res) => {
    try {
        const subcategories = await subcategory.find({}, 'title description image');

        // Assuming your rendering engine is set up to use the 'subcategories' template
        res.render('subcategories', { subcategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/subcategories', upload, async (req, res) => {
    try {
        const { title, description,category } = req.body;

        // Check if req.file exists before using it
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const desiredWidth = 300;
        const desiredHeight = 200;

        const photo = await cloudinary.uploader.upload(req.file.path, {
            width: desiredWidth,
            height: desiredHeight,
            crop: 'scale' // Maintain aspect ratio
        });
        
        const newsubCategory = new subcategory({
            title: title,
            description: description,
            image: {
                public_id: photo.public_id,
                url: photo.secure_url
            },
            category: category,
        });


        const savedCategory = await newsubCategory.save();

        res.render('subcategories', { subcategory: savedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/categories', async (req, res) => {
    try {
      const categories = await category.find(); // Adjust the query as needed
      res.json({ categories });
    } catch (error) {
      console.error('Error fetching categories:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  app.get('/subcategory', async (req, res) => {
    try {
      const subcategories = await subcategory.find(); 
      res.json({ subcategories });
    } catch (error) {
      console.error('Error fetching categories:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/productdetails', async (req, res) => {
    try {
        const products = await product.find().populate('category').populate('subcategory');
        res.render('productdetails', { products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});






app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



