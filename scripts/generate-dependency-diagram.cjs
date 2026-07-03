const { writeFileSync } = require("node:fs");
const { resolve } = require("node:path");

const lines = [
  "Dependency Diagram - Travel Request Analysis",
  "",
  "External Database",
  "  PostgreSQL",
  "      ^",
  "      | implemented by",
  "Infrastructure",
  "  PostgresTravelRequestRepository",
  "      ^",
  "      | implements",
  "Application",
  "  TravelRequestRepository interface",
  "  ProcessTravelRequestUseCase",
  "      ^",
  "      | uses",
  "Domain",
  "  analyzeTravelRequest",
  "  TravelRequestInput / TravelRequestOutput",
  "  TravelRequestRecord",
  "",
  "Public entry point",
  "  src/main.ts -> processTravelRequest -> ProcessTravelRequestUseCase",
  "",
  "Dependency direction",
  "  main -> application -> domain",
  "  infra -> application contracts + domain types",
  "  domain has no infrastructure dependency",
];

function escapePdfText(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

const contentLines = ["BT", "/F1 14 Tf", "50 790 Td"];

for (const [index, line] of lines.entries()) {
  const fontSize = index === 0 ? 16 : 11;
  contentLines.push(`/${index === 0 ? "F2" : "F1"} ${fontSize} Tf`);
  contentLines.push(`(${escapePdfText(line)}) Tj`);
  contentLines.push("0 -22 Td");
}

contentLines.push("ET");

const stream = contentLines.join("\n");
const objects = [
  "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
  "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
  "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
  "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
  `6 0 obj\n<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream\nendobj\n`,
];

let pdf = "%PDF-1.4\n";
const offsets = [0];

for (const object of objects) {
  offsets.push(Buffer.byteLength(pdf));
  pdf += object;
}

const xrefOffset = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += "0000000000 65535 f \n";

for (const offset of offsets.slice(1)) {
  pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
}

pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

writeFileSync(resolve("docs", "dependency-diagram.pdf"), pdf);
