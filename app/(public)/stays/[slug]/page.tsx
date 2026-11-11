import { PropertyDetail } from "./property-detail";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function read(
  params: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const guests = read(query, "guests");

  return (
    <PropertyDetail
      slug={slug}
      initialCheckIn={read(query, "checkIn")}
      initialCheckOut={read(query, "checkOut")}
      initialGuests={guests ? Number(guests) : undefined}
    />
  );
}
