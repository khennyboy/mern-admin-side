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
import { useSearchParams } from "react-router-dom";
import Custompagination from "../component/CustomPagination";
import { computePagination } from "../utils/compute-pagination";

export interface PopulatedProduct {
  _id: string;
  name: string;
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
  deliveryStatus: "pending" | "delivered";
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  totalOrders: number;
  pageSize: number;
  message?: string;
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

const fetchOrders = async (page: number): Promise<OrdersResponse> => {
  const res = await fetch(`/api/orders?pageO=${page}`, {
    credentials: "include",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || "Failed to fetch orders");
  return data;
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

  const [searchParams, setSearchParams] = useSearchParams();
  // get the page number from searchParams
  const page = Number(searchParams.get("pageO")) || 1;

  // link to go to any page
  const goToPage = (nextPage: number) => {
    setSearchParams((prev) => {
      prev.set("page)", String(nextPage));
      return prev;
    });
  };

  // tanstack orders fxn
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", page],
    queryFn: () => fetchOrders(page),
  });
  const orders = data?.data || [];
  console.log(orders);
  const pagination = computePagination(
    page,
    data?.totalOrders || 0,
    data?.pageSize || 10,
  );

  // tanstack mark fxns
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
            <Table.Root variant={"line"}>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>S/N</Table.ColumnHeader>
                  <Table.ColumnHeader minW="150px">Items</Table.ColumnHeader>
                  <Table.ColumnHeader minW="220px">Customer</Table.ColumnHeader>
                  <Table.ColumnHeader minW="90px">Amount</Table.ColumnHeader>
                  <Table.ColumnHeader minW="320px">Address</Table.ColumnHeader>
                  <Table.ColumnHeader minW="140px">
                    Date Ordered
                  </Table.ColumnHeader>
                  <Table.ColumnHeader minW="110px">Status</Table.ColumnHeader>
                  <Table.ColumnHeader minW="130px">Action</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {orders.map((order, index) => (
                  <Table.Row key={order._id}>
                    <Table.Cell verticalAlign="middle" py={4}>
                      {index + 1}.
                    </Table.Cell>
                    <Table.Cell verticalAlign="middle" py={4}>
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
      <Custompagination
        pagination={pagination}
        page={page}
        onPageChange={goToPage}
      />
    </Box>
  );
};

export default OrdersPage;
