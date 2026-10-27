/* Web Push subscriptions (docs/SPECS_API.md section 9). */

export interface PushSub { endpoint: string; keys: { p256dh: string; auth: string }; tz: string; hour: number }
