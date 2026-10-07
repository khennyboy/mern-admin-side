import { Box, Button, Image, Input, Text, VStack } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import useAddProduct from "../hooks/useAddProduct";
import useUpdateProduct from "../hooks/useUpdateproduct";
import { useProductStore } from "../store/product-store";
import { productSchema } from "../utils/schema";
import type { Product, ProductFormProps } from "../utils/types";
import FloatingInput from "./FloatingInput";
import useUploadImage from "../hooks/useUploadImage";

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormOutput = z.output<typeof productSchema>;

const ProductForm = ({ submitLabel = "Save" }: ProductFormProps) => {
  const selectedProduct = useProductStore((state) => state.selectedProduct);

  const initialValues: ProductFormInput = {
    name: selectedProduct?.name || "",
    price: selectedProduct?.price.toString() || "",
    quantity: selectedProduct?.quantity.toString() || "",
    image: selectedProduct?.image || "",
  };

  const { updateProduct, isUpdating } = useUpdateProduct();
  const { addProduct, isAdding } = useAddProduct();
  const { uploadImage, isUploading, uploadError } = useUploadImage();

  const isLoading = isUpdating || isAdding;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
  } = useForm<ProductFormInput, undefined, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });

  const onSubmit = (values: ProductFormOutput) => {
    const product: Product = {
      name: values.name,
      price: values.price,
      image: values.image,
      quantity: values.quantity,
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
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.price?.message}
          />
        )}
      />

      <Controller
        name="image"
        control={control}
        render={({ field }) => (
          <Box mb={2}>
            {field.value && (
              <Image
                src={field.value}
                alt="Product preview"
                boxSize="120px"
                objectFit="cover"
                rounded="lg"
                mb={2}
              />
            )}

            <Input
              type="file"
              accept="image/*"
              pt={3}
              h="52px"
              rounded="xl"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                uploadImage(file, {
                  onSuccess: (url) => field.onChange(url),
                });
              }}
            />

            <Text color="red.500" fontSize="xs" my={1} minH="16px">
              {isUploading
                ? "Uploading..."
                : uploadError?.message || errors.image?.message}
            </Text>
          </Box>
        )}
      />
      <Controller
        name="quantity"
        control={control}
        render={({ field }) => (
          <FloatingInput
            label="Quantity in stock"
            type="number"
            name="quantity"
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={errors.quantity?.message}
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
