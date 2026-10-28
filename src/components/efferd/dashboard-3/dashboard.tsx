import { ChannelBreakdownChart } from "./channel-breakdown-chart";
import { ConversationVolumeChart } from "./conversation-volume-chart";
import { CsatResponsesChart } from "./csat-responses-chart";
import { FirstReplyTimeChart } from "./first-reply-time-chart";
import { RecentConversations } from "./recent-conversations";
import { DashboardStats } from "./stats";
import { SupportActivity } from "./support-activity";
import { TeamOnDuty } from "./team-on-duty";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<DashboardStats />
			<ConversationVolumeChart />
			<ChannelBreakdownChart />
			<CsatResponsesChart />
			<FirstReplyTimeChart />
			<TeamOnDuty />
			<RecentConversations />
			<SupportActivity />
		</div>
	);
}
