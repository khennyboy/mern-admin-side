import { Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";

export default function BackButton({ fallback = "/" }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      mb={4}
      onClick={handleBack}
      display="inline-flex"
      alignItems="center"
      gap={2}
    >
      <LuArrowLeft /> Back
    </Button>
  );
}
