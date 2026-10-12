import { z } from "zod";

export const CATEGORIES = [
    "Electronics",
    "Fashion",
    "Home",
    "Beauty",
    "Sports",
    "Books",
    "Toys",
    "Wears",
    "Others",
] as const;

export const productSchema = z.object({
    name: z.string().trim().min(1, "Product name is required"),
    description: z
        .string()
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(2000, "Description is too long"),
    category: z.enum(CATEGORIES, { message: "Please select a category" }),
    price: z
        .string()
        .trim()
        .min(1, "Price is required")
        .transform(Number)
        .pipe(z.number().gt(0, "Price must be greater than 0")),
    quantity: z
        .string()
        .trim()
        .min(1, "Quantity is required")
        .transform(Number)
        .pipe(z.int("Quantity must be a whole number").min(0, "Cannot be negative")),
});