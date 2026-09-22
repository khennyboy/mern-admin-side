import {
  Box,
  Badge,
  Button,
  Container,
  Flex,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { FaRegMoon } from "react-icons/fa";
import { MdOutlineWbSunny } from "react-icons/md";
import { LuPlus, LuLogOut, LuPackage } from "react-icons/lu";
import { Link } from "react-router-dom";
import { useColorMode, useColorModeValue } from "../components/ui/color-mode";
import useLogout from "../hooks/useLogout";
import { api } from "../utils/api";

const fetchOrdersCount = async (): Promise<number> => {
  const data = await api("/orders/count");
  return data.count;
};

const NavBar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const borderColor = useColorModeValue("gray.200", "gray.800");
  const bg = useColorModeValue("white", "gray.900");
  const { logout, isLoading: isLoggingOut } = useLogout();

  const { data: ordersCount = 0 } = useQuery({
    queryKey: ["orders-count"],
    queryFn: fetchOrdersCount,
    refetchInterval: 30000,
  });

  return (
    <Box
      as="nav"
      bg={bg}
      borderBottom="1px solid"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Container maxW={"1140px"} py={3}>
        <Flex alignItems={"center"} justifyContent={"space-between"}>
          <Link to={"/"}>
            <HStack>
              <Box
                w={8}
                h={8}
                rounded={"lg"}
                bg={"purple.500"}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                color={"white"}
                fontWeight={"bold"}
                fontSize={"sm"}
              >
                P
              </Box>
              <Text
                fontSize={{ base: "sm", md: "xl" }}
                fontWeight={"bold"}
                lineHeight={"shorter"}
                letterSpacing={"tight"}
                color={useColorModeValue("gray.900", "white")}
              >
                Product <Box as="br" display={{ base: "block", md: "none" }} />
                Store
              </Text>
            </HStack>
          </Link>

          <HStack>
            <Link to={"/orders"}>
              <Box position="relative" display="inline-block">
                <Button
                  variant={"ghost"}
                  rounded={"lg"}
                  size={{ base: "xs", md: "sm" }}
                >
                  <LuPackage size={16} />
                  <Text display={{ base: "none", sm: "block" }}>Orders</Text>
                </Button>
                {ordersCount > 0 && (
                  <Badge
                    colorPalette="red"
                    borderRadius="full"
                    position="absolute"
                    top="-6px"
                    right="-6px"
                    minW="18px"
                    h="18px"
                    px={1}
                    fontSize="10px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {ordersCount > 99 ? "99+" : ordersCount}
                  </Badge>
                )}
              </Box>
            </Link>

            <Link to={"/create"}>
              <Button
                colorPalette="purple"
                rounded={"lg"}
                size={{ base: "xs", md: "sm" }}
              >
                <LuPlus size={16} />
                <Text display={{ base: "none", sm: "block" }}>New Product</Text>
              </Button>
            </Link>

            <Button
              onClick={toggleColorMode}
              variant={"ghost"}
              rounded={"lg"}
              size={{ base: "xs", md: "sm" }}
            >
              {colorMode === "light" ? <FaRegMoon /> : <MdOutlineWbSunny />}
            </Button>
            <Button
              onClick={() => logout()}
              loading={isLoggingOut}
              variant={"ghost"}
              rounded={"lg"}
              size={{ base: "xs", md: "sm" }}
              colorPalette={"red"}
            >
              <LuLogOut size={16} />
            </Button>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
};

export default NavBar;
