import { Permission, Role } from "react-native-appwrite";

import { categories, facilities } from "@/constants/data";

import { account, config, databases } from "./appwrite";
import {
  agentImages,
  galleryImages,
  propertiesImages,
  reviewImages,
} from "./data";

type SeedData = Record<string, string | number | string[]>;

type SeedFixture = {
  id: string;
  data: SeedData;
};

export interface SeedResult {
  agents: number;
  reviews: number;
  galleries: number;
  properties: number;
}

const propertyTypes = categories
  .map(({ category }) => category)
  .filter((category) => category !== "All");
const facilityNames = facilities.map(({ title }) => title);
const publicReadPermissions = [Permission.read(Role.any())];

const agentDetails = [
  { name: "Ava Morgan", email: "ava.morgan@example.com" },
  { name: "Liam Chen", email: "liam.chen@example.com" },
  { name: "Sofia Patel", email: "sofia.patel@example.com" },
  { name: "Noah Williams", email: "noah.williams@example.com" },
  { name: "Mia Rodriguez", email: "mia.rodriguez@example.com" },
];

const firstNames = ["Avery", "Jordan", "Taylor", "Casey", "Riley"];
const lastNames = ["Brooks", "Carter", "Diaz", "Ellis"];
const reviewTexts = [
  "Beautiful property, thoughtful layout, and excellent neighborhood amenities.",
  "The home was even better than the photos, and the location was very convenient.",
  "A comfortable space with great natural light and quick access to nearby services.",
  "Well maintained, quiet, and ideal for a family or a long weekend stay.",
  "Excellent value, responsive hosts, and a smooth check-in experience.",
];

const propertyDetails = [
  { name: "Cozy Family Home", type: "House" },
  { name: "Modern Downtown Apartment", type: "Apartments" },
  { name: "Luxury Beach Villa", type: "Villa" },
  { name: "Charming Suburban Townhome", type: "Townhomes" },
  { name: "Sunny Studio Loft", type: "Studios" },
  { name: "Classic Brick Duplex", type: "Duplexes" },
  { name: "Skyline Condo", type: "Condos" },
  { name: "Tranquil Garden House", type: "House" },
  { name: "Elegant Executive Condo", type: "Condos" },
  { name: "Riverside Family Villa", type: "Villa" },
  { name: "Compact Urban Apartment", type: "Apartments" },
  { name: "Spacious Century Townhome", type: "Townhomes" },
  { name: "Harbor View Penthouse", type: "Apartments" },
  { name: "Arts District Loft", type: "Studios" },
  { name: "Lakeside Retreat", type: "Villa" },
  { name: "Modern Farmhouse", type: "House" },
  { name: "City View Residence", type: "Condos" },
  { name: "Tropical Bungalow", type: "House" },
  { name: "Historic Row House", type: "Townhomes" },
  { name: "Smart Home Estate", type: "Duplexes" },
];

const locations = [
  { city: "Los Angeles, CA", geolocation: "34.0522,-118.2437" },
  { city: "New York, NY", geolocation: "40.7128,-74.0060" },
  { city: "Miami, FL", geolocation: "25.7617,-80.1918" },
  { city: "Denver, CO", geolocation: "39.7392,-104.9903" },
  { city: "Seattle, WA", geolocation: "47.6062,-122.3321" },
  { city: "Austin, TX", geolocation: "30.2672,-97.7431" },
  { city: "Chicago, IL", geolocation: "41.8781,-87.6298" },
  { city: "Portland, OR", geolocation: "45.5152,-122.6784" },
  { city: "Boston, MA", geolocation: "42.3601,-71.0589" },
  { city: "San Diego, CA", geolocation: "32.7157,-117.1611" },
];

const streetNames = [
  "Sunset Boulevard",
  "Leonard Street",
  "Ocean Drive",
  "Larimer Street",
  "Pine Street",
  "Congress Avenue",
  "North Wells Street",
  "Alder Street",
  "Beacon Street",
  "Cabrillo Highway",
];

const propertyDescriptions = [
  "A bright and welcoming home with comfortable living spaces, modern conveniences, and easy access to shops, parks, and transport.",
  "Thoughtfully designed with generous natural light, open entertaining areas, and a convenient location close to popular local destinations.",
  "A polished retreat offering quiet surroundings, quality finishes, and flexible spaces for relaxing, working, or hosting guests.",
  "Well situated for everyday living, with nearby dining, recreation, schools, and a warm neighborhood atmosphere.",
  "A distinctive property with memorable views, practical amenities, and enough room for both relaxation and entertainment.",
];

function fixtureId(collection: string, index: number): string {
  return `seed_${collection}_${String(index + 1).padStart(2, "0")}`;
}

function selectValues<T>(values: T[], count: number, offset: number): T[] {
  if (values.length === 0 || count < 0 || count > values.length) {
    throw new Error("Unable to create a valid seed-data selection.");
  }

  return Array.from(
    { length: count },
    (_, index) => values[(offset + index) % values.length]
  );
}

const agents: SeedFixture[] = agentDetails.map((agent, index) => ({
  id: fixtureId("agent", index),
  data: {
    name: agent.name,
    email: agent.email,
    avatar: agentImages[index % agentImages.length],
  },
}));

const reviews: SeedFixture[] = Array.from({ length: 20 }, (_, index) => ({
  id: fixtureId("review", index),
  data: {
    name: `${firstNames[index % firstNames.length]} ${
      lastNames[Math.floor(index / firstNames.length) % lastNames.length]
    }`,
    avatar: reviewImages[index % reviewImages.length],
    review: reviewTexts[index % reviewTexts.length],
    rating: ((index * 2) % 5) + 1,
  },
}));

const galleries: SeedFixture[] = galleryImages.map((image, index) => ({
  id: fixtureId("gallery", index),
  data: { image },
}));

const properties: SeedFixture[] = propertyDetails.map((property, index) => {
  const location = locations[index % locations.length];
  const reviewIds = reviews.map(({ id }) => id);
  const galleryIds = galleries.map(({ id }) => id);

  return {
    id: fixtureId("property", index),
    data: {
      name: property.name,
      type: property.type,
      description: propertyDescriptions[index % propertyDescriptions.length],
      address: `${100 + index * 17} ${
        streetNames[index % streetNames.length]
      }, ${location.city}`,
      geolocation: location.geolocation,
      price: 1250 + ((index * 733) % 8750),
      area: 500 + ((index * 211) % 2800),
      bedrooms: (index % 5) + 1,
      bathrooms: (index % 4) + 1,
      rating: (index % 3) + 3,
      facilities: selectValues(facilityNames, (index % 5) + 4, index),
      image: propertiesImages[index % propertiesImages.length],
      agent: agents[index % agents.length].id,
      reviews: selectValues(reviewIds, (index % 3) + 5, index * 2),
      gallery: selectValues(galleryIds, (index % 6) + 3, index * 3),
    },
  };
});

export const seedFixtures = {
  agents,
  reviews,
  galleries,
  properties,
};

function assertUniqueIds(collection: string, fixtures: SeedFixture[]): void {
  const ids = new Set<string>();

  for (const fixture of fixtures) {
    if (ids.has(fixture.id)) {
      throw new Error(`Duplicate ${collection} seed ID: ${fixture.id}`);
    }
    ids.add(fixture.id);
  }
}

function validateSeedFixtures(): void {
  assertUniqueIds("agent", agents);
  assertUniqueIds("review", reviews);
  assertUniqueIds("gallery", galleries);
  assertUniqueIds("property", properties);

  if (
    agents.length < 5 ||
    reviews.length < 20 ||
    galleries.length < 10 ||
    properties.length < 20
  ) {
    throw new Error("The demo seed dataset is incomplete.");
  }

  const agentIds = new Set(agents.map(({ id }) => id));
  const reviewIds = new Set(reviews.map(({ id }) => id));
  const galleryIds = new Set(galleries.map(({ id }) => id));

  for (const property of properties) {
    const { agent, reviews: propertyReviews, gallery } = property.data;

    if (typeof agent !== "string" || !agentIds.has(agent)) {
      throw new Error(`Invalid agent relationship for ${property.id}.`);
    }

    if (
      !Array.isArray(propertyReviews) ||
      propertyReviews.some(
        (reviewId: unknown) =>
          typeof reviewId !== "string" || !reviewIds.has(reviewId)
      )
    ) {
      throw new Error(`Invalid review relationships for ${property.id}.`);
    }

    if (
      !Array.isArray(gallery) ||
      gallery.some(
        (galleryId: unknown) =>
          typeof galleryId !== "string" || !galleryIds.has(galleryId)
      )
    ) {
      throw new Error(`Invalid gallery relationships for ${property.id}.`);
    }
  }

  const seededTypes = new Set(
    properties.map(({ data }) => String(data.type))
  );
  const seededFacilities = new Set(
    properties.flatMap(({ data }) =>
      Array.isArray(data.facilities)
        ? data.facilities.map(String)
        : []
    )
  );

  if (
    propertyTypes.some((type) => !seededTypes.has(type)) ||
    facilityNames.some((facility) => !seededFacilities.has(facility))
  ) {
    throw new Error("The demo seed dataset does not cover every option.");
  }
}

function requireConfig(name: string, value?: string): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing Appwrite configuration: ${name}.`);
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(normalizedValue)) {
    throw new Error(`Invalid Appwrite configuration value: ${name}.`);
  }

  return normalizedValue;
}

function getSeedConfig() {
  return {
    databaseId: requireConfig(
      "EXPO_PUBLIC_APPWRITE_DATABASE_ID",
      config.databaseId
    ),
    agents: requireConfig(
      "EXPO_PUBLIC_APPWRITE_AGENTS_COLLECTION_ID",
      config.agentsCollectionId
    ),
    reviews: requireConfig(
      "EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID",
      config.reviewsCollectionId
    ),
    galleries: requireConfig(
      "EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID",
      config.galleriesCollectionId
    ),
    properties: requireConfig(
      "EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID",
      config.propertiesCollectionId
    ),
  };
}

async function requireAuthenticatedUser(): Promise<void> {
  try {
    await account.get();
  } catch {
    throw new Error("Sign in before seeding the demo database.");
  }
}

async function upsertFixtures(
  databaseId: string,
  collectionId: string,
  fixtures: SeedFixture[]
): Promise<void> {
  const batchSize = 5;

  for (let index = 0; index < fixtures.length; index += batchSize) {
    const batch = fixtures.slice(index, index + batchSize);
    await Promise.all(
      batch.map(({ id, data }) =>
        databases.upsertDocument(
          databaseId,
          collectionId,
          id,
          data,
          publicReadPermissions
        )
      )
    );
  }
}

async function seed(): Promise<SeedResult> {
  if (!__DEV__) {
    throw new Error("Demo data can only be seeded in development builds.");
  }

  validateSeedFixtures();
  await requireAuthenticatedUser();

  const collectionIds = getSeedConfig();

  await upsertFixtures(
    collectionIds.databaseId,
    collectionIds.agents,
    seedFixtures.agents
  );
  await Promise.all([
    upsertFixtures(
      collectionIds.databaseId,
      collectionIds.reviews,
      seedFixtures.reviews
    ),
    upsertFixtures(
      collectionIds.databaseId,
      collectionIds.galleries,
      seedFixtures.galleries
    ),
  ]);
  await upsertFixtures(
    collectionIds.databaseId,
    collectionIds.properties,
    seedFixtures.properties
  );

  return {
    agents: seedFixtures.agents.length,
    reviews: seedFixtures.reviews.length,
    galleries: seedFixtures.galleries.length,
    properties: seedFixtures.properties.length,
  };
}

export default seed;
