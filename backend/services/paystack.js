const BASE_URL = "https://api.paystack.co";

const headers = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  "Content-Type": "application/json",
});

async function sendCustomer(url, method, body) {
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (res.ok) return null;

  const data = await res.json().catch(() => ({}));
  return data.message || "Request failed";
}

export async function saveCustomerDetails({ email, name, phone }) {
  try {
    const [firstName, ...rest] = name.trim().split(/\s+/);
    const base = {
      first_name: firstName,
      last_name: rest.join(" ") || undefined,
    };
    const withPhone = phone ? { ...base, phone: phone.trim() } : base;

    const found = await fetch(
      `${BASE_URL}/customer/${encodeURIComponent(email)}`,
      { headers: headers() },
    );
    const foundData = await found.json();
    const exists = found.ok && foundData.status;

    const url = exists
      ? `${BASE_URL}/customer/${foundData.data.customer_code}`
      : `${BASE_URL}/customer`;
    const method = exists ? "PUT" : "POST";
    const build = (details) => (exists ? details : { email, ...details });

    let failure = await sendCustomer(url, method, build(withPhone));

    
    if (failure && phone) {
      console.warn(
        `Paystack rejected the phone number "${phone}": ${failure}. Saving the name only.`,
      );
      failure = await sendCustomer(url, method, build(base));
    }

    if (failure) throw new Error(failure);
  } catch (error) {
    console.error("Could not save the customer details on Paystack:", error.message);
  }
}

export async function getAvailableBalance() {
  try {
    const res = await fetch(`${BASE_URL}/balance`, { headers: headers() });
    const data = await res.json();

    if (!res.ok || !data.status) return null;

    const naira = data.data.find((entry) => entry.currency === "NGN");
    return naira ? naira.balance / 100 : null;
  } catch (error) {
    console.error("Could not fetch the Paystack balance:", error.message);
    return null;
  }
}