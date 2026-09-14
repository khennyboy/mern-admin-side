import { Button, VStack } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import useAddProduct from "../hooks/useAddProduct";
import useUpdateProduct from "../hooks/useUpdateproduct";
import { useProductStore } from "../store/product-store";
import { productSchema } from "../utils/schema";
import type { Product, ProductFormProps } from "../utils/types";
import FloatingInput from "./FloatingInput";

type ProductFormValues = z.infer<typeof productSchema>;

const ProductForm = ({ submitLabel = "Save" }: ProductFormProps) => {
  const selectedProduct = useProductStore((state) => state.selectedProduct);

  const initialValues: Product = {
    name: selectedProduct?.name || "",
    price: selectedProduct?.price ?? (undefined as unknown as number),
    image: selectedProduct?.image || "",
  };

  const { updateProduct, isUpdating } = useUpdateProduct();
  const { addProduct, isAdding } = useAddProduct();

  const isLoading = isUpdating || isAdding;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: initialValues,
  });

  const onSubmit = (values: ProductFormValues) => {
    const product: Product = {
      name: values.name,
      price: values.price,
      image: values.image,
    };

    if (selectedProduct) {
      updateProduct({ id: selectedProduct._id, product });
    } else {
      addProduct(product, {
        onSuccess: () => reset(initialValues),
      });
    }
  };

  return (
    <VStack
      as="form"
      gap={1}
      align={"stretch"}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <FloatingInput
            label="Product Name"
            name="name"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
          />
        )}
      />

      <Controller
        name="price"
        control={control}
        render={({ field }) => (
          <FloatingInput
            label="Price"
            type="number"
            name="price"
            value={
              field.value === undefined || Number.isNaN(field.value)
                ? ""
                : field.value
            }
            onChange={(e) => {
              const val = e.target.value;
              field.onChange(val === "" ? undefined : Number(val));
            }}
            onBlur={field.onBlur}
            error={errors.price?.message}
          />
        )}
      />

      <Controller
        name="image"
        control={control}
        render={({ field }) => (
          <FloatingInput
            label="Image URL"
            name="image"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.image?.message}
          />
        )}
      />

      <Button
        type="submit"
        loading={isLoading}
        loadingText="Saving..."
        disabled={isLoading || !isDirty || !isValid}
        h={"52px"}
        rounded={"xl"}
        colorPalette={"purple"}
        color={"white"}
        fontWeight={"semibold"}
        fontSize={"md"}
        mt={2}
      >
        {submitLabel}
      </Button>
    </VStack>
  );
};

export default ProductForm;
