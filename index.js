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








// const createToken = async () => {
//     try {
//         const token = await jwt.sign({ _id: "65658a0a8eca5111293f9021" }, "mynameissomethinglikestartwithathatsit");
//         console.log(token);

//         const userVerified = jwt.verify(token, "mynameissomethinglikestartwithathatsit");
//         console.log("userVerified", userVerified);
//     } catch (error) {
      
//         console.error(error);
//     }
// };

// createToken();



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
    const{productName,manufactureName,brand,price,discription,productImage}=req.body;
    const category = req.params.category;
    const subcategory = req.params.subcategory;
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
// category.findOne({attributes:['id','title']})
// .then((categories) => {
//     console.log(categories);
//     const viewsData={
//         edit:false,
//         categories,
//         pageTitle:'productAdd'
//     };
    
// })

    res.render('productAdd');
});

// app.get('/productAdd', (req, res) => {

    
//         res.render('productAdd');
//     });


// app.get('/productDetails', async (req, res) => {
//     try {
//       const productId = req.params.productId;
//       const product = await Product.findById(productId)
//         .populate('category')
//         .populate('subcategory')
//         .exec();
  
//       res.render('productDetails', { product });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send('Internal Server Error');
//     }
//   });




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


//   // Get subcategories by category
//   app.get('/subcategories/:category', async (req, res) => {
//     const { category } = req.params;
  
//     try {
//       const categoryId = await category.findOne({ name: category });
  
//       if (!categoryId) {
//         return res.status(404).json({ error: 'Category not found' });
//       }
  
//       const subcategories = await subcategory.find({ category: categoryId });
//       res.json({ subcategories });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//   });



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

