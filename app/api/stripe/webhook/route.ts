import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId
    if (userId && session.subscription) {
      const sub = await stripe.subscriptions.retrieve(session.subscription as string)
      const periodEnd = (sub as unknown as { current_period_end: number }).current_period_end
      await supabase.from('profiles').upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        subscription_status: sub.status,
        subscription_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      })
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const subAny = sub as unknown as { current_period_end: number }
    const customerId = sub.customer as string
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()
    if (profile) {
      await supabase.from('profiles').update({
        subscription_status: sub.status,
        subscription_period_end: subAny.current_period_end
          ? new Date(subAny.current_period_end * 1000).toISOString()
          : null,
      }).eq('id', profile.id)
    }
  }

  return NextResponse.json({ received: true })
}
