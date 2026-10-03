import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Цветы — Помощник Petit Planet",
};

export default function FlowersPage() {
  return <main className="page-content" aria-label="Цветы" />;
}
