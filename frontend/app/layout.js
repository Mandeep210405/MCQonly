import SessionWrapper from '@/utils/SessionWrapper'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'InternOS',
  description: 'Intern Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <div>
          <SessionWrapper>
          <main>
            <Toaster />
            {children}
          </main>
          </SessionWrapper>
        </div>
      </body>
    </html>
  )
}