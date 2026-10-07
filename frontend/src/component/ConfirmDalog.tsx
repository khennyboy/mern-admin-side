import { Button, Dialog, Portal, Text } from "@chakra-ui/react";
import { money, type ConfirmAction } from "../utils/orders";

interface ConfirmDialogProps {
  action: ConfirmAction;
  openDialog: boolean;
  setDialogData: (x: null) => void;
  onRefund?: (orderId: string) => void;
  onComplete?: (orderId: string) => void;
  onDelete?: (productId: string) => void;
}

const ConfirmDialog = ({
  action,
  openDialog,
  setDialogData,
  onRefund,
  onComplete,
  onDelete,
}: ConfirmDialogProps) => {
  const runConfirmed = () => {
    if (!action) return;
    if (action.kind === "refund") onRefund?.(action.order!._id);
    else if (action.kind === "complete") onComplete?.(action.order!._id);
    else if (action.kind === "delete") onDelete?.(action.product!._id);
    setDialogData(null);
  };

  // title + body + button text per action
  const copy = {
    refund: {
      title: "Refund customer?",
      body: "This will refund the customer and mark the affected items as refunded. This action cannot be undone.",
      button: `Refund ${money(action?.order?.refundAmount ?? 0)}`,
      palette: "red",
    },
    complete: {
      title: "Mark order completed?",
      body: "This confirms the order has been delivered to the customer. You can't undo this from here.",
      button: "Mark completed",
      palette: "green",
    },
    delete: {
      title: "Delete product?",
      body: `You're about to permanently delete "${
        action?.product?.name ?? "this product"
      }". This cannot be undone.`,
      button: "Delete product",
      palette: "red",
    },
  } as const;

  if (!action) return null;
  const current = copy[action.kind];

  return (
    <Dialog.Root
      open={openDialog}
      onOpenChange={(e) => !e.open && setDialogData(null)}
      placement="center"
      size="md"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p={4}>
          <Dialog.Content rounded="2xl" w="full" maxW="420px">
            <Dialog.Header>
              <Dialog.Title>{current.title}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Text fontSize="sm">{current.body}</Text>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="outline"
                rounded="lg"
                onClick={() => setDialogData(null)}
              >
                Cancel
              </Button>
              <Button
                rounded="lg"
                colorPalette={current.palette}
                onClick={runConfirmed}
              >
                {current.button}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ConfirmDialog;
