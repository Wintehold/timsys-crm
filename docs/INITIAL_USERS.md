# Initial Users

Preview 2 seeds three required accounts. Temporary passwords are known demo credentials and must be changed at first login.

| Username | Temporary password | Role | Must change password |
| --- | --- | --- | --- |
| `luci` | `GOT2026GOT` | `LUCIFER` | `true` |
| `Hicham` | `12345678` | `ADMIN` | `true` |
| `Alie` | `12345678` | `CONSEILLER` | `true` |

Passwords are hashed by the backend before storage. Never store production passwords in clear text and never commit Supabase credentials.

## Role Notes

- `luci` is the omniscient account and remains hidden from ADMIN and CONSEILLER views.
- `Hicham` can manage counselor accounts and business data, but cannot see LUCIFER accounts.
- `Alie` can manage assigned clients, assigned requests, and owned Vision Cards.
