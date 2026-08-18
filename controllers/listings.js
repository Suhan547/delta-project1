const Listing = require("../models/listing");
const axios = require("axios");

module.exports.index = async (req, res) => {
    const { search, category } = req.query;

    let filter = {};

    if (search) {
        filter = {
            $or: [
                { title: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
                { country: { $regex: search, $options: "i" } }
            ]
        };
    }

    if (category) {
        filter.category = category;
    }

    const allListings = await Listing.find(filter);

    res.render("listings/index", {
        allListings,
        search,
        category
    });
};

module.exports.renderNewForm = (req,res) => {
   res.render("listings/new.ejs");
};

module.exports.showListing = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
    .populate({path: "reviews", populate: {
        path: "author",
    },
})
    .populate("owner");
    if(!listing){
        req.flash("error","Listing you requested does not exist!");
          return res.redirect("/listings");
    }
    console.log(listing);
     res.render("listings/show.ejs", { listing });
};

module.exports.createListing = async (req, res) => {
    let url = req.file.path;
    let filename = req.file.filename;

    const address = `${req.body.listing.location}, ${req.body.listing.country}`;

    const response = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
            params: {
                q: address,
                format: "json",
                limit: 1,
            },
            headers: {
                "User-Agent": "wanderlust-app",
            },
        }
    );

    if (response.data.length === 0) {
        req.flash("error", "Location not found!");
        return res.redirect("/listings/new");
    }

    const latitude = parseFloat(response.data[0].lat);
    const longitude = parseFloat(response.data[0].lon);

    const newListing = new Listing(req.body.listing);

    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    newListing.geometry = {
        type: "Point",
        coordinates: [longitude, latitude],
    };

    await newListing.save();

    req.flash("success", "New Listing Created");
    res.redirect("/listings");
};

module.exports.renderEditForm = async (req, res) => {
    let { id } = req.params;
    id = id.trim();

    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","Listing you requested does not exist!");
          return res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl});
};

module.exports.updateListing = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing},
     { new: true }
    );

    if(typeof req.file !== "undefined"){
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
    }
    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.destroyListing = async (req,res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};