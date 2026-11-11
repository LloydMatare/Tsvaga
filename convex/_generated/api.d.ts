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
import type * as lib_bookingNotify from "../lib/bookingNotify.js";
import type * as lib_dates from "../lib/dates.js";
import type * as lib_emailTemplates from "../lib/emailTemplates.js";
import type * as lib_extractStay from "../lib/extractStay.js";
import type * as lib_inventory from "../lib/inventory.js";
import type * as lib_notify from "../lib/notify.js";
import type * as lib_paynow from "../lib/paynow.js";
import type * as lib_scrapeDo from "../lib/scrapeDo.js";
import type * as lib_seedStayDetails from "../lib/seedStayDetails.js";
import type * as lib_slug from "../lib/slug.js";
import type * as lib_stay from "../lib/stay.js";
import type * as lib_staySourceSchema from "../lib/staySourceSchema.js";
import type * as lib_staySources from "../lib/staySources.js";
import type * as notifications from "../notifications.js";
import type * as operators from "../operators.js";
import type * as payments from "../payments.js";
import type * as payouts from "../payouts.js";
import type * as properties from "../properties.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as stayRefresh from "../stayRefresh.js";
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
  "lib/bookingNotify": typeof lib_bookingNotify;
  "lib/dates": typeof lib_dates;
  "lib/emailTemplates": typeof lib_emailTemplates;
  "lib/extractStay": typeof lib_extractStay;
  "lib/inventory": typeof lib_inventory;
  "lib/notify": typeof lib_notify;
  "lib/paynow": typeof lib_paynow;
  "lib/scrapeDo": typeof lib_scrapeDo;
  "lib/seedStayDetails": typeof lib_seedStayDetails;
  "lib/slug": typeof lib_slug;
  "lib/stay": typeof lib_stay;
  "lib/staySourceSchema": typeof lib_staySourceSchema;
  "lib/staySources": typeof lib_staySources;
  notifications: typeof notifications;
  operators: typeof operators;
  payments: typeof payments;
  payouts: typeof payouts;
  properties: typeof properties;
  reviews: typeof reviews;
  seed: typeof seed;
  stayRefresh: typeof stayRefresh;
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
