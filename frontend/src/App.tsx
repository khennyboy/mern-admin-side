import { Box } from "@chakra-ui/react";
import { Route, Routes } from "react-router-dom";
import NavBar from "./component/NavBar";
import { useColorModeValue } from "./components/ui/color-mode";
import CreatePage from "./pages/CreatePage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";

import ConfirmDeleteDialog from "./component/ConfirmDalog";
import Footer from "./component/Footer";
import ProtectedRoute from "./component/ProtectedRoute";
import UpdateDialog from "./component/UpdateDialog";
import { Toaster } from "./components/ui/toaster";
import NotFoundPage from "./pages/NotFound";
import OrdersPage from "./pages/OrdersPage";

function App() {
  return (
    <Box minH={"100vh"} bg={useColorModeValue("gray.50", "gray.950")}>
      <Routes>
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
                <Route path="*" element={<NotFoundPage />} />
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
