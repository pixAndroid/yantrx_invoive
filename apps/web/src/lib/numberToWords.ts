const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function convertHundreds(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n];
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
  return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertHundreds(n % 100) : '');
}

/**
 * Converts a number to Indian words (Rupees and Paise).
 * e.g. 1250.50 → "Rupees One Thousand Two Hundred Fifty and Paise Fifty Only"
 */
export function numberToWords(amount: number): string {
  if (isNaN(amount) || amount < 0) return '';

  const [rupeePart, paisePart] = amount.toFixed(2).split('.');
  const rupees = parseInt(rupeePart, 10);
  const paise = parseInt(paisePart, 10);

  if (rupees === 0 && paise === 0) return 'Zero Rupees Only';

  let result = '';

  if (rupees > 0) {
    const crore = Math.floor(rupees / 10000000);
    const lakh = Math.floor((rupees % 10000000) / 100000);
    const thousand = Math.floor((rupees % 100000) / 1000);
    const hundred = rupees % 1000;

    const parts: string[] = [];
    if (crore > 0) parts.push(convertHundreds(crore) + ' Crore');
    if (lakh > 0) parts.push(convertHundreds(lakh) + ' Lakh');
    if (thousand > 0) parts.push(convertHundreds(thousand) + ' Thousand');
    if (hundred > 0) parts.push(convertHundreds(hundred));

    result = 'Rupees ' + parts.join(' ');
  }

  if (paise > 0) {
    result += (result ? ' and ' : '') + 'Paise ' + convertHundreds(paise);
  }

  return result + ' Only';
}
