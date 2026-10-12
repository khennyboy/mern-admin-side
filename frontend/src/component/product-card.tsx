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
import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { CiEdit } from "react-icons/ci";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { Link } from "react-router-dom";
import { useColorModeValue } from "../components/ui/color-mode";
import useDeleteProduct from "../hooks/useDeleteproduct";
import type { ConfirmAction } from "../utils/orders";
import type { ProductCardProps, ProductDetail } from "../utils/types";
import ConfirmDialog from "./ConfirmDalog";
import UpdateDialog from "./UpdateDialog";

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
  const [confirm, setConfirm] = useState<ConfirmAction>(null);
  const [updateData, setUpdateData] = useState<ProductDetail | null>(null);

  const stock = getStockInfo(product.quantity);

  const { deleteProduct } = useDeleteProduct();

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
  
      <Link to={`/product/${product.slug}`} style={{ display: "block" }}>
        <AspectRatio ratio={4 / 3}>
          <Image
            src={product.images[0]?.url}
            alt={product.name}
            loading="lazy"
            objectFit={"cover"}
          />
        </AspectRatio>

        <Box py={4}>
          <Heading
            as="h3"
            size="sm"
            mb={2}
            lineClamp={1}
            pl={{ base: 2, md: 4 }}
          >
            {product.name}
          </Heading>

          <HStack gap={2} pl={{ base: 2, md: 4 }} mb={3} flexWrap="wrap">
            <Badge colorPalette="purple" variant="subtle" rounded="full" px={2}>
              {product.category}
            </Badge>
            <Badge
              colorPalette={stock.palette}
              variant="subtle"
              rounded="full"
              px={2}
            >
              {stock.label}
            </Badge>
          </HStack>
        </Box>
      </Link>

      {/* NON-CLICKABLE: price + actions */}
      <HStack
        justify={"space-between"}
        align={"center"}
        px={{ base: 1, md: 4 }}
        pb={4}
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setUpdateData(product);
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setConfirm({ kind: "delete", product });
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
                      setUpdateData(product);
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
                      setConfirm({ kind: "delete", product });
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

      {/* delete dialog */}
      <ConfirmDialog
        openDialog={!!confirm}
        setDialogData={setConfirm}
        action={confirm}
        onDelete={deleteProduct}
      />

      {/* update dialog */}
      {updateData && (
        <UpdateDialog
          updateDialog={!!updateData}
          setUpdateDialog={setUpdateData}
          product={updateData}
        />
      )}
    </Box>
  );
};

export default ProductCard;