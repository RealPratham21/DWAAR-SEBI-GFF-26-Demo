/** Public demo credentials for the pre-filled Nivara Techfab workspace. */
export const NIVARA_DEMO = {
  email: 'nivara.demo@example.com',
  password: 'Password1',
  issuerName: 'Nivara Techfab Private Limited',
} as const;

export function getNivaraDemoLoginHref(): string {
  return `/login?email=${encodeURIComponent(NIVARA_DEMO.email)}`;
}
