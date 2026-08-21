import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Mon Agenda Pédago',
  description: 'Application de planification pédagogique pour enseignantes',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 font-sans">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}
