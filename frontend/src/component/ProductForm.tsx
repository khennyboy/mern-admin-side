import {
  Box,
  Button,
  CloseButton,
  HStack,
  Image,
  Input,
  NativeSelect,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import useAddProduct from "../hooks/useAddProduct";
import useUpdateProduct from "../hooks/useUpdateproduct";
import useUploadImages from "../hooks/useUploadImages";
import { CATEGORIES, productSchema } from "../utils/schema";
import type { ProductFormProps, ProductPayload } from "../utils/types";
import FloatingInput from "./FloatingInput";

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormOutput = z.output<typeof productSchema>;

type ExistingImage = { url: string; publicId: string };
type PendingImage = { file: File; previewUrl: string };

const MAX_IMAGES = 5;

const ProductForm = ({
  submitLabel = "Save",
  product,
  onSuccess,
}: ProductFormProps) => {
  const initialValues: ProductFormInput = {
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "Others",
    price: product?.price.toString() || "",
    quantity: product?.quantity.toString() || "",
  };

  const { updateProduct, isUpdating } = useUpdateProduct({ onSuccess });
  const { addProduct, isAdding } = useAddProduct();
  const { uploadImages, isUploading } = useUploadImages();

  const [existing, setExisting] = useState<ExistingImage[]>(
    product?.images || [],
  );
  const [pending, setPending] = useState<PendingImage[]>([]);
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const totalCount = existing.length + pending.length;
  const remaining = MAX_IMAGES - totalCount;
  const isBusy = isUpdating || isAdding || isUploading;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput, undefined, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });

  const handleFilesSelected = (files: File[]) => {
    const room = MAX_IMAGES - totalCount;
    const accepted = files.slice(0, room);

    const newPending: PendingImage[] = accepted.map((file) => {
      const url = URL.createObjectURL(file);
      previewUrls.current.push(url);
      return { file, previewUrl: url };
    });

    setPending((prev) => [...prev, ...newPending]);
  };

  const removePending = (previewUrl: string) => {
    URL.revokeObjectURL(previewUrl);
    previewUrls.current = previewUrls.current.filter((u) => u !== previewUrl);
    setPending((prev) => prev.filter((p) => p.previewUrl !== previewUrl));
  };

  const removeExisting = (publicId: string) => {
    setExisting((prev) => prev.filter((img) => img.publicId !== publicId));
  };

  const onSubmit = async (values: ProductFormOutput) => {
    if (totalCount === 0) return;

    try {
      let uploaded: ExistingImage[] = [];
      if (pending.length > 0) {
        const result = await new Promise<ExistingImage[]>((resolve, reject) => {
          uploadImages(pending.map((p) => p.file), {
            onSuccess: (data) => resolve(data.images),
            onError: (err) => reject(err),
          });
        });
        uploaded = result;
      }

      const finalImages = [...existing, ...uploaded];

      const payload: ProductPayload = {
        name: values.name,
        description: values.description,
        category: values.category,
        price: values.price,
        quantity: values.quantity,
        images: finalImages,
      };

      if (product) {
        updateProduct({ id: product._id, product: payload }, { onSuccess });
      } else {
        addProduct(payload, {
          onSuccess: () => {
            reset(initialValues);
            setPending([]);
            setExisting([]);
            onSuccess?.();
          },
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <VStack as="form" gap={1} align="stretch" onSubmit={handleSubmit(onSubmit)}>
      {/* NAME */}
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

      {/* DESCRIPTION */}
      <Controller
        name="description"
        control={control}
        render={({ field }) => (
          <Box>
            <Textarea
              {...field}
              placeholder="Describe the product..."
              rounded="xl"
              bg="gray.100"
              _dark={{ bg: "gray.800" }}
              border="none"
              minH="100px"
              fontSize="md"
              p={4}
              _focus={{
                boxShadow: "0 0 0 2px var(--chakra-colors-purple-500)",
              }}
            />
            <Text
              color="red.500"
              fontSize="xs"
              my={1}
              minH="16px"
              visibility={errors.description ? "visible" : "hidden"}
            >
              {errors.description?.message || " "}
            </Text>
          </Box>
        )}
      />

      {/* CATEGORY */}
      <Controller
        name="category"
        control={control}
        render={({ field }) => (
          <Box>
            <NativeSelect.Root size="lg">
              <NativeSelect.Field
                {...field}
                h="52px"
                rounded="xl"
                border="none"
                bg="gray.100"
                _dark={{ bg: "gray.800" }}
                _focus={{
                  boxShadow: "0 0 0 2px var(--chakra-colors-purple-500)",
                }}
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Text
              color="red.500"
              fontSize="xs"
              my={1}
              minH="16px"
              visibility={errors.category ? "visible" : "hidden"}
            >
              {errors.category?.message || " "}
            </Text>
          </Box>
        )}
      />

      {/* PRICE */}
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

      {/* IMAGES */}
      <Box mb={2}>
        <Input
          type="file"
          accept="image/*"
          multiple
          pt={3}
          h="52px"
          rounded="xl"
          disabled={isBusy || remaining <= 0}
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (!files.length) return;
            handleFilesSelected(files);
            e.target.value = "";
          }}
        />

        <Text fontSize="xs" color="gray.500" mt={1}>
          {totalCount} / {MAX_IMAGES} images
        </Text>

        {totalCount > 0 && (
          <HStack wrap="wrap" gap={2} mt={2}>
            {existing.map((img, index) => (
              <Box key={img.publicId || img.url} position="relative">
                <Image
                  src={img.url}
                  alt={`Existing image ${index + 1}`}
                  boxSize="80px"
                  objectFit="cover"
                  rounded="lg"
                />
                <CloseButton
                  size="xs"
                  position="absolute"
                  top="-2"
                  right="-2"
                  bg="red.500"
                  color="white"
                  rounded="full"
                  _hover={{ bg: "red.600" }}
                  onClick={() => removeExisting(img.publicId)}
                />
              </Box>
            ))}

            {pending.map((p, index) => (
              <Box key={p.previewUrl} position="relative">
                <Image
                  src={p.previewUrl}
                  alt={`New image ${index + 1}`}
                  boxSize="80px"
                  objectFit="cover"
                  rounded="lg"
                  opacity={0.75}
                  border="2px dashed"
                  borderColor="purple.400"
                />
                <CloseButton
                  size="xs"
                  position="absolute"
                  top="-2"
                  right="-2"
                  bg="red.500"
                  color="white"
                  rounded="full"
                  _hover={{ bg: "red.600" }}
                  onClick={() => removePending(p.previewUrl)}
                />
              </Box>
            ))}
          </HStack>
        )}

        <Text color="red.500" fontSize="xs" my={1} minH="16px">
          {isUploading
            ? "Uploading..."
            : totalCount === 0
              ? "At least one image is required"
              : ""}
        </Text>
      </Box>

      {/* QUANTITY */}
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

      {/* SUBMIT */}
      <Button
        type="submit"
        loading={isBusy}
        loadingText={isUploading ? "Uploading images..." : "Saving..."}
        disabled={isBusy || totalCount === 0}
        h="52px"
        rounded="xl"
        colorPalette="purple"
        color="white"
        fontWeight="semibold"
        fontSize="md"
        mt={2}
      >
        {submitLabel}
      </Button>
    </VStack>
  );
};

export default ProductForm;