import { z } from "zod";

export const productSchema = z.object({
    name: z.string().trim().min(1, "Product name is required"),
    price: z
        .string()
        .trim()
        .min(1, "Price is required")
        .transform(Number)
        .pipe(
            z
                .number("Value must be a number")
                .gt(0, "Price must be greater than 0")
        ),
    image: z.url("Invalid image URL").trim(),
    quantity: z
        .string()
        .trim()
        .min(1, "Quantity is required")
        .transform(Number)
        .pipe(z.int("Quantity must be a whole number").min(0, "Cannot be negative")),
});



