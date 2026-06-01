export function money(value: number) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 0
  }).format(value);
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("fr-MA", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
