// src/components/Footer.jsx
import React from "react";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer style={{
      textAlign: "center",
      padding: "1rem",
      fontSize: "0.85rem",
      color: "#666",
      borderTop: "1px solid #ddd",
      marginTop: "2rem"
    }}>
      © {currentYear} Rainbow Juice. All rights reserved.
    </footer>
  );
}
