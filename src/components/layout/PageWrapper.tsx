import { ReactNode } from 'react'
import Footer from './Footer'
import Navbar from './Navbar'

export default function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-on-background selection:bg-primary-container selection:text-on-primary">
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
