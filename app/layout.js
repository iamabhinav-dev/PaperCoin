// app/layout.js
import './globals.css';

export const metadata = {
  title: 'PaperCoin - Risk-Free Crypto Trading',
  description: 'Learn and practice crypto trading with virtual currency',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
          {children}
      </body>
    </html>
  );
}