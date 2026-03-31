"use client"

import Sidebar from '@/components/Sidebar'
import ChatbotWidget from '@/components/chatbot/ChatbotWidget'
import React from 'react'
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';


function layout({ children }) {
     const { data: session, status} = useSession();
     const router = useRouter();
     
  if (status === "unauthenticated") {
    router.push("/auth/login");
  }
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div
                style={{
                   flex: 1,
            marginLeft: '260px',
            padding: '36px 40px',
            minHeight: '100vh',
            background: 'var(--bg-base)',
                }}
            >
                {children}
            </div>
            <ChatbotWidget />
        </div>
    )
}

export default layout