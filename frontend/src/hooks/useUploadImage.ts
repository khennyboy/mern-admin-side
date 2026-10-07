import { useMutation } from "@tanstack/react-query";
import { api } from "../utils/api"; // adjust this path to where your api file lives

const uploadImageRequest = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file); // must match upload.single("image") on the backend

  const data = await api("/upload", { method: "POST", body: formData });
  return data.url;
};

const useUploadImage = () => {
  const { mutate, isPending, error } = useMutation({
    mutationFn: uploadImageRequest,
  });

  return { uploadImage: mutate, isUploading: isPending, uploadError: error };
};

export default useUploadImage;