import { DisplayFontScope } from "@/components/brand/display-font";

/** The offline page keeps the preloaded display face (src/components/brand/display-font.tsx). */
export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DisplayFontScope>{children}</DisplayFontScope>;
}
