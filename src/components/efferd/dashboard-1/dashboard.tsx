"use client";

import { useDashboardData } from "../dashboard-context";
import { DashboardInvoices } from "./dashboard-invoices";
import { SalesChart } from "./sales-chart";
import { DashboardStats } from "./stats";

export function Dashboard() {
	const data = useDashboardData();
	return (
		<div className="flex flex-1 flex-col gap-6 py-6">
			<div className="flex flex-col gap-1">
				<h1 className="font-heading font-semibold text-xl leading-tight">
					Welcome back, {data.firstName}!
				</h1>
				<p className="text-base text-muted-foreground">
					{data.organiser ? "Here’s how the group is doing." : "Here’s your walking at a glance."}
				</p>
			</div>
			<div className="rounded-lg overflow-hidden border">
				<div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-3">
					<DashboardStats />
					<SalesChart />
					<DashboardInvoices />
				</div>
			</div>
		</div>
	);
}
