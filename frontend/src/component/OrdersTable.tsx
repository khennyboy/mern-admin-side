import { Box, Table, Button, Badge, Text, VStack } from "@chakra-ui/react";
import { formatDate } from "../utils/formatDate";
import { money, getAllItems, flagColor, flagLabel } from "../utils/orders";
import type { Order, PendingAction } from "../utils/orders";

interface OrdersTableProps {
  orders: Order[];
  page: number;
  pageSize: number;
  pending: PendingAction;
  isPlaceholderData: boolean;
  onShowMore: (order: Order) => void;
  onRequestRefund: (order: Order) => void;
  onRequestComplete: (order: Order) => void;
  onDeliver: (id: string) => void;
}

export const OrdersTable = ({
  orders,
  page,
  pageSize,
  pending,
  isPlaceholderData,
  onShowMore,
  onRequestRefund,
  onRequestComplete,
//   onDeliver,
}: OrdersTableProps) => (
  <Box
    overflowX="auto"
    opacity={isPlaceholderData ? 0.6 : 1}
    transition="opacity 0.15s ease"
  >
    <Table.Root variant={"line"}>
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeader>S/N</Table.ColumnHeader>
          <Table.ColumnHeader minW="220px">Items</Table.ColumnHeader>
          <Table.ColumnHeader minW="160px">Customer</Table.ColumnHeader>
          <Table.ColumnHeader minW="210px">Email</Table.ColumnHeader>
          <Table.ColumnHeader minW="90px">Amount</Table.ColumnHeader>
          <Table.ColumnHeader minW="280px">Address</Table.ColumnHeader>
          <Table.ColumnHeader minW="140px">Date Ordered</Table.ColumnHeader>
          <Table.ColumnHeader minW="130px">Status</Table.ColumnHeader>
          <Table.ColumnHeader minW="150px">Action</Table.ColumnHeader>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {orders.map((order, index) => {
          const busy = pending?.id === order._id;
          const refunding = busy && pending?.kind === "refund";
          const completing = busy && pending?.kind === "complete";

          const allItems = getAllItems(order);

          return (
            <Table.Row key={order._id}>
              <Table.Cell verticalAlign="middle" py={4}>
                {(page - 1) * pageSize + index + 1}.
              </Table.Cell>

              <Table.Cell verticalAlign="middle" py={4}>
                <Box fontSize="sm">
                  <VStack align="start" gap={0.5}>
                    {allItems.slice(0, 2).map((item, i) => (
                      <Text key={i} as="span">
                        {item.name} ×{item.quantity}{" "}
                        {item.flag && (
                          <Text as="span" color={flagColor(item.flag)}>
                            {flagLabel(item.flag)}
                          </Text>
                        )}
                      </Text>
                    ))}
                  </VStack>

                  {allItems.length > 2 && (
                    <Text
                      as="span"
                      display="inline-block"
                      mt={1}
                      whiteSpace="nowrap"
                      color="purple.500"
                      fontWeight="medium"
                      cursor="pointer"
                      _hover={{ textDecoration: "underline" }}
                      onClick={() => onShowMore(order)}
                    >
                      +{allItems.length - 2} more
                    </Text>
                  )}
                </Box>
              </Table.Cell>

              <Table.Cell verticalAlign="middle" py={4}>
                <Text fontWeight="medium">{order.customerName}</Text>
                <Text fontSize="sm" color="gray.500">
                  {order.phone}
                </Text>
              </Table.Cell>

              <Table.Cell verticalAlign="middle" py={4} wordBreak="break-all">
                {order.customerEmail}
              </Table.Cell>

              <Table.Cell verticalAlign="middle" py={4}>
                {money(order.totalAmount)}
              </Table.Cell>

              <Table.Cell verticalAlign="middle" py={4}>
                {order.shippingAddress}
              </Table.Cell>

              <Table.Cell verticalAlign="middle" py={4}>
                <Text fontSize="sm">{formatDate(order.createdAt)}</Text>
              </Table.Cell>

              <Table.Cell verticalAlign="middle" py={4}>
                <VStack align="start" gap={0.5}>
                  {order.deliveryStatus && (
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
                  )}
                  {order.deliveryStatus === "delivered" && (
                    <Text fontSize="xs" color="gray.500">
                      {formatDate(order.updatedAt)}
                    </Text>
                  )}
                  {order.refundStatus == "refund_needed" && (
                    <Text fontSize="xs" color="red.500">
                      {money(order.refundAmount ?? 0)} to refund
                    </Text>
                  )}
                  {order.refundStatus === "refunded" && (
                    <Box>
                      <Badge colorPalette={"gray"}>Refunded</Badge>
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(order.updatedAt)}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Table.Cell>

              <Table.Cell verticalAlign="middle" py={4}>
                <VStack align="stretch" gap={1}>
                  {order.refundStatus == "refund_needed" && (
                    <Button
                      size="xs"
                      colorPalette="red"
                      loading={refunding}
                      disabled={busy}
                      onClick={() => onRequestRefund(order)}
                    >
                      Refund
                    </Button>
                  )}
                  {order.deliveryStatus == "pending" && (
                    <Button
                      size="xs"
                      colorPalette="green"
                      loading={completing}
                      disabled={busy}
                      onClick={() => onRequestComplete(order)}
                    >
                      Mark Completed
                    </Button>
                  )}
                </VStack>
              </Table.Cell>
            </Table.Row>
          );
        })}
      </Table.Body>
    </Table.Root>
  </Box>
);
