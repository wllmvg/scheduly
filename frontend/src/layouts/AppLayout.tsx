import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ScrollToTop from "../components/ScrollToTop";

export default function AppLayout() {
  return (
    <>
      <ScrollToTop />

      <Navbar />

      <main className="pt-20">
        <Outlet />
      </main>

      <Footer />
    </>
  );
}