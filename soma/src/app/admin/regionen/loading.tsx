import { ListPageSkeleton } from "@/components/admin/skeletons";

export default function Loading() {
  return <ListPageSkeleton stats={0} fields={0} cols={9} />;
}
