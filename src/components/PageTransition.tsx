import { ReactNode } from 'react';

export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="min-h-[100dvh]">{children}</div>;
}
