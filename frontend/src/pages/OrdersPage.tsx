import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Table,
  Button,
  Badge,
  Heading,
  Spinner,
  Center,
  Container,
  Text,
  Dialog,
  Portal,
  VStack,
  HStack,
  Separator,
  CloseButton,
} from "@chakra-ui/react";
import toast from "../utils/toast";

export interface PopulatedProduct {
  _id: string;
  name: string;
  image: string;
}

export interface OrderItem {
  product: PopulatedProduct;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  phone: string;
  items: OrderItem[];
  totalAmount: number;
  paystackReference: string;
  paymentStatus: "pending" | "success" | "failed";
  deliveryStatus: "pending" | "delivered";
  createdAt: string;
  updatedAt: string;
}

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const fetchOrders = async (): Promise<Order[]> => {
  const res = await fetch("/api/orders", {
    credentials: "include",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch orders");
  return data.orders;
};

const deliverOrder = async (id: string) => {
  const res = await fetch(`/api/orders/${id}/deliver`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to update order");
  return data;
};

const OrdersPage = () => {
  const queryClient = useQueryClient();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: fetchOrders,
  });

  const { mutate: markDelivered, isPending } = useMutation({
    mutationFn: deliverOrder,
    onSuccess: () => {
      toast(true, "Order marked as delivered!");
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-count"] });
    },
  });

  if (isLoading) {
    return (
      <Center minH="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box py={8} minH={"dvh"}>
      <Container maxW={"1140px"}>
        <Heading mb={6}>Customer Orders</Heading>

        {orders.length === 0 ? (
          <Center minH="30vh">
            <Text color="gray.500">No orders yet.</Text>
          </Center>
        ) : (
          <Box overflowX="auto">
            <Table.Root variant="line" minW="900px" w="full">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Items</Table.ColumnHeader>
                  <Table.ColumnHeader>Customer</Table.ColumnHeader>
                  <Table.ColumnHeader>Amount</Table.ColumnHeader>
                  <Table.ColumnHeader>Address</Table.ColumnHeader>
                  <Table.ColumnHeader>Date Ordered</Table.ColumnHeader>
                  <Table.ColumnHeader>Status</Table.ColumnHeader>
                  <Table.ColumnHeader>Action</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((order) => (
                  <Table.Row key={order._id}>
                    <Table.Cell verticalAlign="middle" py={4} maxW="220px">
                      <Box fontSize="sm">
                        <VStack align="start" gap={0.5}>
                          {order.items.slice(0, 2).map((item) => (
                            <Text key={item.product._id} as="span">
                              {item.product.name} ×{item.quantity}
                            </Text>
                          ))}
                        </VStack>

                        {order.items.length > 2 && (
                          <Text
                            as="span"
                            display="inline-block"
                            mt={1}
                            whiteSpace="nowrap"
                            color="purple.500"
                            fontWeight="medium"
                            cursor="pointer"
                            _hover={{ textDecoration: "underline" }}
                            onClick={() => setActiveOrder(order)}
                          >
                            +{order.items.length - 2} more
                          </Text>
                        )}
                      </Box>
                    </Table.Cell>
                    <Table.Cell verticalAlign="middle" py={4}>
                      {order.customerName} ({order.customerEmail})
                    </Table.Cell>
                    <Table.Cell verticalAlign="middle" py={4}>
                      ${order.totalAmount}
                    </Table.Cell>
                    <Table.Cell verticalAlign="middle" py={4}>
                      {order.shippingAddress}
                    </Table.Cell>
                    <Table.Cell verticalAlign="middle" py={4}>
                      <Text fontSize="sm">{formatDate(order.createdAt)}</Text>
                    </Table.Cell>
                    <Table.Cell verticalAlign="middle" py={4}>
                      <VStack align="start" gap={0.5}>
                        <Badge
                          colorPalette={
                            order.deliveryStatus === "delivered"
                              ? "green"
                              : "orange"
                          }
                        >
                          {order.deliveryStatus === "delivered"
                            ? "Completed"
                            : "Pending"}
                        </Badge>
                        {order.deliveryStatus === "delivered" && (
                          <Text fontSize="xs" color="gray.500">
                            {formatDate(order.updatedAt)}
                          </Text>
                        )}
                      </VStack>
                    </Table.Cell>
                    <Table.Cell verticalAlign="middle" py={4}>
                      {order.deliveryStatus !== "delivered" && (
                        <Button
                          size="xs"
                          colorPalette="green"
                          loading={isPending}
                          onClick={() => markDelivered(order._id)}
                        >
                          Mark Completed
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
        )}
      </Container>

      <Dialog.Root
        open={!!activeOrder}
        onOpenChange={(e) => !e.open && setActiveOrder(null)}
        placement="center"
        size="md"
        closeOnInteractOutside={false}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner p={4}>
            <Dialog.Content rounded={"2xl"} w={"full"} maxW={"420px"}>
              <Dialog.Header>
                <Dialog.Title>Order Items</Dialog.Title>
              </Dialog.Header>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  position="absolute"
                  top="3"
                  right="3"
                  rounded={"lg"}
                />
              </Dialog.CloseTrigger>
              <Dialog.Body px={4}>
                <VStack
                  gap={0}
                  align="stretch"
                  maxH="360px"
                  overflowY="auto"
                  pr={3}
                >
                  {activeOrder?.items.map((item, i) => (
                    <Box key={i}>
                      <HStack justify="space-between" py={3}>
                        <VStack gap={0} align="start">
                          <Text fontSize="sm" fontWeight="medium">
                            {item.product.name}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            Qty: {item.quantity}
                          </Text>
                        </VStack>
                        <Text fontSize="sm" fontWeight="medium">
                          ${item.price}
                        </Text>
                      </HStack>
                      {i < (activeOrder?.items.length ?? 0) - 1 && (
                        <Separator />
                      )}
                    </Box>
                  ))}
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Text fontSize="sm" fontWeight="semibold">
                  Total: ${activeOrder?.totalAmount}
                </Text>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default OrdersPage;
