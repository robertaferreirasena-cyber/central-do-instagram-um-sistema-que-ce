import { NextRequest, NextResponse } from 'next/server';
import { listFlows, createFlow, updateFlow, deleteFlow } from '@/lib/flowEngine';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const enabled = searchParams.get('enabled') ? JSON.parse(searchParams.get('enabled')!) : undefined;

    const flows = await listFlows(enabled);
    return NextResponse.json({ data: flows });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error listing flows:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const flow = await createFlow(body);

    if (!flow) {
      return NextResponse.json({ error: 'Failed to create flow' }, { status: 500 });
    }

    return NextResponse.json({ data: flow });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating flow:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 });
    }

    const flow = await updateFlow(id, updates);

    if (!flow) {
      return NextResponse.json({ error: 'Flow not found' }, { status: 404 });
    }

    return NextResponse.json({ data: flow });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error updating flow:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Flow ID is required' }, { status: 400 });
    }

    const success = await deleteFlow(parseInt(id));

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete flow' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error deleting flow:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
