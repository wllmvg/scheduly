import Hero from "../components/Hero";
import Loader from "../components/Loader";

import { useScheduly } from "../context/SchedulyContext";

export default function Home() {
  const { loading } = useScheduly();

  return (
    <>
      {loading && <Loader />}

      <Hero />

    </>
  );
}