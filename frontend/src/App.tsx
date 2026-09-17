import { Box } from "@chakra-ui/react";
import NavBar from "./component/NavBar";
import CreatePage from "./pages/CreatePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import { Route, Routes } from "react-router-dom";
import { useColorModeValue } from "./components/ui/color-mode";

import Footer from "./component/Footer";
import ProtectedRoute from "./component/ProtectedRoute";
import { Toaster } from "./components/ui/toaster";
import ConfirmDeleteDialog from "./component/ConfirmDalog";
import UpdateDialog from "./component/UpdateDialog";
import OrdersPage from "./pages/OrdersPage";
import NotFoundPage from "./pages/NotFound";

function App() {
  return (
    <Box minH={"100vh"} bg={useColorModeValue("gray.50", "gray.950")}>
      <Routes>
        <Route path="*" element={<NotFoundPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <NavBar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/orders" element={<OrdersPage />} />
              </Routes>
              <UpdateDialog />
              <ConfirmDeleteDialog />
              <Footer />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
    </Box>
  );
}

export default App;
