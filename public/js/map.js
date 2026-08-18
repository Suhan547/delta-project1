const map = L.map("map").setView(
    [listing.geometry.coordinates[1], listing.geometry.coordinates[0]],
    10
);

// OpenStreetMap tiles
L.tileLayer(
    "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }
).addTo(map);


// Marker
const marker = L.marker([
    listing.geometry.coordinates[1],
    listing.geometry.coordinates[0]
])
.addTo(map);


marker.bindPopup(
    `<h4>${listing.location}</h4><p>${listing.country}</p>`
).openPopup();