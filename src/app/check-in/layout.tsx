export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
export const runtime = 'edge';

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
