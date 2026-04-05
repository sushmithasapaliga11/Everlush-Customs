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

export const WHATSAPP_NUMBER = "919999999999"; // Replace with actual number
export const UPI_ID = "example@upi"; // Replace with actual UPI ID
export const ADMIN_PASSWORD = "everlush2024"; // Change this!

// Google Apps Script Web App URL - user must deploy and paste URL here
export const GOOGLE_SCRIPT_URL = "";
