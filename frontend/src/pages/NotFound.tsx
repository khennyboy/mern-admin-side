import { Link } from "react-router-dom";
import { Button, Center, VStack, Heading, Text } from "@chakra-ui/react";

const NotFoundPage = () => {
  return (
    <Center minH="70vh" px={4}>
      <VStack gap={4} textAlign="center">
        <Heading size="2xl">404</Heading>
        <Text color="gray.500">The page you're looking for doesn't exist.</Text>
        <Button asChild colorPalette="purple" rounded="lg">
          <Link to="/">Back to Home</Link>
        </Button>
      </VStack>
    </Center>
  );
};

export default NotFoundPage;
