import {
  Box,
  Button,
  Center,
  CloseButton,
  Container,
  Dialog,
  Heading,
  HStack,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Custompagination from "../component/CustomPagination";
import OrderDialog from "../component/OrderDialog";
import { OrdersTable } from "../component/OrdersTable";
import { useOrderAction } from "../hooks/useOrderAction";
import { computePagination } from "../utils/compute-pagination";
import { FILTERS } from "../utils/orderfilters";
import type { ConfirmAction, Order, PendingAction } from "../utils/orders";
import {
  deliverOrder,
  fetchOrders,
  getAllItems,
  money,
  refundOrder,
} from "../utils/orders";

const OrdersPage = () => {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [confirm, setConfirm] = useState<ConfirmAction>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("pageO")) || 1;
  const status = searchParams.get("status") || "all";

  // to go to next page of the orders
  const goToPage = (nextPage: number) => {
    setSearchParams((prev) => {
      prev.set("pageO", String(nextPage));
      return prev;
    });
  };

  // to change orders filter value
  const changeFilter = (value: string) => {
    setSearchParams((prev) => {
      prev.set("status", value);
      prev.delete("pageO");
      return prev;
    });
  };

  // to fetch orders
  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["admin-orders", page, status],
    queryFn: () => fetchOrders(page, status),
    refetchInterval: 30000,
    placeholderData: keepPreviousData,
  });

  const orders = data?.data || [];
  const pageSize = data?.pageSize || 10;

  const pagination = computePagination(page, data?.totalOrders || 0, pageSize);

  // to deliver order
  const { mutate: markDelivered } = useOrderAction(
    deliverOrder,
    "Order marked as delivered!",
    "complete",
    setPending,
  );
  // to refund customer
  const { mutate: refund } = useOrderAction(
    refundOrder,
    "Refund sent to the customer",
    "refund",
    setPending,
  );

  // what is doing the actual work 
  const runConfirmed = () => {
    if (!confirm) return;
    if (confirm.kind === "refund") refund(confirm.order._id);
    else markDelivered(confirm.order._id);
    setConfirm(null);
  };

  if (isLoading) {
    return (
      <Center minH="50vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box py={8} minH={"dvh"}>
      <Container>
        <Heading mb={4}>Customer Orders</Heading>

        <HStack gap={2} mb={6} overflowX="auto" pb={1} flexWrap={"wrap"}>
          {FILTERS.map((filter) => (
            <Button
              key={filter.value}
              size="sm"
              rounded="full"
              flexShrink={0}
              colorPalette="purple"
              variant={status === filter.value ? "solid" : "outline"}
              onClick={() => changeFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </HStack>

        {orders.length === 0 ? (
          <Center minH="30vh">
            <Text color="gray.500">
              {status === "all"
                ? "No orders yet."
                : "No orders match this filter."}
            </Text>
          </Center>
        ) : (
          <OrdersTable
            orders={orders}
            page={page}
            pageSize={pageSize}
            pending={pending}
            isPlaceholderData={isPlaceholderData}
            onShowMore={setActiveOrder}
            onRequestRefund={(order) => setConfirm({ kind: "refund", order })}
            onRequestComplete={(order) =>
              setConfirm({ kind: "complete", order })
            }
            onDeliver={markDelivered}
          />
        )}
      </Container>

      {/* items dialog */}
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
                  {activeOrder && (
                    <OrderDialog items={getAllItems(activeOrder)} />
                  )}
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <HStack justify="space-between" w="full">
                  <Text fontSize="sm" fontWeight="semibold">
                    Paid: {money(activeOrder?.totalAmount ?? 0)}
                  </Text>
                  {(activeOrder?.refundAmount ?? 0) > 0 && (
                    <Text
                      fontSize="sm"
                      color={
                        activeOrder?.refundStatus === "refund_needed"
                          ? "red.500"
                          : "gray.500"
                      }
                    >
                      {activeOrder?.refundStatus === "refund_needed"
                        ? "Refund due"
                        : "Refunded"}
                      : {money(activeOrder?.refundAmount ?? 0)}
                    </Text>
                  )}
                </HStack>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* confirm dialog */}
      <Dialog.Root
        open={!!confirm}
        onOpenChange={(e) => !e.open && setConfirm(null)}
        placement="center"
        size="md"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner p={4}>
            <Dialog.Content rounded={"2xl"} w={"full"} maxW={"420px"}>
              <Dialog.Header>
                <Dialog.Title>
                  {confirm?.kind === "refund"
                    ? "Refund customer?"
                    : "Mark order completed?"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {confirm?.kind === "refund" ? (
                  <Text fontSize="sm">
                    Are you sure you want to refund the Customer
                  </Text>
                ) : (
                  <Text fontSize="sm">
                    Are you sure you've delivered the order
                  </Text>
                )}
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="outline"
                  rounded="lg"
                  onClick={() => setConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  rounded="lg"
                  colorPalette={confirm?.kind === "refund" ? "red" : "green"}
                  onClick={runConfirmed}
                >
                  {confirm?.kind === "refund"
                    ? `Refund ${money(confirm.order.refundAmount ?? 0)}`
                    : "Mark completed"}
                </Button>
              </Dialog.Footer>
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
