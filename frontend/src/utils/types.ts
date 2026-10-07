import type { InputProps } from "@chakra-ui/react";


export interface Product {
  name: string;
  price: number;
  image: string;
  quantity: number;
}

export type ProductDetail = Product & {
  _id: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductFormProps = {
  submitLabel?: string;
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

export type ProductStore = {
  updateDialog: boolean;
  setUpdateDialog: (open: boolean) => void;
  products: ProductDetail[];
  setProducts: (products: ProductDetail[]) => void;
  totalProducts: number;
  pageSize: number;
  setCounts: (totalProducts: number, pageSize: number) => void;
  selectedProduct: ProductDetail | null;
  setSelectedProduct: (product: ProductDetail | null) => void;

};
