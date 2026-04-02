// lib/graphql-client.js
export async function gqlFetch(query, variables = {}) {
  const url = process.env.HASURA_URL || process.env.NEXT_PUBLIC_HASURA_URL
  const secret = process.env.HASURA_ADMIN_SECRET || process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET

  if (!url) {
    throw new Error('HASURA_URL is not defined in environment variables')
  }

  console.log('GraphQL Request:', { url, query: query.substring(0, 200), variables })

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': secret,
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  })

  const json = await res.json()
  
  if (json.errors) {
    console.error('GraphQL Errors:', json.errors)
    throw new Error(json.errors[0].message)
  }
  
  return json.data
}