import { ReactNode } from "react"
import "@/app/globals.css"
import { Toaster } from "sonner"
import { Inter } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata = {
  title: 'Projektordning',
  description: 'System för projekthantering och offerter',
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="sv" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
} 