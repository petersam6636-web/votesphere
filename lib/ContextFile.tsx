"use client";

import { useState, type ReactNode } from "react";
import { appContext } from "./appContext";

export default function ContextFile({
  children,
}: {
  children: ReactNode;
}) {
  const [userInfo, setUserInfo] = useState("");

  return (
    <appContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </appContext.Provider>
  );
}