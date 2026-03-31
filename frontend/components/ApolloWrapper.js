'use client'

import { ApolloProvider } from '@apollo/client'
import client from '@/lib/graphql-client'

export default function ApolloWrapper({ children }) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  )
}