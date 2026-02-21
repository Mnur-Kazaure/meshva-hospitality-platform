import { FinanceShell } from '../dashboard-shell/ui/finance-shell';

export default function InvoicesFoliosPage() {
  return (
    <FinanceShell title="Invoices & Folios">
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Guest</th>
              <th>Status</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4}>No invoices loaded.</td>
            </tr>
          </tbody>
        </table>
      </section>
      <p className="note">Wire to `GET /v1/properties/:propertyId/invoices` and `POST /v1/properties/:propertyId/invoices/:invoiceId/adjustments`.</p>
    </FinanceShell>
  );
}
