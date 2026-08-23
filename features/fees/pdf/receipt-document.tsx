import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FeeInvoice, FeeInvoiceItem, FeePayment } from "@/types/fees";
import type { SchoolSettings } from "@/types/settings";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1e293b", fontFamily: "Helvetica" },
  schoolName: { fontSize: 18, fontWeight: 700 },
  schoolMeta: { fontSize: 9, color: "#64748b", marginTop: 2 },
  title: { fontSize: 14, fontWeight: 700, marginTop: 24, marginBottom: 4 },
  receiptNo: { fontSize: 10, color: "#64748b", marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  label: { color: "#64748b" },
  value: { fontWeight: 700 },
  divider: { borderBottomWidth: 1, borderBottomColor: "#e2e8f0", marginVertical: 12 },
  table: { marginTop: 8 },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: { flexDirection: "row", paddingVertical: 2 },
  colFeeType: { flex: 3 },
  colAmount: { flex: 1, textAlign: "right" },
  totalsBlock: { marginTop: 16, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  paidLabel: { fontSize: 12, fontWeight: 700 },
  paidValue: { fontSize: 12, fontWeight: 700 },
  footer: { marginTop: 40, fontSize: 8, color: "#94a3b8", textAlign: "center" },
});

export function FeeReceiptDocument({
  school,
  payment,
  invoice,
  items,
  feeTypeNameById,
  studentName,
  admissionNo,
  className,
  sectionName,
  paidToDate,
  balance,
}: {
  school: SchoolSettings;
  payment: FeePayment;
  invoice: FeeInvoice;
  items: FeeInvoiceItem[];
  feeTypeNameById: Map<string, string>;
  studentName: string;
  admissionNo: string;
  className: string | null;
  sectionName: string | null;
  paidToDate: number;
  balance: number;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.schoolName}>{school.school_name}</Text>
          {school.address && <Text style={styles.schoolMeta}>{school.address}</Text>}
          <Text style={styles.schoolMeta}>
            {[school.contact_phone, school.contact_email].filter(Boolean).join("  ·  ")}
          </Text>
        </View>

        <Text style={styles.title}>Fee Receipt</Text>
        <Text style={styles.receiptNo}>Receipt No. {payment.receipt_no}</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Student</Text>
          <Text style={styles.value}>
            {studentName} ({admissionNo})
          </Text>
        </View>
        {className && (
          <View style={styles.row}>
            <Text style={styles.label}>Class</Text>
            <Text style={styles.value}>
              {className}
              {sectionName ? ` - ${sectionName}` : ""}
            </Text>
          </View>
        )}
        <View style={styles.row}>
          <Text style={styles.label}>Invoice</Text>
          <Text style={styles.value}>{invoice.invoice_no}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment date</Text>
          <Text style={styles.value}>{payment.payment_date}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Payment mode</Text>
          <Text style={styles.value}>{payment.payment_mode.replace("_", " ")}</Text>
        </View>
        {payment.transaction_ref && (
          <View style={styles.row}>
            <Text style={styles.label}>Reference</Text>
            <Text style={styles.value}>{payment.transaction_ref}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <Text style={{ marginBottom: 4, color: "#64748b" }}>Invoice line items</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={styles.colFeeType}>Fee type</Text>
            <Text style={styles.colAmount}>Amount</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colFeeType}>{feeTypeNameById.get(item.fee_type_id) ?? "—"}</Text>
              <Text style={styles.colAmount}>Rs. {item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalsRow}>
            <Text style={styles.label}>Invoice total</Text>
            <Text style={styles.value}>Rs. {invoice.total_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={[styles.paidLabel]}>This payment</Text>
            <Text style={styles.paidValue}>Rs. {payment.amount.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.label}>Paid to date</Text>
            <Text style={styles.value}>Rs. {paidToDate.toFixed(2)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.label}>Balance</Text>
            <Text style={styles.value}>Rs. {balance.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          This is a system-generated receipt and does not require a signature.
        </Text>
      </Page>
    </Document>
  );
}
