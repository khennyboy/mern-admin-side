import { useMutation } from "@tanstack/react-query";
import { api } from "../utils/api";
import type { ProductImage } from "../utils/types";

type UploadResult = {
  success: boolean;
  images: ProductImage[];
};

const uploadImagesRequest = async (files: File[]): Promise<UploadResult> => {
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));
  return await api("/upload", { method: "POST", body: formData });
};

const useUploadImages = () => {
  const { mutate, isPending, error } = useMutation({
    mutationFn: uploadImagesRequest,
  });

  return { uploadImages: mutate, isUploading: isPending, uploadError: error };
};

export default useUploadImages;