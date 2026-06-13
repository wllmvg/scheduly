import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../layouts/AppLayout";

import Home from "../pages/Home";
import Result from "../pages/Result";
import Credits from "../pages/Credits";
import Features from "../pages/Features";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
      {
        path: "/features",
        element: <Features />,
      },
      {
        path: "/credits",
        element: <Credits />,
      },
      {
        path: "/result",
        element: <Result />,
      },
    ],
  },
]);