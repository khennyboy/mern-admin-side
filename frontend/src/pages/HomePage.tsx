import {
  Box,
  Button,
  Center,
  Container,
  HStack,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useSearchParams } from "react-router-dom";
import CustomPagination from "../component/CustomPagination";
import ProductCard from "../component/product-card";
import useGetProducts from "../hooks/useGetProducts";
import { computePagination } from "../utils/compute-pagination";
import { CATEGORIES } from "../utils/schema";

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const category = searchParams.get("category") || "all";

  const { products, totalProducts, pageSize, isLoading, isPlaceholderData } =
    useGetProducts();

  const pagination = computePagination(page, totalProducts, pageSize);

  const setCategory = (value: string) => {
    setSearchParams((prev) => {
      if (value === "all") prev.delete("category");
      else prev.set("category", value);
      prev.delete("page");
      return prev;
    });
  };

  const goToPage = (nextPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", String(nextPage));
      return prev;
    });
  };

  return (
    <Container maxW="7xl" py={8}>
      <Heading mb={2}>Your Products</Heading>
      <Text color="gray.500" mb={6}>
        {totalProducts} product{totalProducts === 1 ? "" : "s"} in your store
      </Text>

      {/* FILTER BAR */}
      <HStack gap={2} mb={6} overflowX="auto" pb={2} flexWrap="wrap">
        <Button
          size="sm"
          rounded="full"
          flexShrink={0}
          colorPalette="purple"
          variant={category === "all" ? "solid" : "outline"}
          onClick={() => setCategory("all")}
        >
          All
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            rounded="full"
            flexShrink={0}
            colorPalette="purple"
            variant={category === cat ? "solid" : "outline"}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </Button>
        ))}
      </HStack>

      {/* GRID */}
      {isLoading ? (
        <Center minH="40vh">
          <Spinner size="xl" />
        </Center>
      ) : products.length === 0 ? (
        <Center minH="30vh">
          <Text color="gray.500">
            {category === "all"
              ? "No products yet."
              : "No products match this filter."}
          </Text>
        </Center>
      ) : (
        <SimpleGrid
          columns={{ base: 1, sm: 2, md: 3, lg: 4 }}
          gap={5}
          opacity={isPlaceholderData ? 0.5 : 1}
          transition="opacity 0.2s ease"
          pointerEvents={isPlaceholderData ? "none" : "auto"}
        >
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </SimpleGrid>
      )}

      {products.length > 0 && (
        <Box mt={8}>
          <CustomPagination
            pagination={pagination}
            page={page}
            onPageChange={goToPage}
          />
        </Box>
      )}
    </Container>
  );
};

export default HomePage;
