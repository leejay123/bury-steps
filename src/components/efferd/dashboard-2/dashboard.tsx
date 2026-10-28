import { BillingHealth } from "./billing-health";
import { ChannelSalesChart } from "./channel-sales-chart";
import { DashboardActivity } from "./dashboard-activity";
import { DashboardInvoices } from "./dashboard-invoices";
import { NetRevenueChart } from "./net-revenue-chart";
import { DashboardStats } from "./stats";

export function Dashboard() {
	return (
		<div className="grid grid-cols-1 gap-px bg-border p-px md:grid-cols-2 lg:grid-cols-4">
			<DashboardStats />
			<NetRevenueChart />
			<ChannelSalesChart />
			<DashboardInvoices />
			<BillingHealth />
			<DashboardActivity />
		</div>
	);
}
