/**
 * Property facts checked against these sources on 2026-11-11.
 * Stable seed slugs are retained so existing links and bookings keep working.
 * Rates, inventory, reviews and commercial policies are demo fixtures, not
 * live offers or a representation of a commercial relationship with a lodge.
 */
type StayDetails = {
  sourceUrl: string;
  name: string;
  city: string;
  region: string;
  address: string;
  propertyType: "hotel" | "lodge" | "guesthouse" | "safari_camp";
  summary: string;
  description: string;
  amenities: string[];
  images?: string[];
};

export const seedStayDetails: Record<string, StayDetails> = {
  "pamusha-lodge-victoria-falls": {
    sourceUrl: "https://pamusha.com/",
    name: "Pamusha Lodge",
    city: "Victoria Falls",
    region: "Matabeleland North",
    address: "583 Manyika Road, Victoria Falls, Zimbabwe",
    propertyType: "lodge",
    summary: "Family-run, 21-room lodge with gardens, a pool and Zambezi cruises.",
    description:
      "Pamusha is a family-run lodge in a quiet residential part of Victoria Falls. Its 21 rooms offer air conditioning, television, an in-room safe and fibre Wi-Fi. Guests can relax in the gardens, by the pool or around the fire pit, and dine under the gazebo. Pamusha operates its own three Zambezi cruise boats and transfer vehicles, and arranges local activities and cross-border travel. Airport transfers are available by arrangement, not as a free shuttle.",
    amenities: [
      "Wi-Fi",
      "Air conditioning",
      "Swimming pool",
      "Restaurant",
      "Bar",
      "Airport transfer",
      "Laundry service",
      "Spa",
    ],
    images: [
      "https://pamusha.com/wp-content/themes/pamusha/assets/img/gardens-palms.jpg",
      "https://pamusha.com/wp-content/themes/pamusha/assets/img/room-double.jpg",
      "https://pamusha.com/wp-content/themes/pamusha/assets/img/room-honeymoon.jpg",
    ],
  },
  "zambezi-sands-river-lodge": {
    sourceUrl: "https://batokaafrica.com/properties/zambezi-sands/",
    name: "Zambezi Sands by Batoka",
    city: "Victoria Falls",
    region: "Matabeleland North",
    address: "Zambezi River, Victoria Falls region, Zimbabwe",
    propertyType: "safari_camp",
    summary: "Ten luxury Bedouin-style tents on the banks of the Zambezi River.",
    description:
      "Zambezi Sands by Batoka is an all-inclusive luxury tented camp beside the Zambezi River in the Victoria Falls region. Its ten Bedouin-style tents have private viewing decks, en-suite bathrooms, outdoor showers and lounge areas. Pool Suites include a private splash pool, while Deck Suites have a private viewing deck. The main lodge has a dining room with an open theatre kitchen, a lounge, bar and shaded outdoor deck. Wi-Fi is available in the main lodge. Guided game drives and walks explore the surrounding wildlife; spa treatments are charged separately.",
    amenities: [
      "Wi-Fi",
      "Restaurant",
      "Bar",
      "River views",
      "Private viewing deck",
      "Outdoor shower",
      "Safari drives",
      "Guided walks",
      "Spa",
      "Solar power",
      "Backup power",
      "Laundry service",
    ],
    images: [
      "https://batokaafrica.com/wp-content/uploads/2021/08/zambezi-bg-1-scaled.jpg",
      "https://batokaafrica.com/wp-content/uploads/2021/08/zambezi-poolsuite-slider-1.jpg",
      "https://batokaafrica.com/wp-content/uploads/2021/08/zambezi-decksuite-slider-1.jpg",
    ],
  },
  "kwaterry-guest-lodge-harare": {
    sourceUrl: "https://kwa-terry.co.zw/menus/zvinyenze/",
    name: "KwaTerry Village",
    city: "Mhondoro Ngezi",
    region: "Mashonaland West",
    address: "Village 6, Turf, Mhondoro Ngezi, Zimbabwe",
    propertyType: "guesthouse",
    summary: "A rural village stay with traditional Zimbabwean food in Mhondoro Ngezi.",
    description:
      "KwaTerry Village is the accommodation offering of Terry Maphosa's rural hospitality and farming venture in Village 6, Turf, Mhondoro Ngezi. The destination celebrates Zimbabwean village life and traditional food, with a restaurant serving dishes such as roadrunner chicken, goat and sadza. It is a rural destination near Zimplats, not a Borrowdale guesthouse in Harare. Contact KwaTerry directly to confirm room arrangements, facilities and current accommodation rates.",
    amenities: ["Restaurant"],
  },
  "bronte-garden-hotel-harare": {
    sourceUrl: "https://brontehotel.com/accommodation/",
    name: "The Brontë Garden Hotel",
    city: "Harare",
    region: "Harare Metropolitan",
    address: "132 Baines Avenue, corner Simon Muzenda Street, Harare, Zimbabwe",
    propertyType: "hotel",
    summary: "Harare garden hotel with Shona sculptures, swimming pools and dining.",
    description:
      "The Brontë Garden Hotel is set in landscaped gardens with a collection of Shona sculptures in Harare. Accommodation ranges from Kingsley budget rooms and standard rooms to superior rooms and executive suites. Standard rooms have queen or twin beds, en-suite bathrooms and private verandas; executive suites include a separate lounge and work area. Guests can enjoy the swimming pools, Palms Restaurant and Wild Date Bar. Garden-facing function rooms cater for conferences and private events.",
    amenities: [
      "Wi-Fi",
      "Swimming pool",
      "Restaurant",
      "Bar",
      "Gardens",
      "Conference facilities",
    ],
  },
  "n1-city-hotel-harare": {
    sourceUrl: "https://www.n1hotel.co.zw/samoramachel/",
    name: "N1 Hotel Samora Machel",
    city: "Harare",
    region: "Harare Metropolitan",
    address: "126 Samora Machel Avenue, Harare, Zimbabwe",
    propertyType: "hotel",
    summary: "Central Harare hotel with en-suite rooms and a breakfast restaurant.",
    description:
      "N1 Hotel Samora Machel is the N1 group's hotel at 126 Samora Machel Avenue in central Harare. Room categories include Standard Double, Standard Twin, Deluxe Double, Superior Double and Executive Double. Rooms offer en-suite bathrooms, Wi-Fi, satellite television, a safe, a work area and tea and coffee facilities. Standard rooms have ceiling fans; air conditioning is listed for Superior and Executive rooms. The restaurant serves breakfast, charged separately, but not lunch or dinner. A boardroom is available, and third-party airport taxis can be arranged at the guest's expense.",
    amenities: [
      "Wi-Fi",
      "Breakfast restaurant",
      "Conference facilities",
      "24-hour front desk",
      "Tea and coffee facilities",
    ],
  },
  "bulawayo-grand-lodge": {
    sourceUrl: "https://grandpalm.co.zw/",
    name: "Grand Palm Lodge",
    city: "Bulawayo",
    region: "Bulawayo Metropolitan",
    address: "91 Circular Drive, Burnside, Bulawayo, Zimbabwe",
    propertyType: "lodge",
    summary: "Luxury lodge and conferencing centre in Bulawayo's Burnside suburb.",
    description:
      "Grand Palm Lodge is a luxury accommodation and conferencing centre in the quiet suburb of Burnside, Bulawayo. The lodge offers rooms for city visits, business travel and romantic getaways, alongside venues for weddings, celebrations, conferences and visiting delegations. Its address is 91 Circular Drive, away from the city-centre location used in the original demo listing. Contact the lodge for current room options, inclusions and event arrangements.",
    amenities: ["Conference facilities", "Wedding venue"],
  },
  "matobo-hills-retreat": {
    sourceUrl: "https://www.matobohillslodge.co.zw/",
    name: "Matobo Hills Lodge",
    city: "Matobo",
    region: "Matabeleland South",
    address: "Matobo National Park, near Bulawayo, Zimbabwe",
    propertyType: "lodge",
    summary: "Seventeen hillside chalets inside the UNESCO-listed Matobo National Park.",
    description:
      "Matobo Hills Lodge is located inside Matobo National Park, about 50 kilometres south of Bulawayo. Seventeen chalets are set among ancient granite hills, each with an en-suite bathroom, private veranda, tea and coffee station and daily housekeeping. The lodge has a rock pool and dining facilities, with Wi-Fi in the main lodge area. Guided experiences include rhino tracking on foot with a ranger, San rock art, visits to local Ndebele communities and World's View. Transfers can be arranged; activities, dinner and park fees depend on the package selected.",
    amenities: [
      "Wi-Fi",
      "Swimming pool",
      "Restaurant",
      "Bar",
      "Mountain views",
      "Airport transfer",
      "Guided walks",
      "Tea and coffee facilities",
    ],
    images: [
      "https://cb0528c2.delivery.rocketcdn.me/wp-content/uploads/2026/04/about-chalets-exterior.jpg",
      "https://cb0528c2.delivery.rocketcdn.me/wp-content/uploads/2026/04/Luxury-chalet-interior-at-Matobo-Hills-Lodge-with-floor-to-ceiling-windows-overlooking-granite-boulders.jpg",
      "https://cb0528c2.delivery.rocketcdn.me/wp-content/uploads/2026/07/mhl-pool-drone-1600-768x480.jpg",
    ],
  },
  "nyanga-trout-mist-lodge": {
    sourceUrl: "https://africansun.com/hotels/troutbeck-resort/",
    name: "Troutbeck Resort",
    city: "Nyanga",
    region: "Manicaland",
    address: "1 Nyamaropa Road, Troutbeck, Nyanga, Zimbabwe",
    propertyType: "hotel",
    summary: "Historic Nyanga mountain resort overlooking a trout-filled lake.",
    description:
      "Founded in 1947, Troutbeck Resort sits beneath pine-covered hills overlooking a trout-filled lake in Nyanga. Accommodation includes Standard Twin and Double rooms, Deluxe lake-view rooms, Standard King and Executive rooms, and a room designed for guests with disabilities. Dining options include The Beck Restaurant, Sun Lounge and Terrace, and Hare and Hound Bar. Facilities include a swimming pool, nine-hole golf course, conference rooms and sports courts. Activities such as fly fishing, canoeing, horse riding and the Mist Walk Trail are available at an additional charge.",
    amenities: [
      "Wi-Fi",
      "Swimming pool",
      "Restaurant",
      "Bar",
      "Mountain views",
      "Lake views",
      "Golf course",
      "Conference facilities",
      "Children's playground",
      "Tennis court",
    ],
    images: [
      "https://africansun.com/wp-content/uploads/2024/03/Property-General-Troutbeck-43-scaled.jpg",
      "https://africansun.com/wp-content/uploads/2024/03/Property-General-Troutbeck-78-scaled.jpg",
      "https://africansun.com/wp-content/uploads/2024/03/Property-General-Troutbeck-41-scaled.jpg",
    ],
  },
  "vumba-forest-guesthouse": {
    sourceUrl: "https://forestcreek.co.zw/",
    name: "Forest Creek Lodge",
    city: "Vumba",
    region: "Manicaland",
    address: "Vumba, Eastern Highlands, Zimbabwe",
    propertyType: "lodge",
    summary: "A Vumba lodge offering bed and breakfast, family rooms and Wi-Fi.",
    description:
      "Forest Creek Lodge offers a bed-and-breakfast escape in the Vumba area of Zimbabwe's Eastern Highlands. The lodge's published accommodation includes Executive Rooms, Double Rooms and Family Rooms. Family Rooms have a main bedroom and an additional room, each with its own television. Complimentary high-speed Wi-Fi is offered to guests, and luxury and all-terrain vehicles can be hired to explore the region. Confirm the exact arrival directions and current rates with the lodge before travelling.",
    amenities: ["Wi-Fi", "Breakfast", "Family rooms", "Vehicle hire"],
    images: [
      "https://forestcreek.co.zw/images/know-us.jpeg",
      "https://forestcreek.co.zw/images/suite.jpeg",
      "https://forestcreek.co.zw/images/view.jpeg",
    ],
  },
  "kariba-lakeview-lodge": {
    sourceUrl:
      "https://ms.hotels.com/en/ho3038639360/sunset-lakeview-lodge-kariba-zimbabwe/",
    name: "Sunset Lakeview Lodge",
    city: "Kariba",
    region: "Mashonaland West",
    address: "Kariba, Zimbabwe",
    propertyType: "lodge",
    summary: "Kariba lodge with an outdoor pool, children's pool and garden terrace.",
    description:
      "Sunset Lakeview Lodge is a lodge in Kariba listed with an outdoor swimming pool, a children's pool, a garden and a terrace. The Hotels.com listing includes complimentary Wi-Fi and daily English breakfast, as well as air conditioning, daily housekeeping, laundry service, charcoal grills, concierge service and tour or ticket assistance. The front desk operates limited hours. Confirm exact directions, room arrangements and current rates directly before travelling.",
    amenities: [
      "Wi-Fi",
      "Air conditioning",
      "Swimming pool",
      "Children's pool",
      "Breakfast",
      "Laundry service",
      "Garden",
      "Terrace",
      "Barbecue facilities",
    ],
  },
  "great-zimbabwe-guesthouse": {
    sourceUrl: "https://greatzimbabwehotels.com/",
    name: "Great Zimbabwe Hotel",
    city: "Masvingo",
    region: "Masvingo Province",
    address: "Near Great Zimbabwe National Monument, Masvingo, Zimbabwe",
    propertyType: "hotel",
    summary: "A heritage hotel 700 metres from Great Zimbabwe National Monument.",
    description:
      "Great Zimbabwe Hotel is located approximately 700 metres from the UNESCO-listed Great Zimbabwe National Monument. Its architecture and stonework draw inspiration from the historic ruins. Published room categories include Standard Rooms, Executive Rooms and Deluxe Twin Rooms. The hotel offers conference and event facilities with audiovisual equipment and flexible layouts, as well as a campsite within its grounds for campers, backpackers and groups exploring the monument.",
    amenities: ["Conference facilities", "Campsite"],
  },
  "chinhoyi-caves-lodge": {
    sourceUrl: "https://chinhoyicavesmotel.co.zw/",
    name: "Chinhoyi Caves Motel",
    city: "Chinhoyi",
    region: "Mashonaland West",
    address: "A1 / Karoi Road, near Chinhoyi Caves, Chinhoyi, Zimbabwe",
    propertyType: "lodge",
    summary: "A motel beside Chinhoyi Caves on the Harare–Chirundu highway.",
    description:
      "Chinhoyi Caves Motel offers accommodation along the A1 highway linking Harare and Chirundu, within walking distance of Chinhoyi Caves. The motel is a stopover for travellers heading towards Kariba, Mana Pools or Zambia. The property's homepage lists a restaurant and swimming. The nearby recreational park is known for its limestone and dolomite caves and the clear blue Sleeping Pool, also called Chirorodziva. Confirm current room facilities and prices directly; some pages on the motel website still contain unrelated template content.",
    amenities: ["Restaurant", "Swimming pool"],
  },
  "victoria-falls-backpackers": {
    sourceUrl: "https://www.victoriafallsbackpackers.com/",
    name: "Victoria Falls Backpackers Lodge",
    city: "Victoria Falls",
    region: "Matabeleland North",
    address: "357 Gibson Road, Victoria Falls, Zimbabwe",
    propertyType: "lodge",
    summary: "Relaxed budget accommodation with an activities desk and self-drive camping.",
    description:
      "Victoria Falls Backpackers Lodge offers affordable accommodation a short walk from town. Its activities desk helps travellers plan local adventures and find suitable options for their budget. Guests arriving with self-drive camping vehicles can use shady camping spots in a quiet part of the lodge. Transfers and airport pickups can be arranged. The lodge is at 357 Gibson Road, Victoria Falls.",
    amenities: ["Airport transfer", "Activities desk", "Campsite"],
  },
};

export const demoStayPolicies =
  "Demo booking data: room configurations, prices, availability, reviews, meal plans, check-in times and cancellation terms are illustrative unless explicitly verified in the property description. Stock photos may remain where source images could not be verified. Confirm all booking details with the property; these listings do not imply a partnership.";
