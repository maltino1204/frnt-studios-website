import { DisplayFontScope } from "@/components/brand/display-font";

/** The kit pages keep the preloaded display face (src/components/brand/display-font.tsx). */
export default function KitLayout({ children }: { children: React.ReactNode }) {
  return <DisplayFontScope>{children}</DisplayFontScope>;
}
