import { Box, HStack, Separator, Text, VStack } from "@chakra-ui/react";
import { flagColor, flagLabel, money, type DisplayItem } from "../utils/orders";

// to show the orders in a dialog when the user click show more
const OrderDialog = ({ items }: { items: DisplayItem[] }) => (
  <>
    {items.map((item, i) => (
      <Box key={i}>
        <HStack justify="space-between" py={3}>
          <VStack gap={0} align="start">
            <Text fontSize="sm" fontWeight="medium">
              {item.name}{" "}
              {item.flag && (
                <Text as="span" color={flagColor(item.flag)}>
                  {flagLabel(item.flag)}
                </Text>
              )}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Qty: {item.quantity}
            </Text>
          </VStack>
          <Text fontSize="sm" fontWeight="medium">
            {money(item.price)}
          </Text>
        </HStack>
        {i < items.length - 1 && <Separator />}
      </Box>
    ))}
  </>
);

export default OrderDialog;
