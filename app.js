if(process.env.NODE_ENV!="production") {
    require('dotenv').config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const port = 8080;
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const Joi = require('joi');
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const userRouter = require("./routes/user.js");

// console.log(process.env.CLOUD_API_KEY);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const dbUrl = process.env.ATLASDB_URL;

const store = MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
        secret:process.env.SECRET
    },
    touchAfter: 24*3600,
})

store.on("error",()=>{
    console.log("ERROR in MONGO SESSION!");
})

const sessionOptions = {
    store,
    secret:process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly:true
    }
}

app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
//initializes passport for every use...

app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
//storing info related to user in session so user doesn't have to login on another tab in a session
passport.deserializeUser(User.deserializeUser());
//unstoring info related to user in session (this is done to forget info as the session ends.)

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";


async function main() {
    await mongoose.connect(dbUrl);
}

//Establishing connection with DB
main().then((res) => {
    console.log("Connected to DB");
}).catch((err) => {
    console.log(err);
});

//Root Route
// app.get("/", (req, res) => {
//     res.send("I am root");
// })



app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/demouser",async (req,res)=>{
//     let fakeUser=new User({
//         email:"student@gmail.com",
//         username:"delta-student"
//     });
//     let registeredUser=await User.register(fakeUser,"helloworld");
//     res.send(registeredUser);
// })
// app.get("/listings/search",async (req,res)=>{
//     const searchby = req.query.searchby;
//     const alllistings = await Listing.find({$or:[{title:searchby},{location:searchby},{country:searchby}]});
//     res.render("listings/search.ejs",{alllistings});
//     // res.send(alllistings);
// })
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);

app.use("/",userRouter);

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found!"));
})

//Middlewares
app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Unknown Error" } = err;
    console.log(err);
    res.status(statusCode).render("listings/error.ejs", { err });
    // res.status(statusCode).send(message);
})

app.listen(port, () => {
    console.log("listening to port:", port);
});

/** 
 * Authentication:is the process who someone is
 * 
 * Authorization:is the process what specific application,files,data a user has access to...
 * 
 * 
 * mongodb+srv://shivangmewada24:<password>@cluster0.wsc6y4o.mongodb.net/?retryWrites=true&w=majority
 * 
*/