const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.index = async (req, res) => {
    let alllistings = await Listing.find({});
    res.render("listings/index.ejs", { alllistings });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id).populate({ path: "reviews", populate: { path: "author" } }).populate("owner");
    if (!listing) {
        req.flash("error", "Such a listing does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res, next) => {
    
    let response = await geocodingClient.forwardGeocode({
        query: req.body.listing.location,
        limit: 1
      })
        .send();
    
    // console.log(response.body.features[0].geometry);


    let url = req.file.path;
    let filename = req.file.filename;
    const newlisting = new Listing(req.body.listing);
    newlisting.geometry = response.body.features[0].geometry
    newlisting.image = { filename, url };
    newlisting.owner = req.user._id;
    let savedListing = await newlisting.save();
    console.log(savedListing);
    req.flash("success", "New Listing created!");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Such a listing does not exist");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload","/upload/w_250");
    res.render("listings/edit.ejs", { listing ,originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    if (!req.body.listing) {
        throw new ExpressError(400, "Please send valid data");
    }
    
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing});

    let response = await geocodingClient.forwardGeocode({
        query: listing.location,
        limit: 1
      })
        .send();

    listing.geometry = response.body.features[0].geometry;
    await listing.save();

    if (typeof req.file != "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { filename,url };
        await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req, res) => {
    let { id } = req.params;
    let deletedlisting = await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

module.exports.searchDB = async (req,res)=>{
    const searchby = req.query.searchby;
    const alllistings = await Listing.find({$or:[{title:searchby},{location:searchby},{country:searchby}]}).collation({locale:"en",strength:2});
    if(alllistings.length>0)
    {
        res.render("listings/search.ejs",{alllistings});
    }
    else
    {
        req.flash("error","Sorry!, no result found!");
        res.redirect("/listings");
    }
};