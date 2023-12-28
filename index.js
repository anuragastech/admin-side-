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
const port = 3006;


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

// const upload = multer.single('image');



app.post('/signup', async (req, res) => {
    try {
        const { name, email, password, } = req.body;
const myEncriptPassword=await bcrypt.hash(password, 10)

        const newRegister = new resgister({
            name: name,
            password: myEncriptPassword,
            email: email,
        });


        await newRegister.save();
        const token= jwt.sign({id:resgister._id},"mynameissomethinglikestartwithathatsit",{expiresIn:"2h"});

        resgister.token=token
        resgister.password=undefined
   
        res.redirect('/login');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await resgister.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            console.log("Authentication successful");

            const token = jwt.sign({ id: user._id }, "mynameissomethinglikestartwithathatsit", { expiresIn: "2h" });

         
            user.token = token;
            user.password = undefined;

            // Cookies setting***
            const options = {
                expires: new Date(Date.now() + 30 * 60 * 1000),  // 3 minutes in millisecond
                httpOnly: true,
            };

           
            res.cookie("token", token, options);

            return res.redirect('/home');
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



app.get('/home', (req, res) => {
  
    const token = req.cookies.token;

    if (token) {
        return res.render('/home');
    } else {
        return res.redirect('/login');
    }
});




app.get('/signup', (req, res) => {
    const token = req.cookies.token;

    if (token) {
        return res.redirect('/home');
    }
    res.render('/signup');
});


app.get('/login', (req, res) => {
    const token = req.cookies.token;

    if (token) {
        return res.redirect('/home');
    }

    return res.render('/login');
});



// app.get('/login', (req, res) => {
//     res.render('/login');
// });

app.get('/productAdd', (req, res) => {

    res.render('/productAdd');
});


app.get('/category', (req, res) => {


    res.render('/category');
});

app.get('/subcategory', (req, res) => {


    res.render('/category');
});






// ---------------------------------------------------------------------------

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
            crop: 'scale'
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

        res.redirect(`/productdetails`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});






app.get('/categorylist', async (req, res) => {
    try {
        const { id ,title, description, image } = req.query;
       
        const categoryList = await category.find({}, ' id title description image');


        if (!categoryList) {
            return res.status(500).json({ success: false });
        }

        res.render('/categorylist', { categories: categoryList });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});



app.get('/edit-category/:id', async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await category.findOne({ _id: ObjectId(categoryId) });

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.render('/edit-category', { category });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});


app.put('/edit-category/:categoryId', async (req, res) => {
    try {
        const categoryId = req.params.categoryId;
        const { title, description } = req.body;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Incomplete data for category update' });
        }

        const updatedCategory = await category.updateOne(
            { _id: ObjectId(categoryId) },
            {
                $set: {
                    title: title,
                    description: description,
                },
            },
            { new: true } 
        );

        res.status(200).json({ success: true, message: 'Category updated successfully', updatedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
});


// ------------------------------------------------------------------------------------------------------------------


app.post('/category', upload, async (req, res) => {
    try {
        const { title, description } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const desiredWidth = 300;
        const desiredHeight = 200;

        const result = await cloudinary.uploader.upload(req.file.path, {
            width: desiredWidth,
            height: desiredHeight,
            crop: 'scale' 
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

        res.redirect('/categorylist');
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Logout route
app.get("/logout", (req, res) => {
    res.clearCookie("token");

    res.redirect("/login");
});


app.delete("/delete/:id", async (req, res) => {
    try {
      const categoryId = req.params.id;
      const deleteCategory = await category.findOneAndDelete({ title: categoryId });
  
      if (!deleteCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
  
      return res.redirect("/categorylist");
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting category data", error: error.message });
    }
  });
  
  
  
  
  
 
  
  
  app.get("/delete", (req, res) => {
    res.redirect("/categorylist");
  });
  




//   --------------------------------------------------

app.delete("/delete/product/:id", async (req, res) => {
    try {
      const productId = req.params.id;
      const deleteproduct = await product.findOneAndDelete({ productname: productId });
  
      if (!deleteproduct) {
        return res.status(404).json({ message: "Product not found" });
      }
  
      return res.redirect("/productdetails");
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error deleting product data", error: error.message });
    }
  });

  app.get("/delete", (req, res) => {
    res.redirect("/productdetails");
  });
  






// **********************************************************************************************************
app.get('/subcategories', async (req, res) => {
    try {
        const subcategories = await subcategory.find({}, 'title description image');

        res.render('/subcategories', { subcategories });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/subcategories', upload, async (req, res) => {
    try {
        const { title, description,category } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const desiredWidth = 300;
        const desiredHeight = 200;

        const photo = await cloudinary.uploader.upload(req.file.path, {
            width: desiredWidth,
            height: desiredHeight,
            crop: 'scale' 
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

        res.render('/subcategories', { subcategory: savedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/categories', async (req, res) => {
    try {
      const categories = await category.find(); 
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
        res.render('/productdetails', { products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});




app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});



