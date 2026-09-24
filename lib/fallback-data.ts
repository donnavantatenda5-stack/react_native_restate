import { agentImages, propertiesImages, reviewImages } from "./data";

const propertyTypes = [
  "House",
  "Townhomes",
  "Condos",
  "Duplexes",
  "Studios",
  "Villa",
  "Apartments",
  "Others",
];

const facilitiesList = [
  "Laundry",
  "Car Parking",
  "Sports Center",
  "Cutlery",
  "Gym",
  "Swimming pool",
  "Wifi",
  "Pet Center",
];

const names = [
  "Cozy Family Home",
  "Modern Downtown Apartment",
  "Luxury Beach Villa",
  "Charming Suburban Townhome",
  "Sunny Studio Loft",
  "Classic Brick Duplex",
  "Skyline Condo",
  "Tranquil Garden House",
  "Elegant Executive Condo",
  "Riverside Family Villa",
  "Compact Urban Apartment",
  "Spacious Century Townhome",
];

export const demoProperties: Record<string, any>[] = names.map(
  (name, index) => ({
    $id: `demo-${index + 1}`,
    $createdAt: new Date(
      Date.now() - index * 86400000
    ).toISOString(),
    $updatedAt: new Date().toISOString(),
    $permissions: [],
    name,
    type: propertyTypes[index % propertyTypes.length],
    description: `This is the description for ${name}. A beautiful home located in a great neighborhood with easy access to amenities, schools, and transport.`,
    address: `${100 + index} Sunset Boulevard, City ${index + 1}`,
    price: 1000 + ((index * 733) % 8500),
    area: 500 + ((index * 211) % 2500),
    bedrooms: (index % 5) + 1,
    bathrooms: (index % 4) + 1,
    rating: (index % 5) + 1,
    facilities: facilitiesList.filter((_, f) => (index + f) % 3 !== 0),
    image: propertiesImages[index % propertiesImages.length],
    agent: {
      $id: `demo-agent-${(index % 5) + 1}`,
      name: `Agent ${(index % 5) + 1}`,
      email: `agent${(index % 5) + 1}@example.com`,
      avatar: agentImages[index % agentImages.length],
    },
    reviews: [
      {
        $id: `demo-review-${index}-a`,
        $createdAt: new Date(Date.now() - 86400000).toISOString(),
        name: `Reviewer ${index + 1}`,
        avatar: reviewImages[index % reviewImages.length],
        review: `This is a review by Reviewer ${index + 1}. Beautiful place, highly recommended!`,
        rating: (index % 5) + 1,
      },
      {
        $id: `demo-review-${index}-b`,
        $createdAt: new Date(Date.now() - 172800000).toISOString(),
        name: `Reviewer ${index + 2}`,
        avatar: reviewImages[(index + 1) % reviewImages.length],
        review: `This is a review by Reviewer ${index + 2}. Great location and excellent value.`,
        rating: ((index + 1) % 5) + 1,
      },
    ],
    gallery: [index, index + 1],
  })
);