import { z } from "zod";

export const productSchema = z.object({
    name: z.string().trim().min(1, "Product name is required"),
    price: z
        .string()
        .trim()
        .min(1, "Price is required")
        .transform((val) => Number(val))
        .pipe(
            z
                .number("Value must be a number")
                .gt(0, "Price must be greater than 0")
        ),
    image: z.url("Invalid image URL").trim(),
});

console.log(productSchema.safeParse({ name: "taye", price: "", image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=698&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" }))

