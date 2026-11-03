import { BillingHealth } from "./billing-health";
import { ChannelSalesChart } from "./channel-sales-chart";
import { DashboardActivity } from "./dashboard-activity";
import { DashboardInvoices } from "./dashboard-invoices";
import { NetRevenueChart } from "./net-revenue-chart";
import { DashboardStats } from "./stats";

export function Dashboard() {
	return (
		// Four to a row only when the dashboard itself is wide enough (the open sidebar
		// takes room too), or the Notices and Activity boxes get squashed.
		<div className="@container">
			<div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border bg-border md:grid-cols-2 @min-[60rem]:grid-cols-4">
				<DashboardStats />
				<NetRevenueChart />
				<ChannelSalesChart />
				<DashboardInvoices />
				<BillingHealth />
				<DashboardActivity />
			</div>
		</div>
	);
}
