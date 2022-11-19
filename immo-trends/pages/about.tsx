import { useEffect } from "react";

export default function About() {
  useEffect(() => {
    fetch("/api/");
  }, []);

  return <h1>About</h1>;
}
