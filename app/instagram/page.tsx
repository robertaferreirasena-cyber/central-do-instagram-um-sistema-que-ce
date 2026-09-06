import { redirect } from 'next/navigation';

// A Central virou seções focadas (o menu lateral navega). /instagram cai em Leads.
export default function InstagramPage() {
  redirect('/instagram/leads');
}
