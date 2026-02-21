'use client';

import { appEnv } from '../../../shared/config/env';
import { useKitchenReportQuery } from '../../../entities/kitchen-report/model/use-kitchen-report-query';
import { Card } from '../../../shared/ui/card';

export function KitchenReportsWidget() {
  const propertyId = appEnv.propertyId;
  const reportQuery = useKitchenReportQuery(propertyId);

  return (
    <div className="grid cols-4">
      <Card title="Orders">
        <div className="kpi">{reportQuery.data.totalOrders}</div>
      </Card>
      <Card title="Delivered">
        <div className="kpi">{reportQuery.data.deliveredOrders}</div>
      </Card>
      <Card title="Cancelled">
        <div className="kpi">{reportQuery.data.cancelledOrders}</div>
      </Card>
      <Card title="Avg Prep Time">
        <div className="kpi">{reportQuery.data.averagePrepMinutes}m</div>
      </Card>

      <Card title="Top Items">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {reportQuery.data.topItems.map((item) => (
              <tr key={item.name}>
                <td>{item.name}</td>
                <td>{item.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {reportQuery.data.topItems.length === 0 ? <p className="note">No top items yet.</p> : null}
      </Card>
    </div>
  );
}
