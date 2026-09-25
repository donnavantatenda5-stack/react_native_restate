import AsyncStorage from "@react-native-async-storage/async-storage";

const BOOKINGS_STORAGE_KEY = "restate:bookings";

export interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  address: string;
  price: number;
  date: string;
  guests: number;
  image: string | number;
  createdAt: string;
}

interface BookingProperty {
  $id?: string;
  name?: string;
  address?: string;
  price?: number | string;
  image?: unknown;
}

function normalizeImage(image: unknown): string | number {
  return typeof image === "string" || typeof image === "number" ? image : "";
}

export async function getBookings(): Promise<Booking[]> {
  try {
    const stored = await AsyncStorage.getItem(BOOKINGS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (booking): booking is Booking =>
          !!booking &&
          typeof booking === "object" &&
          typeof (booking as Booking).id === "string"
      )
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );
  } catch {
    return [];
  }
}

export async function createBooking({
  property,
  date,
  guests,
}: {
  property: BookingProperty;
  date: Date;
  guests: number;
}): Promise<Booking> {
  const bookingDate = new Date(date);
  const guestCount = Number(guests);

  if (Number.isNaN(bookingDate.getTime()) || guestCount < 1) {
    throw new Error("Choose a valid date and at least one guest.");
  }

  const now = new Date().toISOString();
  const propertyId = property.$id ?? `property-${Date.now()}`;
  const booking: Booking = {
    id: `${propertyId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    propertyId,
    propertyName: property.name ?? "Property",
    address: property.address ?? "Address unavailable",
    price: Number(property.price ?? 0),
    date: bookingDate.toISOString(),
    guests: guestCount,
    image: normalizeImage(property.image),
    createdAt: now,
  };

  const bookings = await getBookings();
  await AsyncStorage.setItem(
    BOOKINGS_STORAGE_KEY,
    JSON.stringify([booking, ...bookings])
  );

  return booking;
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const bookings = await getBookings();
  await AsyncStorage.setItem(
    BOOKINGS_STORAGE_KEY,
    JSON.stringify(bookings.filter((booking) => booking.id !== bookingId))
  );
}
