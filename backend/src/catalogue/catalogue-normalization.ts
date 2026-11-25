export function normalizeCatalogueValue(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleUpperCase('en-US')
    .replace(/[^A-Z0-9]/g, '');
}
