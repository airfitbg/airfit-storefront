export function isProd() {
  return process.env.NEXT_PUBLIC_ENV === 'production'
}
