// 3-20 chars, letters/numbers/._
// not starting or ending with . or _
// no consecutive . or _
const USERNAME_REGEX =
  /^(?=.{3,20}$)(?![._])(?!.*[._]{2})[a-zA-Z0-9._]+(?<![._])$/;

type validation = { ok: false, reason: string } | { ok: true }
export function validateUsername(username: string): validation {
  const u = username.trim();
  if (!USERNAME_REGEX.test(u)) {
    return {
      ok: false,
      reason:
        "Username must be 3–20 chars, only letters/numbers/./_, no spaces, no __ or .., and can't start/end with . or _",
    };
  }
  return { ok: true };
}





// 1) Strong "normal email" format regex (practical, not insane RFC)
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;

// 2) If you want to allow ONLY famous providers, use a whitelist.
// Add/remove as you like.
const ALLOWED_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.ca",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "yandex.com",
  "mail.com",
  "gmx.com",
  "gmx.net",
  "fastmail.com",
  "smartcampus.com",
  "safecampus.com",
]);

/**
 * Validates an email address based on:
 * 1. Proper format
 * 2. At least one number before the '@' symbol
 * 3. Domain is in the allowed whitelist
 */
export function validateEmail(email: string): validation {
  const e = email.trim().toLowerCase();

  // Basic format check
  if (!EMAIL_REGEX.test(e)) {
    return { ok: false, reason: "Invalid email format." };
  }

  const [localPart, domain] = e.split("@");

  // Requirement: localPart must contain at least one number
  const hasNumber = /\d/.test(localPart);
  if (!hasNumber) {
    return {
      ok: false,
      reason: "Email must contain at least one number before the '@' symbol (e.g., user1@example.com)."
    };
  }

  // Domain validation
  if (!ALLOWED_EMAIL_DOMAINS.has(domain)) {
    return {
      ok: false,
      reason: `The domain '${domain}' is not allowed. Please use a trusted provider.`
    };
  }

  // Explicitly block "abc@abc.com" (redundant but requested)
  if (e === "abc@abc.com") {
    return { ok: false, reason: "This specific email is not allowed." };
  }

  return { ok: true };
}

