import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import ProductForm from "./ProductForm";
import type { ProductDetail } from "../utils/types";

interface UpdateDialogProps {
  updateDialog: boolean;
  setUpdateDialog: (x: null) => void;
  product: ProductDetail;
}

const UpdateDialog = ({
  updateDialog,
  setUpdateDialog,
  product,
}: UpdateDialogProps) => {
  return (
    <Dialog.Root
      open={updateDialog}
      onOpenChange={(e) => !e.open && setUpdateDialog(null)}
      placement="center"
      preventScroll           // ← locks page scroll while open
      scrollBehavior="inside" // ← scrolls the body, not the whole dialog
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p={4}>
          <Dialog.Content
            rounded="2xl"
            w="full"
            maxW="420px"
            maxH="90vh"        // ← never taller than the viewport
            display="flex"
            flexDirection="column"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="lg" fontWeight="bold">
                Update Product
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="sm"
                position="absolute"
                top="3"
                right="3"
                rounded="lg"
              />
            </Dialog.CloseTrigger>

            <Dialog.Body
              px={4}
              pb={10}
              overflowY="auto"    // ← only the body scrolls
              flex={1}
              minH={0}            // ← required for flex children to shrink
            >
              <ProductForm
                submitLabel="Save Changes"
                product={product}
                onSuccess={() => setUpdateDialog(null)}
              />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default UpdateDialog;