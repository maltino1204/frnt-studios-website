import { ListPageSkeleton } from "@/components/admin/skeletons";

/** Own skeleton (search, two segmented filters, one chip filter, six columns); the overview has none since A5-9. */
export default function Loading() {
  return <ListPageSkeleton fields={4} cols={6} />;
}
