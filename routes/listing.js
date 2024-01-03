const express = require("express");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js");
const { listingSchema, reviewSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const { isLoggedIn, isOwner } = require("../middleware.js");
const listingController = require("../controllers/listing.js");
const multer = require("multer");
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });


const validateListing = (req, res, next) => {
    let { err } = listingSchema.validate(req.body);
    if (err) {
        throw new ExpressError(400, err);
    }
    else {
        next();
    }
};

router.route("/")
    .get(wrapAsync(listingController.index))
    .post(isLoggedIn, upload.single('listing[image]'), validateListing, wrapAsync(listingController.createListing))

    
    //New Request
router.get("/new", isLoggedIn, listingController.renderNewForm);

router.get("/search",wrapAsync(listingController.searchDB));

router.route("/:id")
    .get(wrapAsync(listingController.showListing))
    .put(isLoggedIn, isOwner, upload.single('listing[image]'), validateListing, wrapAsync(listingController.updateListing))
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

    
//Edit Route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.renderEditForm));
    
module.exports = router;

//Show Route
// router.get("/:id", wrapAsync(listingController.showListing));
    
//Create Route
// router.post("/", isLoggedIn,validateListing, wrapAsync(listingController.createListing));

//Update Route
// router.put("/:id", isLoggedIn, isOwner, wrapAsync(listingController.updateListing));

//Delete Route
// router.delete("/:id", isLoggedIn, isOwner, wrapAsync(listingController.destroyListing));

//upload.single('...') will upload the file in cloudinary... 

//All listings request
// router.get("/", wrapAsync(listingController.index));