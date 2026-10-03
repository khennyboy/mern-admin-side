import {
  AspectRatio,
  Badge,
  Box,
  Heading,
  HStack,
  IconButton,
  Image,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { CiEdit } from "react-icons/ci";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useColorModeValue } from "../components/ui/color-mode";
import { useProductStore } from "../store/product-store";
import type { ProductCardProps } from "../utils/types";
import { useShallow } from "zustand/react/shallow";

const LOW_STOCK = 5;

const getStockInfo = (quantity: number) => {
  if (quantity <= 0) return { label: "Out of stock", palette: "red" };
  if (quantity <= LOW_STOCK)
    return { label: `Only ${quantity} left`, palette: "orange" };
  return { label: `${quantity} in stock`, palette: "green" };
};

const ProductCard = ({ product }: ProductCardProps) => {
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.800");
  const priceBg = useColorModeValue("purple.50", "purple.950");
  const priceColor = useColorModeValue("purple.700", "purple.300");

  const stock = getStockInfo(product.quantity);

  const { setSelectedProduct, setUpdateDialog, setDeleteDialog } =
    useProductStore(
      useShallow((state) => ({
        setSelectedProduct: state.setSelectedProduct,
        setUpdateDialog: state.setUpdateDialog,
        setDeleteDialog: state.setDeleteDialog,
      })),
    );

  return (
    <Box
      bg={bg}
      border="1px solid"
      borderColor={borderColor}
      rounded={"2xl"}
      overflow={"hidden"}
      transition={"all 0.2s ease"}
      role="group"
      _hover={{ transform: "translateY(-3px)", shadow: "lg" }}
    >
      <AspectRatio ratio={4 / 3}>
        <Image
          src={product.image}
          alt={product.name}
          loading="lazy"
          objectFit={"cover"}
        />
      </AspectRatio>

      <Box py={4}>
        <Heading as="h3" size="sm" mb={2} lineClamp={1} pl={{ base: 2, md: 4 }}>
          {product.name}
        </Heading>

        <Box pl={{ base: 2, md: 4 }} mb={3}>
          <Badge
            colorPalette={stock.palette}
            variant="subtle"
            rounded="full"
            px={2}
          >
            {stock.label}
          </Badge>
        </Box>

        <HStack
          justify={"space-between"}
          align={"center"}
          px={{ base: 1, md: 4 }}
        >
          <Box
            bg={priceBg}
            color={priceColor}
            px={3}
            py={1}
            rounded={"full"}
            fontWeight={"bold"}
            fontSize={"sm"}
          >
            ${product.price}
          </Box>

          {/* Icons: visible md and up */}
          <HStack gap={1} display={{ base: "none", md: "flex" }}>
            <IconButton
              aria-label="Edit product"
              variant={"ghost"}
              size={"sm"}
              rounded={"lg"}
              onClick={() => {
                setUpdateDialog(true);
                setSelectedProduct(product);
              }}
            >
              <CiEdit />
            </IconButton>
            <IconButton
              aria-label="Delete product"
              variant={"ghost"}
              size={"sm"}
              rounded={"lg"}
              colorPalette={"red"}
              onClick={() => {
                setDeleteDialog(true);
                setSelectedProduct(product);
              }}
            >
              <MdOutlineDeleteOutline />
            </IconButton>
          </HStack>

          {/* Ellipsis menu: visible below md */}
          <Box display={{ base: "block", md: "none" }}>
            <Menu.Root positioning={{ placement: "bottom-end" }}>
              <Menu.Trigger asChild>
                <IconButton
                  aria-label="Product actions"
                  variant={"ghost"}
                  size={"xs"}
                  rounded={"lg"}
                  onClick={(e) => e.stopPropagation()}
                >
                  <BsThreeDotsVertical />
                </IconButton>
              </Menu.Trigger>
              <Portal>
                <Menu.Positioner>
                  <Menu.Content rounded={"xl"} w={"fit-content"} minW={0}>
                    <Menu.Item
                      px={4}
                      rounded={"lg"}
                      cursor={"pointer"}
                      value="edit"
                      onClick={() => {
                        setUpdateDialog(true);
                        setSelectedProduct(product);
                      }}
                    >
                      <HStack gap={2}>
                        <CiEdit />
                        <Box>Edit</Box>
                      </HStack>
                    </Menu.Item>
                    <Menu.Item
                      px={4}
                      rounded={"lg"}
                      cursor={"pointer"}
                      value="delete"
                      color={"red.500"}
                      onClick={() => {
                        setDeleteDialog(true);
                        setSelectedProduct(product);
                      }}
                    >
                      <HStack gap={2}>
                        <MdOutlineDeleteOutline />
                        <Box>Delete</Box>
                      </HStack>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </Box>
        </HStack>
      </Box>
    </Box>
  );
};

export default ProductCard;