import { createBrowserRouter } from "react-router";
import CheckPage from "@/features/check/pages/CheckPage";
import ResultPage from "@/features/check/pages/ResultPage";

export const router = createBrowserRouter([
  { path: "/", element: <CheckPage /> },
  { path: "/r/:slug", element: <ResultPage /> },
]);
