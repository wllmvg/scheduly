import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";

import { router } from "./routes/Router";
import { SchedulyProvider } from "./context/SchedulyContext";
import WakeUpLoader from "./components/WakeUpLoader";

ReactDOM.createRoot(
  document.getElementById("root")!
).render(
  <SchedulyProvider>
    <WakeUpLoader>
      <RouterProvider router={router} />
    </WakeUpLoader>
  </SchedulyProvider>
);