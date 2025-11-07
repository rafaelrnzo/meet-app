import MeetingClient from "@/components/meeting/MeetingClient";

export default async function MeetingPage({
  params,
}: {
  params: Promise<{ room: string }>;
}) {
  const { room } = await params;

  return <MeetingClient room={room} />;
}
