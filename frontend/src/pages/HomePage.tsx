import {
  Box,
  Center,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { LuPackageOpen } from "react-icons/lu";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../component/product-card";

import { IoWarning } from "react-icons/io5";
import { useColorModeValue } from "../components/ui/color-mode";
import useGetProducts from "../hooks/useGetProducts";
import Productpagination from "../component/Productpagination";
import { useProductStore } from "../store/product-store";
import { useShallow } from "zustand/react/shallow";
import { computePagination } from "../utils/compute-pagination";

const HomePage = () => {
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const emptyBg = useColorModeValue("white", "gray.900");
  const emptyBorder = useColorModeValue("gray.200", "gray.800");

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const goToPage = (nextPage: number) => {
    setSearchParams((prev) => {
      prev.set("page", String(nextPage));
      return prev;
    });
  };

  const { isLoading, error } = useGetProducts(page);

  const { products, totalProducts, pageSize } = useProductStore(
    useShallow((state) => ({
      products: state.products,
      totalProducts: state.totalProducts,
      pageSize: state.pageSize,
    })),
  );

  const pagination = computePagination(page, totalProducts, pageSize);

  if (error) {
    return (
      <Container
        maxW={"480px"}
        py={12}
        minH={"dvh"}
        display={"flex"}
        alignItems={"center"}
      >
        <Box
          w={"full"}
          bg={emptyBg}
          border="1px solid"
          borderColor={"red.500"}
          rounded={"lg"}
          py={3}
          px={2}
        >
          <HStack gap={0.5} align={"center"} justify={"center"}>
            <IoWarning color="red" />
            <Text>{error}</Text>
          </HStack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW={"1140px"} py={8} minH={"dvh"}>
      <VStack gap={7} align={"stretch"}>
        <VStack gap={0.5} align={"start"}>
          <Heading
            fontSize={"3xl"}
            fontWeight={"extrabold"}
            letterSpacing={"tight"}
          >
            Your Products
          </Heading>
          <Text color={subTextColor} fontSize={"md"}>
            {isLoading
              ? "Loading your products…"
              : `${totalProducts} product${products.length === 1 ? "" : "s"} in your store`}
          </Text>
          <Text color={subTextColor} fontSize={"sm"}>
            {totalProducts !== 0 && pageSize < totalProducts
              ? `Showing pages ${page} of ${pagination.totalPages}`
              : ""}
          </Text>
        </VStack>

        {isLoading ? (
          <Center py={24}>
            <Spinner size="lg" color="purple.500" />
          </Center>
        ) : products.length === 0 ? (
          <Box
            bg={emptyBg}
            border="1px solid"
            borderColor={emptyBorder}
            rounded={"2xl"}
            py={20}
          >
            <VStack gap={3}>
              <Box color={subTextColor}>
                <LuPackageOpen size={40} />
              </Box>
              <Text fontWeight={"semibold"} fontSize={"lg"}>
                No products yet
              </Text>
              <Text
                color={subTextColor}
                fontSize={"sm"}
                maxW={"280px"}
                textAlign={"center"}
              >
                Start building your catalog by adding your first product.
              </Text>
              <Link to={"/create"}>
                <Text
                  color={"purple.500"}
                  fontWeight={"semibold"}
                  fontSize={"sm"}
                  _hover={{ textDecoration: "underline" }}
                  mt={2}
                >
                  Create a product →
                </Text>
              </Link>
            </VStack>
          </Box>
        ) : (
          <Box>
            <SimpleGrid columns={{ base: 2, md: 2, lg: 3 }} gap={6} w={"full"}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </SimpleGrid>

            <Productpagination
              pagination={pagination}
              page={page}
              onPageChange={goToPage}
            />
          </Box>
        )}
      </VStack>
    </Container>
  );
};

export default HomePage;
