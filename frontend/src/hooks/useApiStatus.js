import { useEffect, useState } from "react";

export function useApiStatus() {
  const [status, setStatus] = useState("Checking");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => {
        if (!response.ok) {
          throw new Error("API request failed");
        }

        return response.json();
      })
      .then(() => {
        setStatus("Connected");
      })
      .catch(() => {
        setStatus("Unavailable");
      });
  }, []);

  return status;
}
