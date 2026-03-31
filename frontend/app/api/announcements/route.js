import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { gqlFetch } from '@/lib/graphql-client'

const GET_ANNOUNCEMENTS = `
  query GetAnnouncements {
    announcements(order_by: { created_at: desc }) {
      id title body audience created_at created_by
      user { name }
    }
  }
`

const INSERT_ANNOUNCEMENT = `
  mutation InsertAnnouncement(
    $title: String!
    $body: String!
    $audience: String!
    $created_by: uuid
  ) {
    insert_announcements_one(object: {
      title: $title
      body: $body
      audience: $audience
      created_by: $created_by
    }) {
      id title body audience created_at created_by
      user { name }
    }
  }
`

const UPDATE_ANNOUNCEMENT = `
  mutation UpdateAnnouncement(
    $id: uuid!
    $title: String!
    $body: String!
    $audience: String!
  ) {
    update_announcements_by_pk(
      pk_columns: { id: $id }
      _set: { title: $title, body: $body, audience: $audience }
    ) {
      id title body audience created_at created_by
      user { name }
    }
  }
`

const DELETE_ANNOUNCEMENT = `
  mutation DeleteAnnouncement($id: uuid!) {
    delete_announcements_by_pk(id: $id) {
      id
    }
  }
`

// Helper — only admin and hr can modify
function canManage(role) {
  return role === 'admin' || role === 'hr'
}

// Helper — filter announcements by role
function filterForRole(announcements, role) {
  if (role === 'admin' || role === 'hr' || role === 'mentor') {
    return announcements
  }
  if (role === 'intern') {
    return announcements.filter(a => a.audience === 'all' || a.audience === 'interns_only')
  }
  return []
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const role    = session?.user?.role ?? 'intern'

    const data  = await gqlFetch(GET_ANNOUNCEMENTS)
    const all   = data?.announcements ?? []
    const items = filterForRole(all, role)

    return NextResponse.json({ announcements: items })
  } catch (error) {
    console.error('Announcements GET error:', error.message)
    return NextResponse.json({ announcements: [] }, { status: 200 })
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    const role    = session?.user?.role

    // Block non-admin/hr
    if (!canManage(role)) {
      return NextResponse.json({ error: 'Not authorized to create announcements' }, { status: 403 })
    }

    const { title, body, audience, created_by } = await request.json()
    if (!title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
    }

    const data = await gqlFetch(INSERT_ANNOUNCEMENT, {
      title:      title.trim(),
      body:       body.trim(),
      audience:   audience || 'all',
      created_by: created_by || null,
    })
    return NextResponse.json(data?.insert_announcements_one ?? {}, { status: 201 })
  } catch (error) {
    console.error('Announcements POST error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions)
    const role    = session?.user?.role

    if (!canManage(role)) {
      return NextResponse.json({ error: 'Not authorized to edit announcements' }, { status: 403 })
    }

    const { id, title, body, audience } = await request.json()
    if (!id || !title?.trim() || !body?.trim()) {
      return NextResponse.json({ error: 'id, title and body are required' }, { status: 400 })
    }

    const data = await gqlFetch(UPDATE_ANNOUNCEMENT, {
      id,
      title:    title.trim(),
      body:     body.trim(),
      audience: audience || 'all',
    })
    return NextResponse.json(data?.update_announcements_by_pk ?? {}, { status: 200 })
  } catch (error) {
    console.error('Announcements PUT error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions)
    const role    = session?.user?.role

    if (!canManage(role)) {
      return NextResponse.json({ error: 'Not authorized to delete announcements' }, { status: 403 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const data = await gqlFetch(DELETE_ANNOUNCEMENT, { id })
    return NextResponse.json(data?.delete_announcements_by_pk ?? {}, { status: 200 })
  } catch (error) {
    console.error('Announcements DELETE error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}