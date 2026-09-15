import {
  Box,
  Link as ChakraLink,
  Container,
  Flex,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useColorModeValue } from "../components/ui/color-mode";

const Footer = () => {
  const bg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.200", "gray.800");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const headingColor = useColorModeValue("gray.900", "white");

  return (
    <Box
      as="footer"
      bg={bg}
      borderTop="1px solid"
      borderColor={borderColor}
      mt={12}
    >
      <Container maxW={"1140px"} py={10}>
        <Flex
          direction={{ base: "column", md: "row" }}
          justify={"space-between"}
          alignItems={"center"}
          textAlign={{ base: "center", md: "start" }}
          gap={8}
        >
          <VStack gap={2} alignItems={{ base: "center", md: "start" }}>
            <HStack gap={2}>
              <Box
                w={7}
                h={7}
                rounded={"lg"}
                bg={"purple.500"}
                display={"flex"}
                alignItems={"center"}
                justifyContent={"center"}
                color={"white"}
                fontWeight={"bold"}
                fontSize={"xs"}
              >
                P
              </Box>
              <Text fontWeight={"bold"} color={headingColor}>
                Product Store
              </Text>
            </HStack>
            <Text color={subTextColor} fontSize={"sm"} maxW={"280px"}>
              A simple place to list and manage products, built with the MERN
              stack.
            </Text>
          </VStack>

          <HStack gap={8} align={"start"}>
            <VStack align={"start"} gap={2}>
              <Text
                fontWeight={"semibold"}
                fontSize={"sm"}
                color={headingColor}
              >
                Navigate
              </Text>
              <Link to={"/"}>
                <Text
                  fontSize={"sm"}
                  color={subTextColor}
                  _hover={{ color: "purple.500" }}
                >
                  Home
                </Text>
              </Link>
              <Link to={"/create"}>
                <Text
                  fontSize={"sm"}
                  color={subTextColor}
                  _hover={{ color: "purple.500" }}
                >
                  New Product
                </Text>
              </Link>
            </VStack>

            <VStack align={"start"} gap={2}>
              <Text
                fontWeight={"semibold"}
                fontSize={"sm"}
                color={headingColor}
              >
                Connect
              </Text>
              <HStack gap={3}>
                <ChakraLink
                  href="https://github.com/khennyboy"
                  target="_blank"
                  rel="noopener noreferrer"
                  color={subTextColor}
                  _hover={{ color: "purple.500" }}
                >
                  <FaGithub size={18} />
                </ChakraLink>
                <ChakraLink
                  href="https://www.linkedin.com/in/sheriff-abdullateef-kehinde-3b7545249"
                  target="_blank"
                  rel="noopener noreferrer"
                  color={subTextColor}
                  _hover={{ color: "purple.500" }}
                >
                  <FaLinkedin size={18} />
                </ChakraLink>
              </HStack>
            </VStack>
          </HStack>
        </Flex>

        <Box borderTop="1px solid" borderColor={borderColor} mt={8} pt={6}>
          <Text fontSize={"xs"} color={subTextColor} textAlign={"center"}>
            © {new Date().getFullYear()} Product Store. Built by Sheriff.
          </Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
