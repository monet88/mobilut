import { LutMetadata, LutTable } from '../model';

function formatNumber(value: number): string {
  return value.toFixed(6);
}

export function serializeCube(table: LutTable, metadata: LutMetadata): string {
  const lines: string[] = [];

  if (metadata.title) {
    lines.push(`TITLE "${metadata.title.replace(/"/g, '\\"')}"`);
  }

  for (const comment of metadata.comments) {
    lines.push(`# ${comment}`);
  }

  lines.push(`LUT_3D_SIZE ${table.size}`);
  lines.push(`DOMAIN_MIN ${metadata.domainMin.map(formatNumber).join(' ')}`);
  lines.push(`DOMAIN_MAX ${metadata.domainMax.map(formatNumber).join(' ')}`);

  for (let index = 0; index < table.data.length; index += 3) {
    lines.push(
      `${formatNumber(table.data[index])} ${formatNumber(table.data[index + 1])} ${formatNumber(table.data[index + 2])}`,
    );
  }

  return `${lines.join('\n')}\n`;
}
