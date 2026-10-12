import {
  Badge,
  Box,
  Button,
  Center,
  Container,
  Dialog,
  HStack,
  Heading,
  IconButton,
  Image,
  Portal,
  Separator,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { CiEdit } from "react-icons/ci";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { LuChevronLeft, LuChevronRight, LuX } from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../component/ConfirmDalog";
import UpdateDialog from "../component/UpdateDialog";
import useDeleteProduct from "../hooks/useDeleteproduct";
import useGetProduct from "../hooks/useGetProduct";
import { money, type ConfirmAction } from "../utils/orders";
import type { ProductDetail } from "../utils/types";

const ProductDetailPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: product, isLoading } = useGetProduct(slug);
  const { deleteProduct } = useDeleteProduct();

  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [updateData, setUpdateData] = useState<ProductDetail | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const next = useCallback(() => {
    if (!product) return;
    setLightboxIndex((i) =>
      i === null ? 0 : (i + 1) % product.images.length,
    );
  }, [product]);

  const prev = useCallback(() => {
    if (!product) return;
    setLightboxIndex((i) =>
      i === null
        ? 0
        : (i - 1 + product.images.length) % product.images.length,
    );
  }, [product]);

  // keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, next, prev, closeLightbox]);

  if (isLoading) {
    return (
      <Center minH="60vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!product) {
    return (
      <Center minH="60vh">
        <VStack>
          <Text>Product not found.</Text>
          <Button onClick={() => navigate("/")} variant="outline">
            Back home
          </Button>
        </VStack>
      </Center>
    );
  }

  const images = product.images;
  const [main, ...rest] = images;
  const currentImage = lightboxIndex !== null ? images[lightboxIndex] : null;

  return (
    <Container maxW="6xl" py={8}>
      <Button variant="ghost" mb={4} onClick={() => navigate(-1)}>
        ← Back
      </Button>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={8}>
        {/* ─── GALLERY ────────────────────────────────────────────── */}
        <VStack align="stretch" gap={3}>
          {/* big main image */}
          <Box
            rounded="2xl"
            overflow="hidden"
            cursor="zoom-in"
            bg="gray.100"
            _dark={{ bg: "gray.800" }}
            onClick={() => setLightboxIndex(0)}
          >
            <Image
              src={main?.url}
              alt={product.name}
              objectFit="cover"
              w="full"
              aspectRatio={4 / 3}
            />
          </Box>

          {/* small squares for the rest */}
          {rest.length > 0 && (
            <HStack gap={2} flexWrap="wrap">
              {rest.map((img, i) => {
                const index = i + 1;
                return (
                  <Box
                    key={img.publicId || img.url}
                    onClick={() => setLightboxIndex(index)}
                    cursor="zoom-in"
                    rounded="lg"
                    overflow="hidden"
                    border="2px solid"
                    borderColor="transparent"
                    _hover={{ borderColor: "purple.400" }}
                    transition="all 0.15s ease"
                    boxSize="72px"
                  >
                    <Image
                      src={img.url}
                      alt={`${product.name} ${index + 1}`}
                      boxSize="72px"
                      objectFit="cover"
                    />
                  </Box>
                );
              })}
            </HStack>
          )}
        </VStack>

        {/* ─── INFO ───────────────────────────────────────────────── */}
        <VStack align="stretch" gap={4}>
          <HStack justify="space-between" align="start" wrap="wrap" gap={3}>
            <Heading size="lg">{product.name}</Heading>

            {/* desktop: full labeled buttons */}
            <HStack gap={2} display={{ base: "none", md: "flex" }}>
              <Button
                variant="outline"
                rounded="lg"
                onClick={() => setUpdateData(product)}
              >
                <CiEdit />
                Edit
              </Button>
              <Button
                colorPalette="red"
                rounded="lg"
                onClick={() => setConfirm({ kind: "delete", product })}
              >
                <MdOutlineDeleteOutline />
                Delete
              </Button>
            </HStack>

            {/* mobile: icon-only buttons */}
            <HStack gap={1} display={{ base: "flex", md: "none" }}>
              <IconButton
                aria-label="Edit"
                variant="ghost"
                onClick={() => setUpdateData(product)}
              >
                <CiEdit />
              </IconButton>
              <IconButton
                aria-label="Delete"
                variant="ghost"
                colorPalette="red"
                onClick={() => setConfirm({ kind: "delete", product })}
              >
                <MdOutlineDeleteOutline />
              </IconButton>
            </HStack>
          </HStack>

          <HStack gap={2}>
            <Badge colorPalette="purple" variant="subtle" rounded="full" px={3}>
              {product.category}
            </Badge>
            <Badge
              colorPalette={product.quantity > 0 ? "green" : "red"}
              variant="subtle"
              rounded="full"
              px={3}
            >
              {product.quantity > 0
                ? `${product.quantity} in stock`
                : "Out of stock"}
            </Badge>
          </HStack>

          <Text fontSize="3xl" fontWeight="bold" color="purple.500">
            {money(product.price)}
          </Text>

          <Separator />

          <Box>
            <Heading size="sm" mb={2}>
              Description
            </Heading>
            <Text
              color="gray.600"
              _dark={{ color: "gray.300" }}
              whiteSpace="pre-wrap"
            >
              {product.description}
            </Text>
          </Box>
        </VStack>
      </SimpleGrid>

      {/* ─── LIGHTBOX ──────────────────────────────────────────── */}
      <Dialog.Root
        open={lightboxIndex !== null}
        onOpenChange={(e) => !e.open && closeLightbox()}
        size="xl"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content
              bg="transparent"
              shadow="none"
              maxW="5xl"
              w="full"
              position="relative"
            >
              <Dialog.Body p={0} position="relative">
                {currentImage && (
                  <Box position="relative">
                    {/* close button top-right */}
                    <IconButton
                      aria-label="Close"
                      position="absolute"
                      top={2}
                      right={2}
                      zIndex={2}
                      rounded="full"
                      onClick={closeLightbox}
                    >
                      <LuX />
                    </IconButton>

                    {/* prev arrow */}
                    {images.length > 1 && (
                      <IconButton
                        aria-label="Previous"
                        position="absolute"
                        left={2}
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={2}
                        rounded="full"
                        size="lg"
                        onClick={prev}
                      >
                        <LuChevronLeft />
                      </IconButton>
                    )}

                    {/* fixed-size image container */}
                    <Box
                      w="full"
                      maxW="900px"
                      h="600px"
                      maxH="80vh"
                      mx="auto"
                      bg="blackAlpha.700"
                      rounded="xl"
                      overflow="hidden"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Image
                        src={currentImage.url}
                        alt={product.name}
                        w="full"
                        h="full"
                        objectFit="contain"
                        p={2}
                      />
                    </Box>

                    {/* next arrow */}
                    {images.length > 1 && (
                      <IconButton
                        aria-label="Next"
                        position="absolute"
                        right={2}
                        top="50%"
                        transform="translateY(-50%)"
                        zIndex={2}
                        rounded="full"
                        size="lg"
                        onClick={next}
                      >
                        <LuChevronRight />
                      </IconButton>
                    )}

                    {/* counter */}
                    {images.length > 1 && (
                      <Box
                        position="absolute"
                        bottom={3}
                        left="50%"
                        transform="translateX(-50%)"
                        bg="blackAlpha.700"
                        color="white"
                        px={3}
                        py={1}
                        rounded="full"
                        fontSize="sm"
                      >
                        {lightboxIndex! + 1} / {images.length}
                      </Box>
                    )}
                  </Box>
                )}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* ─── DIALOGS ──────────────────────────────────────────── */}
      <ConfirmDialog
        openDialog={!!confirm}
        setDialogData={setConfirm}
        action={confirm}
        onDelete={(id) =>
          deleteProduct(id, {
            onSuccess: () => {
              setConfirm(null);
              navigate("/");
            },
          })
        }
      />

      {updateData && (
        <UpdateDialog
          updateDialog={!!updateData}
          setUpdateDialog={setUpdateData}
          product={updateData}
        />
      )}
    </Container>
  );
};

export default ProductDetailPage;