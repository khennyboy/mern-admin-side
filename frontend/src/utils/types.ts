import type { InputProps } from "@chakra-ui/react";
import type { CATEGORIES } from "./schema";



export type Category = (typeof CATEGORIES)[number];

export interface ProductImage {
  url: string;
  publicId: string;
}

// what the client sends to create/update
export interface ProductPayload {
  name: string;
  description: string;
  category: Category;
  price: number;
  quantity: number;
  images: ProductImage[];
}

// what the server returns (includes server-owned fields)
export interface Product extends ProductPayload {
  slug: string;
}

export type ProductDetail = Product & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormProps = {
  submitLabel?: string;
  product?: ProductDetail
  onSuccess?: () => void;
};

export type FloatingInputProps = InputProps & {
  label: string;
  error?: string
};



// handles pagination data type
export type Pagination = {
  pageSize: number;
  totalPages: number;
  totalProducts: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

// for GET /products — returns a LIST
export type GetProductsSuccessResponse = {
  success: true;
  data: ProductDetail[];
  totalProducts: number;
  pageSize: number;
};

export type GetProductsErrorResponse = {
  success: false;
  message: string;
};


// for POST /products 
export type CreateProductErrorResponse = {
  success: false;
  message: string;
};


// for other api's responsee
export type OtherProductResponse = {
  success: boolean,
  message: string
}

export type ProductCardProps = {
  product: ProductDetail;
};

