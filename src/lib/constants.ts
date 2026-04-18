export interface ProductOption {
  label: string;
  price: number;
}

export interface Product {
  name: string;
  options: ProductOption[] | null; // null = no options, fixed price
  fixedPrice?: number;
}

export const PRODUCTS: Product[] = [
  {
    name: "Flower Bouquet",
    options: [
      { label: "Mini", price: 549 },
      { label: "Standard", price: 749 },
      { label: "XL", price: 1149 },
    ],
  },
  {
    name: "Chocolate Bouquet",
    options: [
      { label: "Mini", price: 649 },
      { label: "Standard", price: 899 },
      { label: "XL", price: 1199 },
    ],
  },
  {
    name: "Chocolate Tower",
    options: [
      { label: "1 Layer", price: 699 },
      { label: "2 Layer", price: 1199 },
      { label: "3 Layer", price: 1699 },
    ],
  },
  {
    name: "Keychains",
    options: null,
    fixedPrice: 199,
  },
  {
    name: "Bracelets",
    options: null,
    fixedPrice: 299,
  },
  {
    name: "Coffee Cup",
    options: null,
    fixedPrice: 399,
  },
  {
    name: "Greeting Cards",
    options: null,
    fixedPrice: 249,
  },
];

export const WHATSAPP_NUMBER = "918147016408"; // Replace with actual number
export const UPI_ID = "8147016408@ybl"; // Replace with actual UPI ID
export const ADMIN_PASSWORD = "everlush2026"; // Change this!

// Google Apps Script Web App URL - user must deploy and paste URL here
export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_Y-TP6E30tR3OeDf4CUNlxfWM1o7WpIvl27x10MN7XfJbtesoxTjENq3e1IRif3NM/exec";
