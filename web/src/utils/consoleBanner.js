import { API_BASE_URL } from '../config/api'

export function printFrontendBanner() {
  const rows = [
    'Specora frontend is live',
    `Mode     : ${import.meta.env.MODE}`,
    `API Base : ${API_BASE_URL}`,
    `Health   : ${API_BASE_URL}/health`,
  ]
  const width = Math.max(...rows.map((row) => row.length), 24)
  const border = `+${'-'.repeat(width + 2)}+`

  console.log(border)
  rows.forEach((row) => console.log(`| ${row.padEnd(width)} |`))
  console.log(border)
}
