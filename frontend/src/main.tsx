import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";

import { router } from "./routes/Router";

import { SchedulyProvider } from "./context/SchedulyContext";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <SchedulyProvider>
    <RouterProvider router={router} />
  </SchedulyProvider>
);