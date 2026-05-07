import { AppShell } from "@/components/app-shell";
import { SectionCard } from "@/components/section-card";
import { channels } from "@/lib/mock-data";

export default function ChannelsPage() {
  return (
    <AppShell
      title="Channels"
      description="View each channel as a business unit with its own audience, cadence, and revenue profile."
    >
      <SectionCard
        title="Channel health"
        description="The next iteration can plug these cards into YouTube Data API and Analytics API sync jobs."
      >
        <table className="table">
          <thead>
            <tr>
              <th>Channel</th>
              <th>Niche</th>
              <th>Subscribers</th>
              <th>30-day views</th>
              <th>Revenue</th>
              <th>Stage</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id}>
                <td>
                  <strong>{channel.name}</strong>
                  <br />
                  <span className="muted">{channel.audience}</span>
                </td>
                <td>{channel.niche}</td>
                <td>{channel.subscribers.toLocaleString("en-US")}</td>
                <td>{channel.last30DayViews.toLocaleString("en-US")}</td>
                <td>${channel.revenueEstimateUsd.toLocaleString("en-US")}</td>
                <td>{channel.monetizationStage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>
    </AppShell>
  );
}
