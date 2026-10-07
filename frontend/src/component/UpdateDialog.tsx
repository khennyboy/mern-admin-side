import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
import ProductForm from "./ProductForm";
import type { ProductDetail } from "../utils/types";

interface UpdateDialog {
  updateDialog: boolean;
  setUpdateDialog: (x: null) => void;
  product: ProductDetail;
}
const UpdateDialog = ({
  updateDialog,
  setUpdateDialog,
  product,
}: UpdateDialog) => {
  return (
    <Dialog.Root
      open={updateDialog}
      onOpenChange={(e) => !e.open && setUpdateDialog(null)}
      placement={"center"}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner p={4}>
          <Dialog.Content rounded={"2xl"} w={"full"} maxW={"420px"}>
            <Dialog.Header>
              <Dialog.Title fontSize={"lg"} fontWeight={"bold"}>
                Update Product
              </Dialog.Title>
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
