import { ContactBlock, ContactFormField } from '../types/builder';

export const DEFAULT_BOOKING_SLOTS: string[] = [
  '09:00 AM',
  '10:30 AM',
  '01:00 PM',
  '02:30 PM',
  '04:00 PM',
];

export const DEFAULT_CONTACT_FIELDS: ContactFormField[] = [
  {
    id: 'field_name',
    name: 'name',
    label: 'Full Name',
    type: 'text',
    placeholder: 'Alex Morgan',
    required: true,
    step: 1,
  },
  {
    id: 'field_email',
    name: 'email',
    label: 'Work Email',
    type: 'email',
    placeholder: 'alex@company.com',
    required: true,
    step: 1,
  },
  {
    id: 'field_message',
    name: 'message',
    label: 'Project Brief',
    type: 'textarea',
    placeholder: 'Share scope, timeline, and goals...',
    required: true,
    step: 2,
  },
];

export function getEffectiveContactFields(
  props: ContactBlock['props']
): ContactFormField[] {
  if (Array.isArray(props.customFields) && props.customFields.length > 0) {
    return props.customFields;
  }
  return DEFAULT_CONTACT_FIELDS;
}

export function getEffectiveBookingSlots(
  props: ContactBlock['props']
): string[] {
  const slots = props.booking?.slots;
  if (Array.isArray(slots) && slots.length > 0) {
    return slots.filter((s) => typeof s === 'string' && s.trim().length > 0);
  }
  return DEFAULT_BOOKING_SLOTS;
}

export interface UpcomingDayOption {
  iso: string;
  weekday: string;
  dayLabel: string;
  fullLabel: string;
}

export function getUpcomingWeekdays(count = 6): UpcomingDayOption[] {
  const results: UpcomingDayOption[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  // Start from tomorrow so booking slots are actionable
  cursor.setDate(cursor.getDate() + 1);

  while (results.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      const iso = cursor.toISOString().slice(0, 10);
      const weekday = cursor.toLocaleDateString('en-US', { weekday: 'short' });
      const dayLabel = cursor.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      results.push({
        iso,
        weekday,
        dayLabel,
        fullLabel: `${weekday}, ${dayLabel}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return results;
}

export function slugifyFieldName(label: string, fallbackIndex = 1): string {
  const clean = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 32);
  return clean || `field_${fallbackIndex}`;
}
