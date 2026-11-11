/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as availability from "../availability.js";
import type * as bookings from "../bookings.js";
import type * as crons from "../crons.js";
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_paynow from "../lib/paynow.js";
import type * as lib_slug from "../lib/slug.js";
import type * as lib_stay from "../lib/stay.js";
import type * as operators from "../operators.js";
import type * as payments from "../payments.js";
import type * as payouts from "../payouts.js";
import type * as properties from "../properties.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  availability: typeof availability;
  bookings: typeof bookings;
  crons: typeof crons;
  favorites: typeof favorites;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/dates": typeof lib_dates;
  "lib/paynow": typeof lib_paynow;
  "lib/slug": typeof lib_slug;
  "lib/stay": typeof lib_stay;
  operators: typeof operators;
  payments: typeof payments;
  payouts: typeof payouts;
  properties: typeof properties;
  reviews: typeof reviews;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
