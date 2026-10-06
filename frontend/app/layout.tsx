import './globals.css';

export const metadata = {
  title: 'Task Manager App',
  description: 'Hairdrama Tech Internship Assignment',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}