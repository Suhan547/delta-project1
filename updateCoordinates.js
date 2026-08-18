const mongoose = require("mongoose");
const Listing = require("./models/listing");
const axios = require("axios");

const MONGO_URL = "mongodb://127.0.0.1:27017/wonderlust";

async function updateCoordinates() {
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB connected");

    const listings = await Listing.find({
        "geometry.coordinates": { $size: 0 }
    });

    console.log(`Found ${listings.length} listings`);

    for (let listing of listings) {

        try {
            const query = `${listing.location}, ${listing.country}`;

            const response = await axios.get(
                "https://nominatim.openstreetmap.org/search",
                {
                    params: {
                        q: query,
                        format: "json",
                        limit: 1
                    },
                    headers: {
                        "User-Agent": "wanderlust-project"
                    }
                }
            );

            if (response.data.length > 0) {

                const lat = response.data[0].lat;
                const lon = response.data[0].lon;

                listing.geometry = {
                    type: "Point",
                    coordinates: [
                        Number(lon),
                        Number(lat)
                    ]
                };

                await listing.save();

                console.log(
                    "Updated:",
                    listing.title,
                    listing.geometry.coordinates
                );

            } else {
                console.log("Not found:", query);
            }

        } catch (err) {
            console.log("Error:", listing.title, err.message);
        }

        // avoid OpenStreetMap rate limit
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    mongoose.connection.close();
}

updateCoordinates();