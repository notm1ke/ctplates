import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";
import 'animate.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "CT Vanity Plates",
    description: "Check the availability of Connecticut license plates.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    );
}
