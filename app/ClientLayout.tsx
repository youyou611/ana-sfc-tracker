"use client";

import React from "react";

type ClientLayoutProps = {
  children: React.ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  return <>{children}</>;
}
