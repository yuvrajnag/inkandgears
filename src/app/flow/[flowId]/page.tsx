import { FlowCanvas } from "@/components/flow/FlowCanvas";

export default async function Page({ params }: PageProps<"/flow/[flowId]">) {
  const { flowId } = await params;
  return <FlowCanvas flowId={flowId} />;
}
