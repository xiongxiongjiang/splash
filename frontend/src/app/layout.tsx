import { ReactNode } from 'react';
import './globals.css';

type Props = {
  children: ReactNode;
};

// Root layout must include html and body tags
export default function RootLayout({ children }: Props) {
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}
